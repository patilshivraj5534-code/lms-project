package com.lms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SectionResponse {
    private Long id;
    private Long courseId;
    private String title;
    private Integer orderIndex;
    private List<VideoResponse> videos;

    public static SectionResponse from(com.lms.backend.entity.Section s, List<VideoResponse> videos) {
        SectionResponse r = new SectionResponse();
        r.id        = s.getId();
        r.courseId  = s.getCourse().getId();
        r.title     = s.getTitle();
        r.orderIndex = s.getOrderIndex();
        r.videos    = videos;
        return r;
    }
}
