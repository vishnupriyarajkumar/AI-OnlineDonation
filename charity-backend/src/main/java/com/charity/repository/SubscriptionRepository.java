package com.charity.repository;

import com.charity.entity.Subscription;
import com.charity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUser(User user);

    Optional<Subscription> findByUserUserId(Long userId);

    /** All active monthly subscriptions due on or before a date */
    @Query("SELECT s FROM Subscription s WHERE s.donorType = 'MONTHLY' " +
           "AND s.status = 'ACTIVE' AND s.nextDonationDate <= :date")
    List<Subscription> findDueSubscriptions(@Param("date") LocalDate date);

    /** Reminder: due tomorrow */
    @Query("SELECT s FROM Subscription s WHERE s.donorType = 'MONTHLY' " +
           "AND s.status = 'ACTIVE' AND s.nextDonationDate = :tomorrow")
    List<Subscription> findSubscriptionsDueTomorrow(@Param("tomorrow") LocalDate tomorrow);

    long countByDonorType(Subscription.DonorType type);

    long countByDonorTypeAndStatus(Subscription.DonorType type, Subscription.SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.donorType = 'MONTHLY' AND s.status = 'ACTIVE'")
    List<Subscription> findAllActiveMonthly();
}
