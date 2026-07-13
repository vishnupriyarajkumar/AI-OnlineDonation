package com.charity.repository;

import com.charity.entity.Subscription;
import com.charity.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    Optional<Subscription> findByUser(User user);
    Optional<Subscription> findByUserUserId(String userId);
    List<Subscription> findByDonorTypeAndStatusAndNextDonationDateLessThanEqual(
        Subscription.DonorType type, Subscription.SubscriptionStatus status, LocalDate date);
    List<Subscription> findByDonorTypeAndStatusAndNextDonationDate(
        Subscription.DonorType type, Subscription.SubscriptionStatus status, LocalDate date);
    long countByDonorType(Subscription.DonorType type);
    long countByDonorTypeAndStatus(Subscription.DonorType type, Subscription.SubscriptionStatus status);
    List<Subscription> findByDonorTypeAndStatus(Subscription.DonorType type, Subscription.SubscriptionStatus status);
    List<Subscription> findByNextDonationDateBetween(LocalDate from, LocalDate to);
}
