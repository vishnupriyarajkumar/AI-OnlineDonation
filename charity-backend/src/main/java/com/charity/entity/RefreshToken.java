package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "refresh_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

    @Id
    private String id;

    @DBRef
    @Indexed(unique = true)
    private User user;

    @Indexed(unique = true)
    private String token;

    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean rememberMe = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public boolean isExpired() { return LocalDateTime.now().isAfter(expiryDate); }
}
