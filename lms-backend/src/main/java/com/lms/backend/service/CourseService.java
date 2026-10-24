package com.lms.backend.service;

import com.lms.backend.dto.CourseDto;
import com.lms.backend.dto.CourseRequest;
import com.lms.backend.dto.CourseResponse;
import com.lms.backend.dto.SectionDto;
import com.lms.backend.dto.VideoDto;
import com.lms.backend.entity.Course;
import com.lms.backend.entity.Section;
import com.lms.backend.entity.User;
import com.lms.backend.entity.Video;
import com.lms.backend.entity.VideoProgress;
import com.lms.backend.model.CourseStatus;
import com.lms.backend.model.Role;
import com.lms.backend.repository.CourseRepository;
import com.lms.backend.repository.SectionRepository;
import com.lms.backend.repository.UserRepository;
import com.lms.backend.repository.VideoProgressRepository;
import com.lms.backend.repository.VideoRepository;
import com.lms.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final VideoRepository videoRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final EnrollmentRepository enrollmentRepository;

    // ── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public CourseResponse create(CourseRequest req, Long requesterId) {
        User instructor = getUser(requesterId);
        requireInstructorOrAdmin(instructor);

        Course course = Course.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .thumbnailUrl(req.getThumbnailUrl())
                .price(req.getPrice())
                .instructor(instructor)
                .build();

        return CourseResponse.from(courseRepository.save(course));
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    public List<CourseResponse> listPublished() {
        return courseRepository.findByStatus(CourseStatus.PUBLISHED)
                .stream().map(CourseResponse::from).toList();
    }

    public List<CourseResponse> listAll(Long requesterId) {
        User requester = getUser(requesterId);
        if (requester.getRole() == Role.ADMIN) {
            return courseRepository.findAll().stream().map(CourseResponse::from).toList();
        }
        // Instructors see their own courses in any status
        return courseRepository.findByInstructorId(requesterId)
                .stream().map(CourseResponse::from).toList();
    }

    public CourseResponse getById(Long courseId, Long requesterId) {
        Course course = getCourse(courseId);

        // Anonymous users can only see published courses
        if (requesterId == null) {
            if (course.getStatus() == CourseStatus.PUBLISHED) {
                return CourseResponse.from(course);
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        User requester = getUser(requesterId);
        if (course.getStatus() == CourseStatus.PUBLISHED
                || requester.getRole() == Role.ADMIN
                || course.getInstructor().getId().equals(requesterId)) {
            return CourseResponse.from(course);
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public CourseResponse update(Long courseId, CourseRequest req, Long requesterId) {
        Course course = getCourse(courseId);
        User requester = getUser(requesterId);
        requireOwnerOrAdmin(course, requester);

        course.setTitle(req.getTitle());
        course.setDescription(req.getDescription());
        course.setThumbnailUrl(req.getThumbnailUrl());
        course.setPrice(req.getPrice());

        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse publish(Long courseId, Long requesterId) {
        Course course = getCourse(courseId);
        User requester = getUser(requesterId);
        requireOwnerOrAdmin(course, requester);
        course.setStatus(CourseStatus.PUBLISHED);
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse unpublish(Long courseId, Long requesterId) {
        Course course = getCourse(courseId);
        User requester = getUser(requesterId);
        requireOwnerOrAdmin(course, requester);
        course.setStatus(CourseStatus.DRAFT);
        return CourseResponse.from(courseRepository.save(course));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long courseId, Long requesterId) {
        Course course = getCourse(courseId);
        User requester = getUser(requesterId);
        requireOwnerOrAdmin(course, requester);
        courseRepository.delete(course);
    }

    // ── Catalog endpoints ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CourseResponse> getPublishedCourses(Pageable pageable) {
        Page<Course> coursePage = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable);
        return coursePage.map(CourseResponse::from);
    }

    @Transactional(readOnly = true)
    public CourseDto getCourseTree(Long id, Long userId) {
        Course course = getCourse(id);

        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setInstructorId(course.getInstructor().getId());
        dto.setInstructorName(course.getInstructor().getName());
        dto.setThumbnailUrl(course.getThumbnailUrl());
        dto.setPrice(course.getPrice());
        dto.setStatus(course.getStatus());
        dto.setCreatedAt(course.getCreatedAt());

        // Get all video progress for this user (empty map if anonymous)
        Map<Long, Boolean> videoCompletionMap = new java.util.HashMap<>();

        // Check if user is enrolled or has privileged access
        boolean isEnrolled = false;
        boolean hasPrivilegedAccess = false;
        if (userId != null) {
            User requester = getUser(userId);
            isEnrolled = enrollmentRepository.findByUserIdAndCourseId(userId, id).isPresent();
            hasPrivilegedAccess = requester.getRole() == Role.ADMIN || course.getInstructor().getId().equals(userId);

            List<VideoProgress> progressList = videoProgressRepository.findByUserIdAndCourseId(userId, id);
            videoCompletionMap = progressList.stream()
                    .collect(Collectors.toMap(
                            vp -> vp.getVideo().getId(),
                            VideoProgress::getIsCompleted,
                            (v1, v2) -> v1 // handle duplicates if any
                    ));
        }

        // Get all sections ordered by orderIndex
        List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(course.getId());

        // Track completion state for sequential unlocking
        boolean[] previousVideoCompleted = {true}; // First video is always unlocked IF enrolled

        List<SectionDto> sectionDtos = new ArrayList<>();
        for (Section section : sections) {
            SectionDto secDto = new SectionDto();
            secDto.setId(section.getId());
            secDto.setTitle(section.getTitle());
            secDto.setOrderIndex(section.getOrderIndex());

            List<Video> videos = videoRepository.findBySectionIdOrderByOrderIndexAsc(section.getId());
            List<VideoDto> videoDtos = new ArrayList<>();
            for (Video v : videos) {
                VideoDto vDto = new VideoDto();
                vDto.setId(v.getId());
                vDto.setTitle(v.getTitle());
                vDto.setYoutubeId(v.getYoutubeId());
                vDto.setDuration(v.getDuration());
                vDto.setOrderIndex(v.getOrderIndex());
                
                // Map completion status
                boolean isCompleted = videoCompletionMap.getOrDefault(v.getId(), false);
                boolean hasProgress = videoCompletionMap.containsKey(v.getId());
                vDto.setIsCompleted(isCompleted);

                // Sequential unlocking logic:
                // 1. If owner/admin: everything unlocked
                // 2. If not enrolled: everything locked
                // 3. If enrolled:
                //    - Unlocked if:
                //      - It was previously accessed (hasProgress)
                //      - OR it is already completed (isCompleted)
                //      - OR it is the first video (previousVideoCompleted starts as true)
                //      - OR the previous video in the list was completed
                if (hasPrivilegedAccess) {
                    vDto.setLocked(false);
                } else if (!isEnrolled) {
                    vDto.setLocked(true);
                } else {
                    if (isCompleted || hasProgress || previousVideoCompleted[0]) {
                        vDto.setLocked(false);
                    } else {
                        vDto.setLocked(true);
                    }
                    // The NEXT video is unlocked if THIS video is completed
                    previousVideoCompleted[0] = isCompleted;
                }

                videoDtos.add(vDto);
            }
            secDto.setVideos(videoDtos);
            sectionDtos.add(secDto);
        }

        dto.setSections(sectionDtos);

        // Add prev/next IDs and unlock reasons
        List<VideoDto> flatVideos = sectionDtos.stream()
                .flatMap(s -> s.getVideos().stream())
                .toList();
        
        for (int i = 0; i < flatVideos.size(); i++) {
            VideoDto v = flatVideos.get(i);
            if (i > 0) v.setPreviousVideoId(flatVideos.get(i - 1).getId());
            if (i < flatVideos.size() - 1) v.setNextVideoId(flatVideos.get(i + 1).getId());
            
            if (v.getLocked() != null && v.getLocked()) {
                v.setUnlockReason("Complete the previous lesson to unlock this one.");
            }
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public VideoDto getVideoDetails(Long videoId, Long userId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        
        Course course = video.getSection().getCourse();
        CourseDto tree = getCourseTree(course.getId(), userId);
        
        // Find the video in the tree to get its locked/completed status and prev/next
        return tree.getSections().stream()
                .flatMap(s -> s.getVideos().stream())
                .filter(v -> v.getId().equals(videoId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found in course tree"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private void requireInstructorOrAdmin(User user) {
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.INSTRUCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only ADMIN or INSTRUCTOR can manage courses");
        }
    }

    private void requireOwnerOrAdmin(Course course, User requester) {
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isOwner = course.getInstructor().getId().equals(requester.getId());
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }
}
