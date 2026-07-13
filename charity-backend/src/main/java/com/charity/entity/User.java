package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    private String userId;

    private String fullName;

    @Indexed(unique = true, sparse = true)
    private String email;

    private String password;

    @Indexed(unique = true, sparse = true)
    private String phone;

    private String address;

    @DBRef
    private Role role;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Boolean locked = false;

    @Builder.Default
    private int failedLoginAttempts = 0;

    private LocalDateTime lastFailedLogin;

    @Builder.Default
    private String preferredLanguage = "en";

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
