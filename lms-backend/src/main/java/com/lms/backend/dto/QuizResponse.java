package com.lms.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizResponse {

    private Long id;
    private Long courseId;
    private String title;

    private List<QuestionResponse> questions;

    @Data
    @Builder
    public static class QuestionResponse {
        private Long id;
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private int orderIndex;
        /** Null when returned to students; populated for instructor view. */
        private String correctOption;
    }
}
