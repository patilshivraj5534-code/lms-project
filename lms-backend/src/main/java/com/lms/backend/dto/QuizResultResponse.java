package com.lms.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class QuizResultResponse {
    private int score;
    private int total;
    private double percentage;
    private boolean passed;
    /** questionId → correct option letter */
    private Map<Long, String> correctAnswers;
    /** questionId → student's chosen option letter */
    private Map<Long, String> yourAnswers;
}
