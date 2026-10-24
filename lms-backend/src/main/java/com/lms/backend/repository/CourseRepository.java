package com.lms.backend.repository;

import com.lms.backend.entity.Course;
import com.lms.backend.model.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByStatus(CourseStatus status);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    List<Course> findByInstructorId(Long instructorId);

    List<Course> findByInstructorIdAndStatus(Long instructorId, CourseStatus status);
}
