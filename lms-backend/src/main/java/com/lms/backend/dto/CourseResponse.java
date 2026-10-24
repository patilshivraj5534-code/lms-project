package com.lms.backend.dto;

import com.lms.backend.entity.Course;
import com.lms.backend.model.CourseStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class CourseResponse {

    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseStatus status;
    private Instant createdAt;
    private Long instructorId;
    private String instructorName;

    public static CourseResponse from(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .status(course.getStatus())
                .createdAt(course.getCreatedAt())
                .instructorId(course.getInstructor().getId())
                .instructorName(course.getInstructor().getName())
                .build();
    }
}
