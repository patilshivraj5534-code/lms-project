package com.lms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VideoRequest {

    @NotBlank(message = "Video title is required")
    private String title;

    /** Optional longer description shown to students. */
    private String description;

    /**
     * 11-character YouTube video ID.
     * Example: "grEKMHGYyns"
     * Only the ID is stored — no video files are kept in the system.
     */
    @NotBlank(message = "YouTube video ID is required")
    @Pattern(
        regexp = "^[A-Za-z0-9_-]{11}$",
        message = "Must be a valid 11-character YouTube video ID (e.g. grEKMHGYyns)"
    )
    private String youtubeId;

    /** Duration in seconds. Nullable — can be backfilled later from the YouTube player. */
    @Min(value = 1, message = "Duration must be positive if provided")
    private Integer durationSeconds;

    @NotNull(message = "Order index is required")
    @Min(value = 1, message = "Order index must be >= 1")
    private Integer orderIndex;
}
