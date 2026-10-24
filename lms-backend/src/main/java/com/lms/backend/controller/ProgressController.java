package com.lms.backend.controller;

import com.lms.backend.dto.ProgressRequest;
import com.lms.backend.dto.VideoProgressDto;
import com.lms.backend.entity.User;
import com.lms.backend.entity.Video;
import com.lms.backend.entity.VideoProgress;
import com.lms.backend.repository.UserRepository;
import com.lms.backend.repository.VideoProgressRepository;
import com.lms.backend.repository.VideoRepository;
import com.lms.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import com.lms.backend.entity.Section;
import com.lms.backend.repository.SectionRepository;
import com.lms.backend.dto.SubjectProgressDto;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final VideoProgressRepository videoProgressRepository;
    private final VideoRepository videoRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    // GET /api/progress/videos/{id}
    @GetMapping("/videos/{id}")
    public ResponseEntity<VideoProgressDto> getVideoProgress(@PathVariable Long id) {
        Long userId = userService.getCurrentUserId();
        VideoProgress progress = videoProgressRepository.findByUserIdAndVideoId(userId, id)
                .orElse(null);

        VideoProgressDto dto = new VideoProgressDto();
        dto.setVideoId(id);
        if (progress != null) {
            dto.setLastPositionSeconds(progress.getLastPositionSeconds());
            dto.setIsCompleted(progress.getIsCompleted());
        } else {
            dto.setLastPositionSeconds(0);
            dto.setIsCompleted(false);
        }
        return ResponseEntity.ok(dto);
    }

    // POST /api/progress/videos/{id} – upsert video progress for authenticated user
    @Transactional
    @PostMapping("/videos/{id}")
    public ResponseEntity<VideoProgressDto> updateVideoProgress(
            @PathVariable Long id,
            @RequestBody ProgressRequest req) {

        Long userId = userService.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));

        VideoProgress progress = videoProgressRepository.findByUserIdAndVideoId(userId, id)
                .orElse(VideoProgress.builder()
                        .user(user)
                        .video(video)
                        .lastPositionSeconds(0)
                        .isCompleted(false)
                        .build());

        if (req.getLastPositionSeconds() != null) {
            int duration = video.getDuration() != null ? video.getDuration() : Integer.MAX_VALUE;
            progress.setLastPositionSeconds(Math.min(req.getLastPositionSeconds(), duration));
        }
        if (req.getIsCompleted() != null) {
            boolean newlyCompleted = !progress.getIsCompleted() && req.getIsCompleted();
            progress.setIsCompleted(req.getIsCompleted());
            if (newlyCompleted) {
                progress.setCompletedAt(Instant.now());
            }
        }
        progress.setUpdatedAt(Instant.now());

        progress = videoProgressRepository.save(progress);

        VideoProgressDto dto = new VideoProgressDto();
        dto.setVideoId(progress.getVideo().getId());
        dto.setLastPositionSeconds(progress.getLastPositionSeconds());
        dto.setIsCompleted(progress.getIsCompleted());

        return ResponseEntity.ok(dto);
    }

    // GET /api/progress/subjects/{id} – return progress summary for user's specific course (subject)
    @GetMapping("/subjects/{id}")
    public ResponseEntity<SubjectProgressDto> getSubjectProgress(@PathVariable Long id) {
        Long userId = userService.getCurrentUserId();

        List<VideoProgress> progressList = videoProgressRepository.findByUserIdAndCourseId(userId, id);
        int completedVideos = (int) progressList.stream().filter(VideoProgress::getIsCompleted).count();

        List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(id);
        int totalVideos = 0;
        for (Section sec : sections) {
            totalVideos += videoRepository.findBySectionIdOrderByOrderIndexAsc(sec.getId()).size();
        }

        double percentComplete = totalVideos == 0 ? 0.0 : ((double) completedVideos / totalVideos) * 100.0;

        VideoProgress lastWatched = progressList.stream()
                .max(Comparator.comparing(VideoProgress::getUpdatedAt))
                .orElse(null);

        SubjectProgressDto dto = SubjectProgressDto.builder()
                .totalVideos(totalVideos)
                .completedVideos(completedVideos)
                .percentComplete(percentComplete)
                .lastVideoId(lastWatched != null ? lastWatched.getVideo().getId() : null)
                .lastPositionSeconds(lastWatched != null ? lastWatched.getLastPositionSeconds() : null)
                .build();

        return ResponseEntity.ok(dto);
    }
}
