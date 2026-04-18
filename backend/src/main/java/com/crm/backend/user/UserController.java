package com.crm.backend.user;

import com.crm.backend.user.dto.CurrentUserDTO;
import com.crm.backend.entity.User;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * Get current authenticated user
     * @return CurrentUserDTO with id, username, and role
     */
    @GetMapping("/me")
    public ResponseEntity<CurrentUserDTO> getCurrentUser() {
        log.info("Fetching current authenticated user");
        CurrentUserDTO currentUser = userService.getCurrentUser();
        log.info("Current user retrieved: {}", currentUser.getUsername());
        return ResponseEntity.ok(currentUser);
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("Fetching all users");
        
        List<User> users = userRepository.findAll();
        List<UserDTO> userDTOs = users.stream()
            .map(user -> new UserDTO(user.getId(), user.getUsername(), user.getEmail()))
            .collect(Collectors.toList());
        
        log.info("Retrieved {} users", userDTOs.size());
        return ResponseEntity.ok(userDTOs);
    }

    // Simple DTO for user listing
    public static class UserDTO {
        public Long id;
        public String username;
        public String email;

        public UserDTO(Long id, String username, String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }
    }
}
