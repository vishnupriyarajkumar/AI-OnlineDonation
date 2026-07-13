package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    private String logId;

    @DBRef
    private User user;

    private String action;
    private String entityType;
    private String entityId;
    private String ipAddress;
    private String details;

    @CreatedDate
    private LocalDateTime timestamp;
}
