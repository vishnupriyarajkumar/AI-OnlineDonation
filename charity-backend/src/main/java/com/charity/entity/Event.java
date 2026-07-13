package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    private String eventId;

    private String eventName;
    private String location;
    private LocalDateTime eventDate;
    private String description;

    @DBRef
    private Campaign campaign;

    @DBRef
    private User createdBy;

    @Builder.Default
    private EventStatus status = EventStatus.UPCOMING;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum EventStatus { UPCOMING, ONGOING, COMPLETED, CANCELLED }
}
