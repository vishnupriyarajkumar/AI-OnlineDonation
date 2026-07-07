package com.charity.security;

import com.charity.entity.User;
import com.charity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Loads user for Spring Security JWT validation only.
 * isVerified is NOT checked here — AuthService handles that
 * during the login business logic, so unverified users can
 * still have their token validated after verification.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail() != null ? user.getEmail() : user.getPhone(),
                user.getPassword(),
                user.getEnabled(),          // account enabled
                true,                       // accountNonExpired
                true,                       // credentialsNonExpired
                !user.getLocked(),          // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName().name()))
        );
    }
}
