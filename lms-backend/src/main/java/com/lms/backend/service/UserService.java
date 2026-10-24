package com.lms.backend.service;

import com.lms.backend.entity.RefreshToken;
import com.lms.backend.entity.User;
import com.lms.backend.model.Role;
import com.lms.backend.repository.RefreshTokenRepository;
import com.lms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String name, String email, String password) {
        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return user;
    }

    @Transactional
    public RefreshToken saveRefreshToken(User user, String rawToken) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawToken)
                .user(user)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void deleteRefreshToken(String token) {
        RefreshToken rt = refreshTokenRepository.findByToken(token);
        if (rt != null) {
            refreshTokenRepository.delete(rt);
        }
    }

    public User getUserByRefreshToken(String token) {
        RefreshToken rt = refreshTokenRepository.findByToken(token);
        if (rt == null) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
        return rt.getUser();
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        if (principal instanceof String) {
            return Long.parseLong((String) principal);
        }
        throw new IllegalArgumentException("Cannot extract user ID from authentication");
    }

    /** Fetches the currently authenticated User entity. */
    public User getCurrentUser() {
        Long id = getCurrentUserId();
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /** Returns null if the request is unauthenticated (anonymous browsing). */
    public Long getCurrentUserIdOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getPrincipal())) {
                return null;
            }
            return getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
