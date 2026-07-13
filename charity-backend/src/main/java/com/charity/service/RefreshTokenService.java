package com.charity.service;

import com.charity.entity.RefreshToken;
import com.charity.entity.User;
import com.charity.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Manages persistent refresh tokens used for session continuation.
 *
 * - Standard session  : 7-day token
 * - Remember Me       : 30-day token
 *
 * One token per user — replaced (rotated) on every new login.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final long STANDARD_DAYS  = 7;
    private static final long REMEMBER_DAYS  = 30;

    private final RefreshTokenRepository repo;

    /**
     * Creates (or replaces) a refresh token for the given user.
     *
     * @param user       the authenticated user
     * @param rememberMe true = 30-day token; false = 7-day token
     */
    @Transactional
    public RefreshToken create(User user, boolean rememberMe) {
        // Delete any existing token for this user (one token per user)
        repo.findByUser(user).ifPresent(repo::delete);
        // flush() not needed in MongoDB

        long days = rememberMe ? REMEMBER_DAYS : STANDARD_DAYS;

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusDays(days))
                .rememberMe(rememberMe)
                .build();

        return repo.save(token);
    }

    /**
     * Validates a token string. Deletes expired tokens automatically.
     */
    @Transactional
    public RefreshToken validate(String tokenStr) {
        RefreshToken token = repo.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token. Please log in again."));

        if (token.isExpired()) {
            repo.delete(token);
            throw new RuntimeException("Refresh token expired. Please log in again.");
        }

        return token;
    }

    /** Deletes the refresh token on logout */
    @Transactional
    public void deleteByUser(User user) {
        repo.deleteByUser(user);
    }

    /** Checks if a user has a valid (non-expired) refresh token */
    @Transactional(readOnly = true)
    public boolean hasValidToken(User user) {
        return repo.findByUser(user)
                .map(t -> !t.isExpired())
                .orElse(false);
    }
}
