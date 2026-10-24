package com.lms.backend.controller;

import com.lms.backend.dto.*;
import com.lms.backend.service.CourseService;
import com.lms.backend.service.InstructorService;
import com.lms.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Instructor content management.
 *
 * Base path : /api/instructor
 * Access    : ROLE_INSTRUCTOR or ROLE_ADMIN only
 *
 * Courses are created/published via /api/courses (CourseController).
 * This controller handles the curriculum structure:
 *   Sections  →  /api/instructor/courses/{courseId}/sections
 *   Videos    →  /api/instructor/sections/{sectionId}/videos
 *
 * Videos store only YouTube metadata — no video files are kept on this server.
 */
@RestController
@RequestMapping("/api/instructor")
@PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
@RequiredArgsConstructor
public class InstructorController {

    private final InstructorService instructorService;
    private final CourseService     courseService;
    private final UserService       userService;

    // ── My Courses ────────────────────────────────────────────────────────────

    /** GET /api/instructor/courses — courses owned by the current instructor */
    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getMyCourses() {
        return ResponseEntity.ok(instructorService.getMyCourses(userId()));
    }

    /** POST /api/instructor/courses — create a new course */
    @PostMapping("/courses")
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest req) {
        CourseResponse created = courseService.create(req, userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** PUT /api/instructor/courses/{id} — update course meta (title, desc, thumb, price) */
    @PutMapping("/courses/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id, @Valid @RequestBody CourseRequest req) {
        return ResponseEntity.ok(courseService.update(id, req, userId()));
    }

    /** PATCH /api/instructor/courses/{id}/publish */
    @PatchMapping("/courses/{id}/publish")
    public ResponseEntity<CourseResponse> publish(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.publish(id, userId()));
    }

    /** PATCH /api/instructor/courses/{id}/unpublish */
    @PatchMapping("/courses/{id}/unpublish")
    public ResponseEntity<CourseResponse> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.unpublish(id, userId()));
    }

    /** DELETE /api/instructor/courses/{id} */
    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.delete(id, userId());
        return ResponseEntity.noContent().build();
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    /** GET /api/instructor/courses/{courseId}/sections */
    @GetMapping("/courses/{courseId}/sections")
    public ResponseEntity<List<SectionResponse>> getSections(@PathVariable Long courseId) {
        return ResponseEntity.ok(instructorService.getSections(courseId, userId()));
    }

    /** POST /api/instructor/courses/{courseId}/sections */
    @PostMapping("/courses/{courseId}/sections")
    public ResponseEntity<SectionResponse> createSection(
            @PathVariable Long courseId, @Valid @RequestBody SectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instructorService.createSection(courseId, req, userId()));
    }

    /** PUT /api/instructor/sections/{sectionId} */
    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<SectionResponse> updateSection(
            @PathVariable Long sectionId, @Valid @RequestBody SectionRequest req) {
        return ResponseEntity.ok(instructorService.updateSection(sectionId, req, userId()));
    }

    /** DELETE /api/instructor/sections/{sectionId} */
    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId) {
        instructorService.deleteSection(sectionId, userId());
        return ResponseEntity.noContent().build();
    }

    // ── Videos ────────────────────────────────────────────────────────────────

    /**
     * GET /api/instructor/sections/{sectionId}/videos
     * Returns all videos in a section, ordered by orderIndex.
     */
    @GetMapping("/sections/{sectionId}/videos")
    public ResponseEntity<List<VideoResponse>> getVideos(@PathVariable Long sectionId) {
        return ResponseEntity.ok(instructorService.getVideos(sectionId, userId()));
    }

    /**
     * POST /api/instructor/sections/{sectionId}/videos
     *
     * Request body:
     * {
     *   "title":           "Installation & Setup",
     *   "description":     "Optional lesson description",
     *   "youtubeId":       "grEKMHGYyns",   ← 11-char YouTube video ID only
     *   "durationSeconds": 300,              ← nullable, back-fill from player
     *   "orderIndex":      1
     * }
     *
     * No video file is uploaded. Only metadata is stored.
     */
    @PostMapping("/sections/{sectionId}/videos")
    public ResponseEntity<VideoResponse> createVideo(
            @PathVariable Long sectionId, @Valid @RequestBody VideoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instructorService.createVideo(sectionId, req, userId()));
    }

    /** PUT /api/instructor/videos/{videoId} — update any video metadata */
    @PutMapping("/videos/{videoId}")
    public ResponseEntity<VideoResponse> updateVideo(
            @PathVariable Long videoId, @Valid @RequestBody VideoRequest req) {
        return ResponseEntity.ok(instructorService.updateVideo(videoId, req, userId()));
    }

    /** DELETE /api/instructor/videos/{videoId} */
    @DeleteMapping("/videos/{videoId}")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long videoId) {
        instructorService.deleteVideo(videoId, userId());
        return ResponseEntity.noContent().build();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long userId() {
        return userService.getCurrentUserId();
    }
}
