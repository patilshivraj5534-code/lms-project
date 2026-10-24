package com.lms.backend.dto;

import com.lms.backend.model.CourseStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class CourseDto {
    private Long id;
    private String title;
    private String description;
    private Long instructorId;
    private String instructorName;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseStatus status;
    private Instant createdAt;
    private List<SectionDto> sections; // populated only for tree endpoint

    public CourseDto() {}

    public CourseDto(Long id, String title, String description, Long instructorId,
                     String thumbnailUrl, BigDecimal price, CourseStatus status, Instant createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.instructorId = instructorId;
        this.thumbnailUrl = thumbnailUrl;
        this.price = price;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getInstructorId() { return instructorId; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public BigDecimal getPrice() { return price; }
    public CourseStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public List<SectionDto> getSections() { return sections; }
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setStatus(CourseStatus status) { this.status = status; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setSections(List<SectionDto> sections) { this.sections = sections; }
    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }
}