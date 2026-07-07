package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(User user, String action, String entityType, Long entityId, String ipAddress, String details) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> getUserLogs(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserUserIdOrderByTimestampDesc(userId, pageable);
    }
}
