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

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Instructor content management.
 *
 * Instructors can:
 *   - CRUD courses they own
 *   - CRUD sections within their courses
 *   - CRUD videos (lessons) within those sections
 *
 * Videos store only YouTube metadata (title, description, youtubeId,
 * durationSeconds, orderIndex). No video files are stored in the system.
 */
@Service
@RequiredArgsConstructor
public class InstructorService {

    private final CourseRepository   courseRepository;
    private final SectionRepository  sectionRepository;
    private final VideoRepository    videoRepository;
    private final UserRepository     userRepository;

    // ── Course helpers ────────────────────────────────────────────────────────

    /** Returns all courses owned by this instructor. */
    @Transactional(readOnly = true)
    public List<CourseResponse> getMyCourses(Long instructorId) {
        return courseRepository.findByInstructorId(instructorId)
                .stream()
                .map(CourseResponse::from)
                .collect(Collectors.toList());
    }

    // ── Section CRUD ──────────────────────────────────────────────────────────

    /** List all sections for a course the instructor owns. */
    @Transactional(readOnly = true)
    public List<SectionResponse> getSections(Long courseId, Long instructorId) {
        Course course = requireOwned(courseId, instructorId);
        return sectionRepository.findByCourseIdOrderByOrderIndexAsc(course.getId())
                .stream()
                .map(s -> {
                    List<VideoResponse> videos = videoRepository
                            .findBySectionIdOrderByOrderIndexAsc(s.getId())
                            .stream()
                            .map(VideoResponse::from)
                            .collect(Collectors.toList());
                    return SectionResponse.from(s, videos);
                })
                .collect(Collectors.toList());
    }

    /** Add a new section to a course the instructor owns. */
    @Transactional
    public SectionResponse createSection(Long courseId, SectionRequest req, Long instructorId) {
        Course course = requireOwned(courseId, instructorId);

        Section section = Section.builder()
                .course(course)
                .title(req.getTitle())
                .orderIndex(req.getOrderIndex())
                .build();

        sectionRepository.save(section);
        return SectionResponse.from(section, List.of());
    }

    /** Update a section's title or order. */
    @Transactional
    public SectionResponse updateSection(Long sectionId, SectionRequest req, Long instructorId) {
        Section section = requireSectionOwned(sectionId, instructorId);
        section.setTitle(req.getTitle());
        section.setOrderIndex(req.getOrderIndex());
        sectionRepository.save(section);

        List<VideoResponse> videos = videoRepository
                .findBySectionIdOrderByOrderIndexAsc(section.getId())
                .stream().map(VideoResponse::from).collect(Collectors.toList());
        return SectionResponse.from(section, videos);
    }

    /** Delete a section and all its videos (CASCADE). */
    @Transactional
    public void deleteSection(Long sectionId, Long instructorId) {
        Section section = requireSectionOwned(sectionId, instructorId);
        sectionRepository.delete(section);
    }

    // ── Video CRUD ────────────────────────────────────────────────────────────

    /**
     * Add a new video lesson to a section.
     *
     * Only YouTube metadata is stored — the youtubeId is an 11-char ID
     * (e.g. "grEKMHGYyns"). No video bytes are uploaded to this system.
     */
    @Transactional
    public VideoResponse createVideo(Long sectionId, VideoRequest req, Long instructorId) {
        Section section = requireSectionOwned(sectionId, instructorId);

        // Guard unique (section_id, order_index)
        boolean orderTaken = videoRepository
                .findBySectionIdOrderByOrderIndexAsc(sectionId)
                .stream()
                .anyMatch(v -> v.getOrderIndex().equals(req.getOrderIndex()));
        if (orderTaken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A video with orderIndex=" + req.getOrderIndex() + " already exists in this section. " +
                    "Please choose a different order index or reorder existing videos first.");
        }

        Video video = Video.builder()
                .section(section)
                .title(req.getTitle())
                .description(req.getDescription())
                .youtubeId(req.getYoutubeId())
                .duration(req.getDurationSeconds())
                .orderIndex(req.getOrderIndex())
                .build();

        videoRepository.save(video);
        return VideoResponse.from(video);
    }

    /** Update a video lesson's metadata (title, description, youtubeId, duration, orderIndex). */
    @Transactional
    public VideoResponse updateVideo(Long videoId, VideoRequest req, Long instructorId) {
        Video video = requireVideoOwned(videoId, instructorId);

        // Guard unique order (excluding self)
        boolean orderTaken = videoRepository
                .findBySectionIdOrderByOrderIndexAsc(video.getSection().getId())
                .stream()
                .anyMatch(v -> v.getOrderIndex().equals(req.getOrderIndex()) && !v.getId().equals(videoId));
        if (orderTaken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Another video already has orderIndex=" + req.getOrderIndex() + " in this section.");
        }

        video.setTitle(req.getTitle());
        video.setDescription(req.getDescription());
        video.setYoutubeId(req.getYoutubeId());
        video.setDuration(req.getDurationSeconds());
        video.setOrderIndex(req.getOrderIndex());

        videoRepository.save(video);
        return VideoResponse.from(video);
    }

    /** Delete a single video lesson. */
    @Transactional
    public void deleteVideo(Long videoId, Long instructorId) {
        Video video = requireVideoOwned(videoId, instructorId);
        videoRepository.delete(video);
    }

    /** List videos in a section (ordered by orderIndex). */
    @Transactional(readOnly = true)
    public List<VideoResponse> getVideos(Long sectionId, Long instructorId) {
        requireSectionOwned(sectionId, instructorId);
        return videoRepository.findBySectionIdOrderByOrderIndexAsc(sectionId)
                .stream().map(VideoResponse::from).collect(Collectors.toList());
    }

    // ── Private guards ────────────────────────────────────────────────────────

    /** Loads a course and verifies the requester is its instructor (or ADMIN). */
    private Course requireOwned(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = course.getInstructor().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not own this course");
        }
        return course;
    }

    /** Verifies the requester owns the course that contains this section. */
    private Section requireSectionOwned(Long sectionId, Long userId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        requireOwned(section.getCourse().getId(), userId); // re-use ownership check
        return section;
    }

    /** Verifies the requester owns the course that contains this video's section. */
    private Video requireVideoOwned(Long videoId, Long userId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        requireSectionOwned(video.getSection().getId(), userId);
        return video;
    }
}
