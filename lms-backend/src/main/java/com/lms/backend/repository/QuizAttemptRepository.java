package com.lms.backend.repository;

import com.lms.backend.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdAndUserIdOrderByAttemptedAtDesc(Long quizId, Long userId);
    Optional<QuizAttempt> findFirstByQuizIdAndUserIdOrderByAttemptedAtDesc(Long quizId, Long userId);
}
