package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "login_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginHistory {

    @Id
    private String id;

    @DBRef
    private User user;

    private LocalDateTime loginTime;
    private LocalDateTime logoutTime;
    private String ipAddress;
    private String deviceInfo;

    @Builder.Default
    private LoginStatus status = LoginStatus.SUCCESS;

    public enum LoginStatus { SUCCESS, FAILED, LOCKED }
}
