package com.lms.backend.dto;

import lombok.Data;

@Data
public class VideoResponse {
    private Long id;
    private Long sectionId;
    private String title;
    private String description;
    private String youtubeId;
    private Integer durationSeconds;
    private Integer orderIndex;

    public static VideoResponse from(com.lms.backend.entity.Video v) {
        VideoResponse r = new VideoResponse();
        r.id             = v.getId();
        r.sectionId      = v.getSection().getId();
        r.title          = v.getTitle();
        r.description    = v.getDescription();
        r.youtubeId      = v.getYoutubeId();
        r.durationSeconds = v.getDuration();
        r.orderIndex     = v.getOrderIndex();
        return r;
    }
}
