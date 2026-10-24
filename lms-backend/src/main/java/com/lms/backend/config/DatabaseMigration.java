package com.lms.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * One-time idempotent schema migration runner.
 *
 * Handles:
 *  1. Dropping stale columns from refresh_tokens.
 *  2. Fixing placeholder YouTube IDs to real public video IDs.
 *  3. Seeding additional demo courses (Python, ML) so the course listing is populated.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // ── 1. Schema fixes (Columns) ──────────────────────────────────────
        dropColumnIfExists("refresh_tokens", "token_hash");
        dropColumnIfExists("refresh_tokens", "expires_at");
        dropColumnIfExists("enrollments", "course_id");
        
        fixEnrollmentUniqueIndex();
        
        // Fix video_progress table schema for PRD
        renameColumnIfExists("video_progress", "watched_seconds", "last_position_seconds", "INT NOT NULL DEFAULT 0");
        renameColumnIfExists("video_progress", "last_watched_at", "completed_at", "DATETIME(6) DEFAULT NULL");
        addColumnIfNotExists("video_progress", "created_at", "DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)");
        addColumnIfNotExists("video_progress", "updated_at", "DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)");

        // ── 2. Primary Keys to BIGINT ──────────────────────────────────────
        // Users first (referenced by almost everything)
        fixPrimaryKeyToBigInt("users", "id");
        fixPrimaryKeyToBigInt("courses", "id");
        fixPrimaryKeyToBigInt("sections", "id");
        fixPrimaryKeyToBigInt("videos", "id");

        // ── 3. Foreign Keys to BIGINT ──────────────────────────────────────
        // video_progress
        fixColumnTypeToBigInt("video_progress", "user_id",  "users",   "id");
        fixColumnTypeToBigInt("video_progress", "video_id", "videos",  "id");
        // enrollments
        fixColumnTypeToBigInt("enrollments",    "user_id",  "users",   "id");
        fixColumnTypeToBigInt("enrollments",    "subject_id","courses", "id");
        // refresh_tokens
        fixColumnTypeToBigInt("refresh_tokens", "user_id",  "users",   "id");
        // courses
        fixColumnTypeToBigInt("courses",        "instructor_id", "users", "id");
        // sections
        fixColumnTypeToBigInt("sections",       "course_id", "courses", "id");
        // videos
        fixColumnTypeToBigInt("videos",         "section_id", "sections", "id");

        // ── 4. Ensure Instructor exists (before seeding courses) ───────────
        Long instructorId = ensureInstructorExists();

        // ── 5. Fix placeholder YouTube IDs ─────────────────────────────────
        fixYoutubeId(1L, "grEKMHGYyns"); // Installation & Setup
        fixYoutubeId(2L, "eIrMbAQSU34"); // Hello World in Java
        fixYoutubeId(3L, "pTB0EiLXUC8"); // OOP Basics
        fixYoutubeId(4L, "Yz2ROvuULQ0"); // Advanced Java Topics

        // ── 6. Seed Python & ML courses ────────────────────────────────────
        seedPythonCourse(instructorId);
        seedMlCourse(instructorId);

        // ── 7. Quiz tables ────────────────────────────────────────────────────
        createQuizzesTableIfNotExists();
        createQuizQuestionsTableIfNotExists();
        createQuizAttemptsTableIfNotExists();
    }

    /**
     * Alters a PK column (e.g. users.id) to BIGINT.
     * Must drop all FK constraints from OTHER tables that reference this PK first.
     */
    private void fixPrimaryKeyToBigInt(String tableName, String pkColumn) {
        try {
            String dataType = jdbcTemplate.queryForObject(
                "SELECT DATA_TYPE FROM information_schema.columns " +
                "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                String.class, tableName, pkColumn
            );
            if (dataType == null || dataType.equalsIgnoreCase("bigint")) {
                log.debug("[Migration] {}.{} PK is already BIGINT – no change", tableName, pkColumn);
                return;
            }
            log.warn("[Migration] Fixing PK {}.{} from {} → BIGINT", tableName, pkColumn, dataType);

            // Find all FK constraints in OTHER tables that reference this table's PK
            java.util.List<java.util.Map<String, Object>> refs = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = ? AND REFERENCED_COLUMN_NAME = ?",
                tableName, pkColumn
            );
            // Drop those FKs temporarily
            for (java.util.Map<String, Object> ref : refs) {
                String refTable = (String) ref.get("TABLE_NAME");
                String fkName   = (String) ref.get("CONSTRAINT_NAME");
                log.warn("[Migration] Dropping referencing FK {} on {}", fkName, refTable);
                try { jdbcTemplate.execute("ALTER TABLE " + refTable + " DROP FOREIGN KEY " + fkName); }
                catch (Exception ignore) { /* may already be gone */ }
            }

            // Alter the PK column itself to BIGINT
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + pkColumn + " BIGINT NOT NULL AUTO_INCREMENT");
            log.info("[Migration] {}.{} PK altered to BIGINT successfully", tableName, pkColumn);

        } catch (Exception e) {
            log.error("[Migration] Failed to fix PK {}.{}: {}", tableName, pkColumn, e.getMessage());
        }
    }

    /**
     * Alters a FK column to BIGINT (drops the FK constraint, alters, recreates FK).
     * refTable/refColumn = the referenced table and column (e.g. "users", "id").
     */
    private void fixColumnTypeToBigInt(String tableName, String columnName,
                                       String refTable, String refColumn) {
        try {
            String dataType = jdbcTemplate.queryForObject(
                "SELECT DATA_TYPE FROM information_schema.columns " +
                "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                String.class, tableName, columnName
            );
            if (dataType == null || dataType.equalsIgnoreCase("bigint")) {
                log.debug("[Migration] {}.{} is already BIGINT – no change", tableName, columnName);
                return;
            }
            log.warn("[Migration] Altering {}.{} from {} → BIGINT", tableName, columnName, dataType);

            // 1. Drop FK constraints on this column
            java.util.List<String> fkNames = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? " +
                "AND REFERENCED_TABLE_NAME IS NOT NULL",
                String.class, tableName, columnName
            );
            for (String fk : fkNames) {
                log.warn("[Migration] Dropping FK {} on {}.{}", fk, tableName, columnName);
                try { jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP FOREIGN KEY " + fk); }
                catch (Exception ignore) {}
            }

            // 2. Alter the column
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " BIGINT NOT NULL");
            log.info("[Migration] {}.{} altered to BIGINT successfully", tableName, columnName);

            // 3. Re-add the FK (best-effort — skip if still incompatible)
            String constraintName = "fk_" + tableName + "_" + columnName;
            try {
                jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " ADD CONSTRAINT " + constraintName +
                    " FOREIGN KEY (" + columnName + ") REFERENCES " + refTable + "(" + refColumn + ")"
                );
                log.info("[Migration] Re-added FK {} → {}.{}", constraintName, refTable, refColumn);
            } catch (Exception e2) {
                log.warn("[Migration] Could not re-add FK {} (will try again next restart): {}", constraintName, e2.getMessage());
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to fix {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void fixYoutubeId(Long videoId, String realYoutubeId) {
        try {
            int rows = jdbcTemplate.update(
                "UPDATE videos SET youtube_id = ? WHERE id = ? AND youtube_id NOT REGEXP '^[A-Za-z0-9_-]{11}$'",
                realYoutubeId, videoId
            );
            if (rows > 0) {
                log.info("[Migration] Fixed youtube_id for video id={} → {}", videoId, realYoutubeId);
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to fix youtube_id for video {}: {}", videoId, e.getMessage());
        }
    }

    private void seedPythonCourse(Long instructorId) {
        try {
            // Course
            jdbcTemplate.update(
                "INSERT IGNORE INTO courses (id, title, description, thumbnail_url, price, status, created_at, instructor_id) " +
                "VALUES (2, 'Python for Beginners', 'Master Python from scratch with hands-on projects.', " +
                "'https://i.ytimg.com/vi/kqtD5dpn9C8/maxresdefault.jpg', 0.00, 'PUBLISHED', NOW(), ?)",
                instructorId
            );
            // Sections
            jdbcTemplate.update(
                "INSERT IGNORE INTO sections (id, title, order_index, course_id) VALUES (3, 'Python Basics', 1, 2), (4, 'Data Structures', 2, 2)"
            );
            // Videos
            jdbcTemplate.update(
                "INSERT IGNORE INTO videos (id, title, youtube_id, duration_seconds, order_index, section_id) VALUES " +
                "(5, 'Python Installation', 'kqtD5dpn9C8', 540, 1, 3), " +
                "(6, 'Variables & Types',  'Z1Yd7upZPqA', 720, 2, 3), " +
                "(7, 'Lists & Tuples',     'W8KRzm-HUcc', 480, 1, 4), " +
                "(8, 'Dictionaries',       'daefaXa0vHU', 600, 2, 4)"
            );
            log.info("[Migration] Python course seeded.");
        } catch (Exception e) {
            log.error("[Migration] Failed to seed Python course: {}", e.getMessage());
        }
    }

    private void seedMlCourse(Long instructorId) {
        try {
            jdbcTemplate.update(
                "INSERT IGNORE INTO courses (id, title, description, thumbnail_url, price, status, created_at, instructor_id) " +
                "VALUES (3, 'Machine Learning A-Z', 'Learn ML with Python, scikit-learn, and real datasets.', " +
                "'https://i.ytimg.com/vi/GwIo3gDZCVQ/maxresdefault.jpg', 29.99, 'PUBLISHED', NOW(), ?)",
                instructorId
            );
            jdbcTemplate.update(
                "INSERT IGNORE INTO sections (id, title, order_index, course_id) VALUES (5, 'ML Fundamentals', 1, 3), (6, 'Supervised Learning', 2, 3)"
            );
            jdbcTemplate.update(
                "INSERT IGNORE INTO videos (id, title, youtube_id, duration_seconds, order_index, section_id) VALUES " +
                "(9,  'What is ML?',            'GwIo3gDZCVQ', 360, 1, 5), " +
                "(10, 'Linear Regression',      'NUXdtN1W1FE', 780, 2, 5), " +
                "(11, 'Classification Trees',   'PHxYNGo8NcI', 660, 1, 6), " +
                "(12, 'Model Evaluation',       'LbX4X71-TFI', 540, 2, 6)"
            );
            log.info("[Migration] ML course seeded.");
        } catch (Exception e) {
            log.error("[Migration] Failed to seed ML course: {}", e.getMessage());
        }
    }

    private void dropColumnIfExists(String tableName, String columnName) {
        try {
            // 1. Drop any FKs referencing this column (if it's a FK)
            java.util.List<String> fkNames = jdbcTemplate.queryForList(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? " +
                "AND REFERENCED_TABLE_NAME IS NOT NULL",
                String.class, tableName, columnName
            );
            for (String fk : fkNames) {
                log.warn("[Migration] Dropping FK {} on {}.{}", fk, tableName, columnName);
                try { jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP FOREIGN KEY " + fk); }
                catch (Exception ignore) {}
            }

            // 2. Drop the column itself
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_schema = DATABASE() " +
                    "  AND table_name = ? " +
                    "  AND column_name = ?",
                    Integer.class,
                    tableName, columnName
            );

            if (count != null && count > 0) {
                log.warn("[Migration] Dropping stale column {}.{}", tableName, columnName);
                jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN " + columnName);
                log.info("[Migration] Successfully dropped {}.{}", tableName, columnName);
            } else {
                log.debug("[Migration] {}.{} does not exist – nothing to do", tableName, columnName);
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to check/drop {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }

    private void fixEnrollmentUniqueIndex() {
        try {
            jdbcTemplate.execute("ALTER TABLE enrollments DROP INDEX idx_enrollment_user_course");
            log.info("[Migration] Dropped old idx_enrollment_user_course");
        } catch (Exception e) {
            log.debug("[Migration] Could not drop idx_enrollment_user_course (may not exist): {}", e.getMessage());
        }
        
        try {
            jdbcTemplate.execute("ALTER TABLE enrollments ADD UNIQUE INDEX idx_enrollment_user_course (user_id, subject_id)");
            log.info("[Migration] Created new idx_enrollment_user_course on (user_id, subject_id)");
        } catch (Exception e) {
            log.error("[Migration] Failed to create idx_enrollment_user_course: {}", e.getMessage());
        }
    }

    private void renameColumnIfExists(String tableName, String oldColumn, String newColumn, String definition) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_schema = DATABASE() " +
                    "  AND table_name = ? " +
                    "  AND column_name = ?",
                    Integer.class,
                    tableName, oldColumn
            );

            if (count != null && count > 0) {
                log.warn("[Migration] Renaming column {}.{} to {}", tableName, oldColumn, newColumn);
                jdbcTemplate.execute("ALTER TABLE " + tableName + " CHANGE COLUMN " + oldColumn + " " + newColumn + " " + definition);
                log.info("[Migration] Successfully renamed {}.{} to {}", tableName, oldColumn, newColumn);
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to check/rename {}.{}: {}", tableName, oldColumn, e.getMessage());
        }
    }

    private void addColumnIfNotExists(String tableName, String columnName, String definition) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_schema = DATABASE() " +
                    "  AND table_name = ? " +
                    "  AND column_name = ?",
                    Integer.class,
                    tableName, columnName
            );

            if (count == null || count == 0) {
                log.warn("[Migration] Adding column {}.{}", tableName, columnName);
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + definition);
                log.info("[Migration] Successfully added {}.{}", tableName, columnName);
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to add {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }

    /** Ensures instructor john@example.com exists and returns their ID. */
    private Long ensureInstructorExists() {
        try {
            String email = "john@example.com";
            String hash = new BCryptPasswordEncoder().encode("Password123!");
            
            // Check if exists
            java.util.List<Long> ids = jdbcTemplate.queryForList("SELECT id FROM users WHERE email = ?", Long.class, email);
            
            if (ids.isEmpty()) {
                jdbcTemplate.update("INSERT INTO users (name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
                    "John Instructor", email, hash, "INSTRUCTOR");
                log.info("[Migration] Inserted missing instructor john@example.com with password 'Password123!'");
                return jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
            } else {
                // Optional: Update password to be sure it's known
                jdbcTemplate.update("UPDATE users SET password_hash = ? WHERE email = ?", hash, email);
                log.info("[Migration] Ensured john@example.com exists and password is reset");
                return ids.get(0);
            }
        } catch (Exception e) {
            log.error("[Migration] Failed to ensure instructor exists: {}", e.getMessage());
            return 1L; // Fallback to 1, though risky
        }
    }

    // ── Quiz table creation ────────────────────────────────────────────────────

    private void createQuizzesTableIfNotExists() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quizzes (" +
                "  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                "  course_id BIGINT NOT NULL," +
                "  title VARCHAR(255) NOT NULL," +
                "  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)," +
                "  CONSTRAINT fk_quiz_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE," +
                "  UNIQUE KEY uq_quiz_course (course_id)" +
                ")"
            );
            log.info("[Migration] quizzes table ready.");
        } catch (Exception e) {
            log.error("[Migration] quizzes table error: {}", e.getMessage());
        }
    }

    private void createQuizQuestionsTableIfNotExists() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quiz_questions (" +
                "  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                "  quiz_id BIGINT NOT NULL," +
                "  question_text TEXT NOT NULL," +
                "  option_a VARCHAR(500) NOT NULL," +
                "  option_b VARCHAR(500) NOT NULL," +
                "  option_c VARCHAR(500) NOT NULL," +
                "  option_d VARCHAR(500) NOT NULL," +
                "  correct_option CHAR(1) NOT NULL," +
                "  order_index INT NOT NULL DEFAULT 0," +
                "  CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE" +
                ")"
            );
            log.info("[Migration] quiz_questions table ready.");
        } catch (Exception e) {
            log.error("[Migration] quiz_questions table error: {}", e.getMessage());
        }
    }

    private void createQuizAttemptsTableIfNotExists() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS quiz_attempts (" +
                "  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                "  quiz_id BIGINT NOT NULL," +
                "  user_id BIGINT NOT NULL," +
                "  score INT NOT NULL DEFAULT 0," +
                "  total INT NOT NULL DEFAULT 0," +
                "  attempted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)," +
                "  CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE," +
                "  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ")"
            );
            log.info("[Migration] quiz_attempts table ready.");
        } catch (Exception e) {
            log.error("[Migration] quiz_attempts table error: {}", e.getMessage());
        }
    }
}
