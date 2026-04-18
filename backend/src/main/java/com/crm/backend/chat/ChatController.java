package com.crm.backend.chat;

import com.crm.backend.dto.ChatMessageRequest;
import com.crm.backend.dto.ChatMessageResponse;
import com.crm.backend.exception.ErrorData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Chat Controller - handles message sending and retrieval
 * Features:
 * - REST endpoint for sending messages
 * - WebSocket support for real-time messaging
 * - Message retrieval from conversations
 * - User search functionality
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Test endpoint to verify chat API is accessible
     */
    @GetMapping("/api/chat/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Chat API is working");
    }

    /**
     * Send a message via REST endpoint
     * POST /api/chat/send
     * Request: { "receiverId": 2, "content": "hello" }
     * Response: ChatMessageResponse with 201 Created
     */
    @PostMapping("/api/chat/send")
    public ResponseEntity<?> sendMessage(
            @RequestBody ChatMessageRequest request,
            Authentication authentication) {
        
        try {
            log.info("📨 POST /api/chat/send - Sending message");
            
            if (request == null) {
                log.warn("Chat send request is null");
                return ResponseEntity.badRequest().body(
                    new ErrorData("Invalid request", "Request body is empty")
                );
            }
            
            String senderUsername = authentication.getName();
            ChatMessageResponse response = chatService.sendMessage(request, senderUsername);
            
            return ResponseEntity.status(201).body(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Invalid request", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to send message: " + e.getMessage())
            );
        }
    }

    /**
     * WebSocket message endpoint for real-time messaging
     * Sends message to both sender and receiver
     */
    @MessageMapping("/chat")
    public void processMessage(
            @Payload ChatMessageRequest request, 
            Authentication authentication) {
        
        try {
            log.info("📨 WebSocket /app/chat - Message received");
            
            if (authentication == null || !authentication.isAuthenticated()) {
                log.warn("WebSocket: Authentication failed");
                return;
            }
            
            String currentUsername = authentication.getName();
            log.debug("WebSocket sender: {}", currentUsername);
            
            if (request == null || request.getReceiverId() == null || request.getContent() == null) {
                log.warn("WebSocket: Invalid request - missing receiverId or content");
                return;
            }
            
            ChatMessageResponse response = chatService.processWebSocketMessage(request, currentUsername);
            
            log.info("✓ WebSocket: Message processed with ID: {}", response.getId());
            
            // Send to recipient
            log.debug("WebSocket: Sending to recipient {}", response.getReceiverName());
            messagingTemplate.convertAndSendToUser(
                    response.getReceiverName(), "/queue/messages", response
            );
            
            // Send back to sender
            log.debug("WebSocket: Sending to sender {}", response.getSenderName());
            messagingTemplate.convertAndSendToUser(
                    response.getSenderName(), "/queue/messages", response
            );
            
            log.info("✓ WebSocket: Message delivered successfully");
            
        } catch (IllegalArgumentException e) {
            log.warn("WebSocket: Validation error: {}", e.getMessage());
        } catch (Exception e) {
            log.error("WebSocket: Error processing message: {}", e.getMessage(), e);
        }
    }

    /**
     * Get all messages in a conversation with a specific user
     * GET /api/chat/{userId}
     * Returns: List of ChatMessageResponse
     */
    @GetMapping("/api/chat/{userId}")
    public ResponseEntity<List<ChatMessageResponse>> getConversation(
            @PathVariable Long userId, 
            Authentication authentication) {
        
        try {
            log.info("📥 GET /api/chat/{} - Fetching conversation messages", userId);
            
            String currentUsername = authentication.getName();
            List<ChatMessageResponse> messages = chatService.getConversation(userId, currentUsername);
            
            log.info("✓ Returning {} messages", messages.size());
            return ResponseEntity.ok(messages);
            
        } catch (Exception e) {
            log.error("Error fetching conversation with user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Collections.emptyList());
        }
    }

    /**
     * Search for users by username or email
     * GET /api/users/search?query=username
     * Returns: List of user objects with id, username, email, name
     */
    @GetMapping("/api/users/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam String query, 
            Authentication authentication) {
        
        try {
            log.info("🔍 GET /api/users/search?query={} - Searching for users", query);
            
            String currentUsername = authentication.getName();
            List<Map<String, Object>> results = chatService.searchUsers(query, currentUsername);
            
            log.info("✓ Found {} users", results.size());
            return ResponseEntity.ok(results);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error searching users: {}", e.getMessage());
            return ResponseEntity.status(500).body("Error searching users: " + e.getMessage());
        }
    }
}
