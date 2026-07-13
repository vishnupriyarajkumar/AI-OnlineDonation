package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Receipt {

    @Id
    private String receiptId;

    @DBRef
    @Indexed(unique = true)
    private Donation donation;

    @Indexed(unique = true)
    private String receiptNumber;

    @CreatedDate
    private LocalDateTime issuedAt;

    private String pdfUrl;
}
