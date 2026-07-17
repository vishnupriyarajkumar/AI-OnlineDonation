package com.charity.repository;

import com.charity.entity.Achievement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends MongoRepository<Achievement, String> {
    List<Achievement> findByUserUserIdOrderByEarnedAtDesc(String userId);
    Optional<Achievement> findByUserUserIdAndType(String userId, Achievement.AchievementType type);
    boolean existsByUserUserIdAndType(String userId, Achievement.AchievementType type);
    long countByUserUserId(String userId);
}
