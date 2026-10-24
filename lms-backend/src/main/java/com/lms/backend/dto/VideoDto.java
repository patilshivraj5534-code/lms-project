package com.lms.backend.dto;

public class VideoDto {
    private Long id;
    private String title;
    private String youtubeId;
    private Integer duration;
    private Integer orderIndex;
    private Boolean locked;
    private Boolean isCompleted;
    private String unlockReason;
    private Long previousVideoId;
    private Long nextVideoId;

    public VideoDto() {}

    public VideoDto(Long id, String title, String youtubeId,
                     Integer duration, Integer orderIndex) {
        this.id = id;
        this.title = title;
        this.youtubeId = youtubeId;
        this.duration = duration;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getYoutubeId() { return youtubeId; }
    public Integer getDuration() { return duration; }
    public Integer getOrderIndex() { return orderIndex; }
    public Boolean getLocked() { return locked; }
    public Boolean getIsCompleted() { return isCompleted; }
    public String getUnlockReason() { return unlockReason; }
    public Long getPreviousVideoId() { return previousVideoId; }
    public Long getNextVideoId() { return nextVideoId; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setYoutubeId(String youtubeId) { this.youtubeId = youtubeId; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public void setLocked(Boolean locked) { this.locked = locked; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }
    public void setUnlockReason(String unlockReason) { this.unlockReason = unlockReason; }
    public void setPreviousVideoId(Long previousVideoId) { this.previousVideoId = previousVideoId; }
    public void setNextVideoId(Long nextVideoId) { this.nextVideoId = nextVideoId; }
}