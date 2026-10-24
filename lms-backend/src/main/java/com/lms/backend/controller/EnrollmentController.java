package com.lms.backend.controller;

import com.lms.backend.dto.CourseResponse;
import com.lms.backend.entity.Enrollment;
import com.lms.backend.service.EnrollmentService;
import com.lms.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final UserService userService;

    /** Enroll current user in a course */
    @PostMapping("/{courseId}")
    public ResponseEntity<CourseResponse> enroll(@PathVariable Long courseId) {
        Long userId = userService.getCurrentUserId();
        Enrollment enrollment = enrollmentService.enroll(userId, courseId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CourseResponse.from(enrollment.getCourse()));
    }

    /** Unenroll current user from a course */
    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> unenroll(@PathVariable Long courseId) {
        Long userId = userService.getCurrentUserId();
        enrollmentService.unenroll(userId, courseId);
        return ResponseEntity.noContent().build();
    }

    /** Check if current user is enrolled in a course */
    @GetMapping("/check/{courseId}")
    public ResponseEntity<Boolean> checkEnrollment(@PathVariable Long courseId) {
        Long userId = userService.getCurrentUserId();
        boolean enrolled = enrollmentService.isEnrolled(userId, courseId);
        return ResponseEntity.ok(enrolled);
    }

    /** List all courses the current user is enrolled in */
    @GetMapping
    public ResponseEntity<List<CourseResponse>> listEnrollments() {
        Long userId = userService.getCurrentUserId();
        List<CourseResponse> courses = enrollmentService.getEnrollmentsByUser(userId)
                .stream()
                .map(enrollment -> CourseResponse.from(enrollment.getCourse()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(courses);
    }
}
