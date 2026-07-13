package com.charity.repository;

import com.charity.entity.Receipt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReceiptRepository extends MongoRepository<Receipt, String> {
    Optional<Receipt> findByDonationDonationId(String donationId);
}

