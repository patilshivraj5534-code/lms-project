package com.lms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectProgressDto {
    private Integer totalVideos;
    private Integer completedVideos;
    private Double percentComplete;
    private Long lastVideoId;
    private Integer lastPositionSeconds;
}
