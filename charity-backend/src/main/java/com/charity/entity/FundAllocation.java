package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "fund_allocations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FundAllocation {

    @Id
    private String allocationId;

    @DBRef
    private Campaign campaign;

    @DBRef
    private User allocatedBy;

    private BigDecimal amount;
    private String purpose;
    private String description;

    @CreatedDate
    private LocalDateTime allocatedAt;
}
