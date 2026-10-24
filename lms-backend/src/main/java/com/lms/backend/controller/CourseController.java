package com.lms.backend.controller;

import com.lms.backend.dto.CourseRequest;
import com.lms.backend.dto.CourseResponse;
import com.lms.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // ── Public endpoints ─────────────────────────────────────────────────────

    /** List all published courses — no auth required */
    @GetMapping("/public")
    public ResponseEntity<List<CourseResponse>> listPublished() {
        return ResponseEntity.ok(courseService.listPublished());
    }

    /** Get a single course by ID (published courses visible to all, drafts only to owner/admin) */
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getById(@PathVariable Long id,
                                                   Authentication auth) {
        return ResponseEntity.ok(courseService.getById(id, resolveUserId(auth)));
    }

    // ── Authenticated endpoints ───────────────────────────────────────────────

    /** List all courses — ADMIN sees everything, INSTRUCTOR sees their own */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<List<CourseResponse>> listAll(Authentication auth) {
        return ResponseEntity.ok(courseService.listAll(resolveUserId(auth)));
    }

    /** Create a new course */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest req,
                                                  Authentication auth) {
        CourseResponse created = courseService.create(req, resolveUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** Update course fields */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<CourseResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody CourseRequest req,
                                                  Authentication auth) {
        return ResponseEntity.ok(courseService.update(id, req, resolveUserId(auth)));
    }

    /** Publish a course */
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<CourseResponse> publish(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(courseService.publish(id, resolveUserId(auth)));
    }

    /** Revert a course to DRAFT */
    @PatchMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<CourseResponse> unpublish(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(courseService.unpublish(id, resolveUserId(auth)));
    }

    /** Delete a course */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        courseService.delete(id, resolveUserId(auth));
        return ResponseEntity.noContent().build();
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /** Extracts the user ID (stored as principal name in JWT filter) */
    private Long resolveUserId(Authentication auth) {
        return Long.parseLong((String) auth.getPrincipal());
    }
}
