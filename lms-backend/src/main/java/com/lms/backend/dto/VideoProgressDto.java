package com.lms.backend.dto;

public class VideoProgressDto {
    private Long videoId;
    private Integer lastPositionSeconds;
    private Boolean isCompleted;
    private Boolean locked;

    public VideoProgressDto() {}

    public Long getVideoId() { return videoId; }
    public void setVideoId(Long videoId) { this.videoId = videoId; }
    public Integer getLastPositionSeconds() { return lastPositionSeconds; }
    public void setLastPositionSeconds(Integer lastPositionSeconds) { this.lastPositionSeconds = lastPositionSeconds; }
    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }
    public Boolean getLocked() { return locked; }
    public void setLocked(Boolean locked) { this.locked = locked; }
}