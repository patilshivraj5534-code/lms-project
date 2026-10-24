package com.lms.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class QuizSubmitRequest {
    /** Map of questionId → chosen option letter ("A", "B", "C", or "D") */
    @NotNull
    private Map<Long, String> answers;
}
