package com.lms.backend.dto;

import java.util.List;

public class SectionDto {
    private Long id;
    private String title;
    private Integer orderIndex;
    private List<VideoDto> videos;

    public SectionDto() {}

    public SectionDto(Long id, String title, Integer orderIndex) {
        this.id = id;
        this.title = title;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Integer getOrderIndex() { return orderIndex; }
    public List<VideoDto> getVideos() { return videos; }
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public void setVideos(List<VideoDto> videos) { this.videos = videos; }
}