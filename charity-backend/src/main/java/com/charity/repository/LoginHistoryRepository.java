package com.charity.repository;

import com.charity.entity.LoginHistory;
import com.charity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoginHistoryRepository extends MongoRepository<LoginHistory, String> {
    List<LoginHistory> findByUserOrderByLoginTimeDesc(User user);
    Page<LoginHistory> findAllByOrderByLoginTimeDesc(Pageable pageable);
    Optional<LoginHistory> findTopByUserOrderByLoginTimeDesc(User user);
    long countByLoginTimeAfter(LocalDateTime since);
    long countByStatusAndLoginTimeAfter(LoginHistory.LoginStatus status, LocalDateTime since);
    List<LoginHistory> findTop10ByOrderByLoginTimeDesc();
}

