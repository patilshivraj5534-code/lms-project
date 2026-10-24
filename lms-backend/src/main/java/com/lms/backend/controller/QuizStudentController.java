package com.lms.backend.controller;

import com.lms.backend.dto.QuizResponse;
import com.lms.backend.dto.QuizResultResponse;
import com.lms.backend.dto.QuizSubmitRequest;
import com.lms.backend.service.QuizService;
import com.lms.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Student-facing quiz endpoints.
 * Base path: /api/courses/{courseId}/quiz
 * Access: any authenticated user (enrolled students).
 */
@RestController
@RequestMapping("/api/courses/{courseId}/quiz")
@RequiredArgsConstructor
public class QuizStudentController {

    private final QuizService quizService;
    private final UserService userService;

    /** GET — fetch quiz questions WITHOUT correct answers */
    @GetMapping
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getForStudent(courseId));
    }

    /** GET /exists — lightweight check whether a quiz exists */
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> exists(@PathVariable Long courseId) {
        return ResponseEntity.ok(Map.of("exists", quizService.quizExistsForCourse(courseId)));
    }

    /** POST /submit — submit answers, returns graded result */
    @PostMapping("/submit")
    public ResponseEntity<QuizResultResponse> submit(
            @PathVariable Long courseId,
            @Valid @RequestBody QuizSubmitRequest req) {
        return ResponseEntity.ok(quizService.submit(courseId, req, userId()));
    }

    /** GET /result — get the student's latest attempt result */
    @GetMapping("/result")
    public ResponseEntity<QuizResultResponse> myResult(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getMyResult(courseId, userId()));
    }

    private Long userId() {
        return userService.getCurrentUserId();
    }
}
