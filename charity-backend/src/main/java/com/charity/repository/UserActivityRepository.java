package com.charity.repository;

import com.charity.entity.User;
import com.charity.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {
    Page<UserActivity> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<UserActivity> findByActivityTypeOrderByTimestampDesc(UserActivity.ActivityType type, Pageable pageable);
    Page<UserActivity> findByUserUserIdOrderByTimestampDesc(String userId, Pageable pageable);
    long countByActivityType(UserActivity.ActivityType type);
    List<UserActivity> findByUserUserIdOrderByTimestampDesc(String userId);
    List<UserActivity> findByTimestampAfter(LocalDateTime since);
    long countByActivityTypeAndTimestampAfter(UserActivity.ActivityType type, LocalDateTime since);
}
