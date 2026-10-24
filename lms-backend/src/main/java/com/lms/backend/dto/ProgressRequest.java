package com.lms.backend.dto;

public class ProgressRequest {
    private Integer lastPositionSeconds;
    private Boolean isCompleted;

    public ProgressRequest() {}

    public Integer getLastPositionSeconds() { return lastPositionSeconds; }
    public void setLastPositionSeconds(Integer lastPositionSeconds) { this.lastPositionSeconds = lastPositionSeconds; }

    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }
}