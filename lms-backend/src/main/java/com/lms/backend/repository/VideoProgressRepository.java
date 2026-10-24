package com.lms.backend.repository;

import com.lms.backend.entity.VideoProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {

    Optional<VideoProgress> findByUserIdAndVideoId(Long userId, Long videoId);

    List<VideoProgress> findByUserId(Long userId);

    @Query("SELECT vp FROM VideoProgress vp " +
           "JOIN vp.video v " +
           "JOIN v.section s " +
           "JOIN s.course c " +
           "WHERE vp.user.id = :userId AND c.id = :courseId")
    List<VideoProgress> findByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
