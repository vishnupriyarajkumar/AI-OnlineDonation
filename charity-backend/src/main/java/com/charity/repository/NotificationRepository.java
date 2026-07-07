package com.charity.repository;

import com.charity.entity.Notification;
import com.charity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user);

    long countByUserAndReadFalse(User user);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user = :user AND n.read = false")
    int markAllReadForUser(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.user = :user")
    int markOneRead(@Param("id") Long id, @Param("user") User user);
}
