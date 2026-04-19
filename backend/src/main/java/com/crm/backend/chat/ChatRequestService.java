package com.crm.backend.chat;

import com.crm.backend.entity.ChatRequest;
import com.crm.backend.entity.User;
import com.crm.backend.repository.ChatRequestRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Chat Request Service
 * Business logic for chat invitation system
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRequestService {
    
    private final ChatRequestRepository chatRequestRepository;
    private final UserRepository userRepository;
    
    /**
     * Send a chat invitation from sender to receiver
     * Checks if request already exists to prevent duplicates
     */
    public ChatRequest sendInvitation(String senderUsername, Long receiverId) {
        log.info("📤 Sending chat invitation from {} to user ID {}", senderUsername, receiverId);
        
        // Get sender
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> {
                    log.error("Sender not found: {}", senderUsername);
                    return new IllegalArgumentException("Sender user not found");
                });
        
        // Get receiver
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> {
                    log.error("Receiver not found with ID: {}", receiverId);
                    return new IllegalArgumentException("Receiver user not found");
                });
        
        // Check if receiver is the sender
        if (sender.getId().equals(receiver.getId())) {
            log.warn("User {} tried to invite themselves", senderUsername);
            throw new IllegalArgumentException("You cannot invite yourself");
        }
        
        // Check if request already exists
        var existingRequest = chatRequestRepository.findBySenderAndReceiver(sender, receiver);
        if (existingRequest.isPresent()) {
            log.warn("Chat request already exists from {} to {}", sender.getId(), receiver.getId());
            throw new IllegalArgumentException("Chat request already exists");
        }
        
        // Create new chat request
        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setSender(sender);
        chatRequest.setReceiver(receiver);
        chatRequest.setStatus("PENDING");
        
        ChatRequest saved = chatRequestRepository.save(chatRequest);
        log.info("✅ Chat invitation saved with ID: {}", saved.getId());
        
        return saved;
    }
    
    /**
     * Get all pending chat requests for a user
     * Shows invitations that user has received and not yet responded to
     */
    public List<Map<String, Object>> getPendingRequests(String username) {
        log.info("📥 Fetching pending requests for user: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<ChatRequest> pendingRequests = chatRequestRepository
                .findByReceiverAndStatus(user, "PENDING");
        
        log.info("✅ Found {} pending requests", pendingRequests.size());
        
        return pendingRequests.stream()
                .map(cr -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", cr.getId());
                    map.put("senderId", cr.getSender().getId());
                    map.put("senderName", cr.getSender().getUsername());
                    map.put("senderEmail", cr.getSender().getEmail());
                    map.put("createdAt", cr.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Accept a chat invitation
     * Changes status from PENDING to ACCEPTED
     */
    public ChatRequest acceptInvitation(Long requestId, String username) {
        log.info("✅ Accepting chat request ID: {} by user: {}", requestId, username);
        
        ChatRequest chatRequest = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> {
                    log.error("Chat request not found with ID: {}", requestId);
                    return new IllegalArgumentException("Chat request not found");
                });
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Log the request details
        log.debug("  Sender ID: {}, Sender Username: {}", 
            chatRequest.getSender().getId(), chatRequest.getSender().getUsername());
        log.debug("  Receiver ID: {}, Receiver Username: {}", 
            chatRequest.getReceiver().getId(), chatRequest.getReceiver().getUsername());
        log.debug("  Current user ID: {}, Current user Username: {}", user.getId(), user.getUsername());
        
        // Verify that the current user is the receiver
        if (!chatRequest.getReceiver().getId().equals(user.getId())) {
            log.warn("User {} tried to accept request meant for {}", 
                user.getId(), chatRequest.getReceiver().getId());
            throw new IllegalArgumentException("You can only accept requests sent to you");
        }
        
        // Update status
        chatRequest.setStatus("ACCEPTED");
        ChatRequest updated = chatRequestRepository.save(chatRequest);
        
        log.info("✅ Chat request ID {} accepted. Sender ID {} and Receiver ID {} can now chat", 
            requestId, chatRequest.getSender().getId(), chatRequest.getReceiver().getId());
        return updated;
    }
    
    /**
     * Reject a chat invitation
     * Changes status from PENDING to REJECTED
     */
    public void rejectInvitation(Long requestId, String username) {
        log.info("❌ Rejecting chat request ID: {} by user: {}", requestId, username);
        
        ChatRequest chatRequest = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Chat request not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Verify that the current user is the receiver
        if (!chatRequest.getReceiver().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only reject requests sent to you");
        }
        
        // Update status
        chatRequest.setStatus("REJECTED");
        chatRequestRepository.save(chatRequest);
        
        log.info("✅ Chat request ID {} rejected", requestId);
    }
    
    /**
     * Get all users that current user can chat with
     * Returns users where status is ACCEPTED (bidirectional)
     */
    public List<Map<String, Object>> getAcceptedConnections(String username) {
        log.info("🔗 Fetching accepted connections for user: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        try {
            // Fetch all accepted requests where user is either sender or receiver
            List<ChatRequest> acceptedRequests = chatRequestRepository
                    .findAcceptedRequests(user, "ACCEPTED");
            
            log.info("✅ Found {} accepted requests for user ID {}", acceptedRequests.size(), user.getId());
            
            // Extract the other user from each request and deduplicate
            Map<Long, User> userMap = new java.util.HashMap<>();
            
            acceptedRequests.stream()
                    .filter(cr -> cr != null)  // Filter out null requests
                    .forEach(cr -> {
                        try {
                            User sender = cr.getSender();
                            User receiver = cr.getReceiver();
                            
                            if (sender == null || receiver == null) {
                                log.warn("  ⚠️ Chat request {} has null sender or receiver - skipping", cr.getId());
                                return;
                            }
                            
                            // Determine which user is the "other" user
                            User otherUser;
                            if (sender.getId().equals(user.getId())) {
                                otherUser = receiver;
                                log.debug("  • Accepted user (I sent invitation): ID={}, Username={}", 
                                    otherUser.getId(), otherUser.getUsername());
                            } else {
                                otherUser = sender;
                                log.debug("  • Accepted user (They sent invitation): ID={}, Username={}", 
                                    otherUser.getId(), otherUser.getUsername());
                            }
                            
                            // Only add if not already in map (deduplicate)
                            if (!userMap.containsKey(otherUser.getId())) {
                                userMap.put(otherUser.getId(), otherUser);
                            }
                        } catch (Exception e) {
                            log.error("  ❌ Error processing chat request {}: {}", cr.getId(), e.getMessage());
                        }
                    });
            
            log.info("✅ Returning {} unique accepted connections", userMap.size());
            
            return userMap.values().stream()
                    .map(u -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", u.getId());
                        map.put("username", u.getUsername());
                        map.put("email", u.getEmail());
                        return map;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("❌ Error fetching accepted connections for user {}: {}", username, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch accepted connections: " + e.getMessage());
        }
    }
}
