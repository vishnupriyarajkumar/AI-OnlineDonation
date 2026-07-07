package com.charity.repository;

import com.charity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByRoleRoleName(com.charity.entity.Role.RoleName roleName);
    long countByLocked(boolean locked);
    long countByIsVerified(boolean isVerified);
}
