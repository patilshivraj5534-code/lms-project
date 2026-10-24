package com.lms.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class QuizRequest {

    @NotBlank
    private String title;

    @NotNull
    @Valid
    private List<QuestionRequest> questions;

    @Data
    public static class QuestionRequest {

        @NotBlank
        private String questionText;

        @NotBlank
        private String optionA;

        @NotBlank
        private String optionB;

        @NotBlank
        private String optionC;

        @NotBlank
        private String optionD;

        @NotNull
        @Pattern(regexp = "[ABCD]", message = "correctOption must be A, B, C, or D")
        private String correctOption;

        private int orderIndex;
    }
}
