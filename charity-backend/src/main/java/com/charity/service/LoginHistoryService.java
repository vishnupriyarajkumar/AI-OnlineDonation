package com.charity.service;

import com.charity.entity.LoginHistory;
import com.charity.entity.User;
import com.charity.repository.LoginHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Records login and logout events permanently.
 * User data is NEVER deleted — only the session timestamps change.
 */
@Service
@RequiredArgsConstructor
public class LoginHistoryService {

    private final LoginHistoryRepository repo;

    /** Records a new login event. Returns the saved record (for later logout update). */
    @Async
    @Transactional
    public void recordLogin(User user, String ipAddress, String deviceInfo,
                            LoginHistory.LoginStatus status) {
        LoginHistory history = LoginHistory.builder()
                .user(user)
                .loginTime(LocalDateTime.now())
                .ipAddress(ipAddress)
                .deviceInfo(deviceInfo)
                .status(status)
                .build();
        repo.save(history);
    }

    /** Updates the logout time on the most recent login record for this user. */
    @Async
    @Transactional
    public void recordLogout(User user) {
        repo.findTopByUserOrderByLoginTimeDesc(user).ifPresent(h -> {
            h.setLogoutTime(LocalDateTime.now());
            repo.save(h);
        });
    }

    @Transactional(readOnly = true)
    public List<LoginHistory> getUserHistory(User user) {
        return repo.findByUserOrderByLoginTimeDesc(user);
    }

    @Transactional(readOnly = true)
    public Page<LoginHistory> getAllHistory(Pageable pageable) {
        return repo.findAllByOrderByLoginTimeDesc(pageable);
    }
}
