package com.charity.repository;

import com.charity.entity.OtpVerification;
import com.charity.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends MongoRepository<OtpVerification, String> {

    Optional<OtpVerification> findByUser(User user);

    void deleteByUser(User user);
}

