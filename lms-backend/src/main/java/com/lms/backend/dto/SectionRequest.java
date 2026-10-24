package com.lms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class SectionRequest {

    @NotBlank(message = "Section title is required")
    private String title;

    @NotNull(message = "Order index is required")
    @Min(value = 1, message = "Order index must be >= 1")
    private Integer orderIndex;
}
