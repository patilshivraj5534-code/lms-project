package com.lms.backend.controller;

import com.lms.backend.dto.CourseDto;
import com.lms.backend.dto.CourseResponse;
import com.lms.backend.service.CourseService;
import com.lms.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    // GET /api/subjects – paginated list of published courses
    @GetMapping
    public ResponseEntity<Page<CourseResponse>> listSubjects(Pageable pageable) {
        return ResponseEntity.ok(courseService.getPublishedCourses(pageable));
    }

    // GET /api/subjects/public – list all published courses (no pagination)
    @GetMapping("/public")
    public ResponseEntity<List<CourseResponse>> listPublicSubjects() {
        return ResponseEntity.ok(courseService.listPublished());
    }

    // GET /api/subjects/{id} – course details (respect access rules)
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getSubject(@PathVariable Long id) {
        Long requesterId = userService.getCurrentUserIdOrNull();
        if (requesterId == null) {
            // Anonymous: just return the course if it's published
            return ResponseEntity.ok(courseService.getById(id, null));
        }
        return ResponseEntity.ok(courseService.getById(id, requesterId));
    }

    // GET /api/subjects/{id}/tree – nested course/section/video DTO
    @GetMapping("/{id}/tree")
    public ResponseEntity<CourseDto> getSubjectTree(@PathVariable Long id) {
        Long userId = userService.getCurrentUserIdOrNull();
        return ResponseEntity.ok(courseService.getCourseTree(id, userId));
    }
}
