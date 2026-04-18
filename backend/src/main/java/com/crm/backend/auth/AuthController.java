package com.crm.backend.auth;

import com.crm.backend.auth.dto.AuthResponse;
import com.crm.backend.auth.dto.LoginRequest;
import com.crm.backend.auth.dto.RegisterRequest;
import com.crm.backend.dto.ErrorResponse;
import com.crm.backend.entity.User;
import com.crm.backend.enums.Role;
import com.crm.backend.repository.UserRepository;
import com.crm.backend.security.JwtUtils;
import com.crm.backend.security.UserDetailsImpl;
import com.crm.backend.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            if (loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Username and password are required", 400));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Safely extract role from authorities
            String role = "USER";
            if (userDetails.getAuthorities() != null && !userDetails.getAuthorities().isEmpty()) {
                role = userDetails.getAuthorities().iterator().next().getAuthority();
            }

            return ResponseEntity.ok(new AuthResponse(jwt, userDetails.getId(), userDetails.getUsername(), role));
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid username or password", 401));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        try {
            // Validate inputs
            if (signUpRequest.getUsername() == null || signUpRequest.getUsername().trim().isEmpty()) {
                System.out.println("Register validation failed: Username is empty");
                return ResponseEntity.badRequest().body(new ErrorResponse("Username is required", 400));
            }

            if (signUpRequest.getEmail() == null || signUpRequest.getEmail().trim().isEmpty()) {
                System.out.println("Register validation failed: Email is empty");
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is required", 400));
            }

            if (signUpRequest.getPassword() == null || signUpRequest.getPassword().isEmpty()) {
                System.out.println("Register validation failed: Password is empty");
                return ResponseEntity.badRequest().body(new ErrorResponse("Password is required", 400));
            }

            // Validate password length (minimum 8 characters)
            if (signUpRequest.getPassword().length() < 8) {
                System.out.println("Register validation failed: Password too short");
                return ResponseEntity.badRequest().body(new ErrorResponse("Password must be at least 8 characters long", 400));
            }

            // Check if username already exists
            if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
                System.out.println("Register validation failed: Username already exists");
                return ResponseEntity.badRequest().body(new ErrorResponse("Username is already taken", 400));
            }

            // Check if email already exists
            if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
                System.out.println("Register validation failed: Email already registered");
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is already registered", 400));
            }

            System.out.println("Creating new user: " + signUpRequest.getUsername());

            // Create new user's account
            User user = new User();
            user.setUsername(signUpRequest.getUsername());
            user.setEmail(signUpRequest.getEmail());
            user.setPassword(encoder.encode(signUpRequest.getPassword()));
            
            // Setup Role - ENSURE THIS IS NOT NULL
            Role userRole = signUpRequest.getRole() != null ? signUpRequest.getRole() : Role.USER;
            user.setRole(userRole);
            
            System.out.println("User object prepared. Role: " + userRole + ", Username: " + user.getUsername() + ", Email: " + user.getEmail());

            // Save user to database
            System.out.println("Saving user to database...");
            User savedUser = userRepository.save(user);
            System.out.println("User saved successfully with ID: " + savedUser.getId());

            // Generate JWT token for the newly registered user
            System.out.println("Loading user details for JWT generation...");
            UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
            System.out.println("User details loaded. Building authentication token...");
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            System.out.println("Generating JWT token...");
            String jwt = jwtUtils.generateJwtToken(authentication);
            System.out.println("JWT token generated successfully. Token length: " + jwt.length());

            // Return user info with JWT token
            System.out.println("Registration successful. Returning response...");
            return ResponseEntity.ok(new AuthResponse(jwt, savedUser.getId(), savedUser.getUsername(), userRole.toString()));
            
        } catch (Exception e) {
            System.err.println("REGISTRATION ERROR: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
    }
}
