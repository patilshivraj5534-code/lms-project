package com.lms.backend.controller;

import com.lms.backend.dto.VideoDto;
import com.lms.backend.service.CourseService;
import com.lms.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    /**
     * GET /api/videos/{id}
     * Returns video metadata, enforcing locking rules.
     */
    @GetMapping("/{id}")
    public ResponseEntity<VideoDto> getVideo(@PathVariable Long id) {
        Long userId = userService.getCurrentUserIdOrNull();
        VideoDto dto = courseService.getVideoDetails(id, userId);
        
        if (dto.getLocked() != null && dto.getLocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lesson Locked: " + dto.getUnlockReason());
        }
        
        return ResponseEntity.ok(dto);
    }
}
