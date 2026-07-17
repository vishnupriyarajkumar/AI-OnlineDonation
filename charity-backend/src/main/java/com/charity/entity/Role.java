package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {

    @Id
    private String id;

    @Indexed(unique = true)
    private RoleName roleName;

    public enum RoleName {
        ADMIN, USER, NGO
    }
}
