package com.lms.backend.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.lms.backend.entity.User;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.refresh-secret}")
    private String jwtRefreshSecret;

    private Algorithm accessTokenAlgorithm;
    private Algorithm refreshTokenAlgorithm;

    @PostConstruct
    private void init() {
        this.accessTokenAlgorithm = Algorithm.HMAC256(jwtSecret);
        this.refreshTokenAlgorithm = Algorithm.HMAC256(jwtRefreshSecret);
    }

    public String generateAccessToken(User user) {
        return JWT.create()
                .withSubject(user.getId().toString())
                .withClaim("email", user.getEmail())
                .withClaim("role", user.getRole().name())
                .withIssuedAt(Date.from(Instant.now()))
                .withExpiresAt(Date.from(Instant.now().plus(15, ChronoUnit.MINUTES)))
                .sign(accessTokenAlgorithm);
    }

    public String generateRefreshToken() {
        return JWT.create()
                .withJWTId(java.util.UUID.randomUUID().toString())
                .withIssuedAt(Date.from(Instant.now()))
                .withExpiresAt(Date.from(Instant.now().plus(30, ChronoUnit.DAYS)))
                .sign(refreshTokenAlgorithm);
    }

    public String validateAccessToken(String token) throws JWTVerificationException {
        return JWT.require(accessTokenAlgorithm)
                .build()
                .verify(token)
                .getSubject();
    }

    public String validateRefreshToken(String token) throws JWTVerificationException {
        return JWT.require(refreshTokenAlgorithm)
                .build()
                .verify(token)
                .getSubject();
    }

    public String getRoleFromToken(String token) {
        return JWT.require(accessTokenAlgorithm)
                .build()
                .verify(token)
                .getClaim("role")
                .asString();
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expiresAt = JWT.require(accessTokenAlgorithm)
                    .build()
                    .verify(token)
                    .getExpiresAt();
            return expiresAt.before(new Date());
        } catch (JWTVerificationException e) {
            return true;
        }
    }
}