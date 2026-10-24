package com.lms.backend.controller;

import com.lms.backend.dto.QuizRequest;
import com.lms.backend.dto.QuizResponse;
import com.lms.backend.service.QuizService;
import com.lms.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Instructor quiz management.
 * Base path: /api/instructor/courses/{courseId}/quiz
 * Access: INSTRUCTOR or ADMIN only — and only the course owner can manage its quiz.
 */
@RestController
@RequestMapping("/api/instructor/courses/{courseId}/quiz")
@PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
@RequiredArgsConstructor
public class QuizInstructorController {

    private final QuizService quizService;
    private final UserService userService;

    /** GET — fetch quiz with correct answers (instructor view) */
    @GetMapping
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getForInstructor(courseId, userId()));
    }

    /** POST — create or replace the quiz for this course */
    @PostMapping
    public ResponseEntity<QuizResponse> createOrReplace(
            @PathVariable Long courseId,
            @Valid @RequestBody QuizRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createOrReplace(courseId, req, userId()));
    }

    /** DELETE — remove the quiz entirely */
    @DeleteMapping
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long courseId) {
        quizService.deleteQuiz(courseId, userId());
        return ResponseEntity.noContent().build();
    }

    private Long userId() {
        return userService.getCurrentUserId();
    }
}
