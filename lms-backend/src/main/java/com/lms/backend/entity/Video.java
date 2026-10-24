package com.lms.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "videos",
    indexes = {
        @Index(name = "idx_video_section",   columnList = "section_id"),
        @Index(name = "idx_video_order",     columnList = "order_index")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_video_section_order", columnNames = {"section_id", "order_index"})
    }
)
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false)
    private String title;

    /** Optional longer description shown on the lesson card. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * The 11-character YouTube video ID (e.g. "grEKMHGYyns").
     * No video files are stored — only this metadata.
     */
    @Column(name = "youtube_id", nullable = false)
    private String youtubeId;

    /** Duration in seconds — nullable, can be back-filled from the YouTube player. */
    @Column(name = "duration_seconds")
    private Integer duration;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}