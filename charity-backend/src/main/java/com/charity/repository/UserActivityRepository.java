package com.charity.repository;

import com.charity.entity.User;
import com.charity.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Page<UserActivity> findByUserOrderByTimestampDesc(User user, Pageable pageable);

    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<UserActivity> findByActivityTypeOrderByTimestampDesc(
            UserActivity.ActivityType type, Pageable pageable);

    @Query("SELECT a FROM UserActivity a WHERE " +
           "(:userId IS NULL OR a.user.userId = :userId) AND " +
           "(:type IS NULL OR a.activityType = :type) AND " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) " +
           "ORDER BY a.timestamp DESC")
    Page<UserActivity> filter(
            @Param("userId") Long userId,
            @Param("type")   UserActivity.ActivityType type,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to,
            Pageable pageable);

    long countByActivityType(UserActivity.ActivityType type);

    @Query("SELECT COUNT(DISTINCT a.user) FROM UserActivity a " +
           "WHERE a.activityType = 'LOGGED_IN' AND a.timestamp >= :since")
    long countActiveUsersSince(@Param("since") LocalDateTime since);
}
