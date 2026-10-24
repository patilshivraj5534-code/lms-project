package com.lms.backend.service;

import com.lms.backend.dto.*;
import com.lms.backend.entity.*;
import com.lms.backend.model.Role;
import com.lms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    // ── Instructor: create or replace quiz ───────────────────────────────────

    @Transactional
    public QuizResponse createOrReplace(Long courseId, QuizRequest req, Long instructorId) {
        Course course = getCourse(courseId);
        requireOwnerOrAdmin(course, getUser(instructorId));

        // Delete existing quiz if any (cascade removes its questions)
        quizRepository.findByCourseId(courseId).ifPresent(existing -> {
            quizRepository.delete(existing);
            quizRepository.flush(); // flush delete BEFORE insert to avoid unique key collision
        });

        // Build new quiz with questions
        Quiz quiz = new Quiz();
        quiz.setCourse(course);
        quiz.setTitle(req.getTitle());
        quiz.setCreatedAt(Instant.now());
        quiz.setQuestions(new ArrayList<>());

        // Save quiz first to get its ID
        quiz = quizRepository.save(quiz);

        // Build and save questions
        List<QuizQuestion> questions = new ArrayList<>();
        for (int i = 0; i < req.getQuestions().size(); i++) {
            QuizRequest.QuestionRequest qr = req.getQuestions().get(i);
            QuizQuestion qq = new QuizQuestion();
            qq.setQuiz(quiz);
            qq.setQuestionText(qr.getQuestionText());
            qq.setOptionA(qr.getOptionA());
            qq.setOptionB(qr.getOptionB());
            qq.setOptionC(qr.getOptionC());
            qq.setOptionD(qr.getOptionD());
            qq.setCorrectOption(qr.getCorrectOption().toUpperCase());
            qq.setOrderIndex(qr.getOrderIndex() > 0 ? qr.getOrderIndex() : i + 1);
            questions.add(qq);
        }

        questionRepository.saveAll(questions);
        quiz.setQuestions(questions);

        return toResponse(quiz, true);
    }

    // ── Instructor: get quiz with answers ────────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResponse getForInstructor(Long courseId, Long instructorId) {
        Course course = getCourse(courseId);
        requireOwnerOrAdmin(course, getUser(instructorId));
        Quiz quiz = quizRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quiz for this course"));
        return toResponse(quiz, true);
    }

    // ── Instructor: delete quiz ───────────────────────────────────────────────

    @Transactional
    public void deleteQuiz(Long courseId, Long instructorId) {
        Course course = getCourse(courseId);
        requireOwnerOrAdmin(course, getUser(instructorId));
        quizRepository.findByCourseId(courseId).ifPresent(quizRepository::delete);
    }

    // ── Student: get quiz without answers ────────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResponse getForStudent(Long courseId) {
        Quiz quiz = quizRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quiz for this course"));
        return toResponse(quiz, false);
    }

    // ── Student: check if quiz exists ────────────────────────────────────────

    @Transactional(readOnly = true)
    public boolean quizExistsForCourse(Long courseId) {
        return quizRepository.existsByCourseId(courseId);
    }

    // ── Student: submit answers ───────────────────────────────────────────────

    @Transactional
    public QuizResultResponse submit(Long courseId, QuizSubmitRequest req, Long userId) {
        Quiz quiz = quizRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quiz for this course"));

        List<QuizQuestion> questions = quiz.getQuestions();
        Map<Long, String> answers = req.getAnswers();

        int correct = 0;
        Map<Long, String> correctAnswers = new LinkedHashMap<>();
        Map<Long, String> yourAnswers = new LinkedHashMap<>();

        for (QuizQuestion q : questions) {
            String chosen = answers.getOrDefault(q.getId(), "");
            correctAnswers.put(q.getId(), q.getCorrectOption());
            yourAnswers.put(q.getId(), chosen);
            if (q.getCorrectOption().equalsIgnoreCase(chosen)) correct++;
        }

        int total = questions.size();
        double pct = total > 0 ? (correct * 100.0 / total) : 0;

        // Persist attempt
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(getUser(userId))
                .score(correct)
                .total(total)
                .attemptedAt(Instant.now())
                .build();
        attemptRepository.save(attempt);

        return QuizResultResponse.builder()
                .score(correct)
                .total(total)
                .percentage(Math.round(pct * 10.0) / 10.0)
                .passed(pct >= 60)
                .correctAnswers(correctAnswers)
                .yourAnswers(yourAnswers)
                .build();
    }

    // ── Student: get latest attempt result ───────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResultResponse getMyResult(Long courseId, Long userId) {
        Quiz quiz = quizRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quiz for this course"));

        QuizAttempt attempt = attemptRepository
                .findFirstByQuizIdAndUserIdOrderByAttemptedAtDesc(quiz.getId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No attempt found"));

        List<QuizQuestion> questions = quiz.getQuestions();
        Map<Long, String> correctAnswers = questions.stream()
                .collect(Collectors.toMap(QuizQuestion::getId, QuizQuestion::getCorrectOption));

        double pct = attempt.getTotal() > 0
                ? (attempt.getScore() * 100.0 / attempt.getTotal()) : 0;

        return QuizResultResponse.builder()
                .score(attempt.getScore())
                .total(attempt.getTotal())
                .percentage(Math.round(pct * 10.0) / 10.0)
                .passed(pct >= 60)
                .correctAnswers(correctAnswers)
                .yourAnswers(Collections.emptyMap()) // no longer stored per-answer
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private QuizResponse toResponse(Quiz quiz, boolean includeAnswers) {
        List<QuizResponse.QuestionResponse> qResponses = quiz.getQuestions().stream()
                .sorted(Comparator.comparingInt(QuizQuestion::getOrderIndex))
                .map(q -> QuizResponse.QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .orderIndex(q.getOrderIndex())
                        .correctOption(includeAnswers ? q.getCorrectOption() : null)
                        .build())
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourse().getId())
                .title(quiz.getTitle())
                .questions(qResponses)
                .build();
    }

    private Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void requireOwnerOrAdmin(Course course, User user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = course.getInstructor().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }
}
