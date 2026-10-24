-- Seed mock data for the LMS catalog
-- Using INSERT IGNORE so re-running this script never crashes on duplicate keys

INSERT IGNORE INTO users (id, name, email, password_hash, role, created_at, updated_at)
VALUES (1, 'John Instructor', 'john@example.com',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoOe5dyFaG9v0J2kqpnqzH8w2b5ZvSOZpW',
        'INSTRUCTOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO courses (id, title, description, thumbnail_url, price, status, created_at, instructor_id)
VALUES (1, 'Intro to Java', 'Learn the basics of Java programming.',
        'https://example.com/java-thumb.png', 49.99,
        'PUBLISHED', CURRENT_TIMESTAMP, 1);

INSERT IGNORE INTO sections (id, title, order_index, course_id)
VALUES (1, 'Getting Started', 1, 1),
       (2, 'Core Concepts', 2, 1);

INSERT IGNORE INTO videos (id, title, youtube_id, duration, order_index, section_id)
VALUES (1, 'Installation & Setup', 'grEKMHGYyns', 300, 1, 1),
       (2, 'Hello World in Java',  'eIrMbAQSU34', 420, 2, 1),
       (3, 'OOP Basics',           'pTB0EiLXUC8', 600, 1, 2),
       (4, 'Advanced Java Topics', 'Yz2ROvuULQ0', 900, 2, 2);
