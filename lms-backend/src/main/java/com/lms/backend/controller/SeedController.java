package com.lms.backend.controller;
import com.lms.backend.entity.*;
import com.lms.backend.model.CourseStatus;
import com.lms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class SeedController {
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private VideoRepository videoRepository;
    @GetMapping("/api/test/seed")
    public String seed() {
        Course course = courseRepository.findById(1L).orElseThrow();
        Section s1 = Section.builder().title("Getting Started").orderIndex(1).course(course).build();
        Section s2 = Section.builder().title("Core Concepts").orderIndex(2).course(course).build();
        sectionRepository.save(s1);
        sectionRepository.save(s2);
        Video v1 = Video.builder().title("Installation").youtubeId("abc123").duration(300).orderIndex(1).section(s1).build();
        Video v2 = Video.builder().title("Hello World").youtubeId("def456").duration(420).orderIndex(2).section(s1).build();
        videoRepository.save(v1);
        videoRepository.save(v2);
        return "Seeded!";
    }
}
