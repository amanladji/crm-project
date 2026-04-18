package com.crm.backend.user;

import com.crm.backend.user.dto.CurrentUserDTO;
import com.crm.backend.entity.User;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get current authenticated user from JWT token
     * @return CurrentUserDTO with id, username, and role
     * @throws UsernameNotFoundException if user not found
     */
    public CurrentUserDTO getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching current user: {}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> {
                log.error("User not found: {}", username);
                return new UsernameNotFoundException("User not found: " + username);
            });
        
        log.info("User found: {} with role: {}", user.getUsername(), user.getRole());
        return new CurrentUserDTO(user.getId(), user.getUsername(), user.getRole().toString());
    }
}
