package com.lms.backend.repository;

import com.lms.backend.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    List<Video> findBySectionIdOrderByOrderIndexAsc(Long sectionId);
    // Additional query methods if needed
}