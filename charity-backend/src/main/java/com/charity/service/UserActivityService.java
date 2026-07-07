package com.charity.service;

import com.charity.entity.User;
import com.charity.entity.UserActivity;
import com.charity.entity.UserActivity.ActivityType;
import com.charity.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Records and retrieves all user activities.
 * All writes are async so they never slow down the main request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserActivityRepository repo;

    // ── Write (async) ──────────────────────────────────────────

    @Async
    @Transactional
    public void record(User user, ActivityType type, String description,
                       String ipAddress, String metadata) {
        try {
            repo.save(UserActivity.builder()
                    .user(user)
                    .activityType(type)
                    .description(description)
                    .ipAddress(ipAddress)
                    .metadata(metadata)
                    .build());
        } catch (Exception e) {
            log.error("Failed to record activity {} for user {}: {}",
                    type, user != null ? user.getEmail() : "null", e.getMessage());
        }
    }

    /** Convenience — no metadata */
    @Async
    @Transactional
    public void record(User user, ActivityType type, String description, String ipAddress) {
        record(user, type, description, ipAddress, null);
    }

    // ── Read ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserActivity> getAll(Pageable pageable) {
        return repo.findAllByOrderByTimestampDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Page<UserActivity> getByUser(User user, Pageable pageable) {
        return repo.findByUserOrderByTimestampDesc(user, pageable);
    }

    @Transactional(readOnly = true)
    public Page<UserActivity> filter(Long userId, ActivityType type,
                                     LocalDateTime from, LocalDateTime to,
                                     Pageable pageable) {
        return repo.filter(userId, type, from, to, pageable);
    }

    // ── Stats ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countByType(ActivityType type) {
        return repo.countByActivityType(type);
    }

    @Transactional(readOnly = true)
    public long countActiveUsersToday() {
        return repo.countActiveUsersSince(LocalDateTime.now().minusHours(24));
    }
}
