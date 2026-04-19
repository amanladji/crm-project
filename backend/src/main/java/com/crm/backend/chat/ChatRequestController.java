package com.crm.backend.chat;

import com.crm.backend.entity.ChatRequest;
import com.crm.backend.exception.ErrorData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Chat Request Controller
 * Manages chat invitation endpoints
 * 
 * Endpoints:
 * - POST /api/chat/invite - Send invitation
 * - GET /api/chat/requests - Get pending invitations
 * - POST /api/chat/accept/{id} - Accept invitation
 * - POST /api/chat/reject/{id} - Reject invitation
 * - GET /api/chat/accepted-users - Get users available for chatting
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatRequestController {
    
    private final ChatRequestService chatRequestService;
    
    /**
     * Send a chat invitation to another user
     * POST /api/chat/invite
     * 
     * Body: { "receiverId": 2 }
     * Response: 201 Created with ChatRequest object
     */
    @PostMapping("/invite")
    public ResponseEntity<?> sendInvitation(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        
        try {
            log.info("📤 POST /api/chat/invite - Sending chat invitation");
            
            Long receiverId = request.get("receiverId");
            if (receiverId == null) {
                log.warn("receiverId is missing from request");
                return ResponseEntity.badRequest().body(
                    new ErrorData("Invalid request", "receiverId is required")
                );
            }
            
            String senderUsername = authentication.getName();
            ChatRequest chatRequest = chatRequestService.sendInvitation(senderUsername, receiverId);
            
            log.info("✅ Invitation sent successfully");
            return ResponseEntity.status(201).body(chatRequest);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Invalid request", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error sending invitation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to send invitation")
            );
        }
    }
    
    /**
     * Get all pending chat requests for current user
     * GET /api/chat/requests
     * 
     * Response: 200 OK with list of pending requests
     * Example: [
     *   {
     *     "id": 1,
     *     "senderId": 2,
     *     "senderName": "john",
     *     "senderEmail": "john@example.com",
     *     "createdAt": "2026-04-19T10:30:00"
     *   }
     * ]
     */
    @GetMapping("/requests")
    public ResponseEntity<?> getPendingRequests(Authentication authentication) {
        try {
            log.info("📥 GET /api/chat/requests - Fetching pending requests");
            
            String username = authentication.getName();
            List<Map<String, Object>> pendingRequests = 
                chatRequestService.getPendingRequests(username);
            
            log.info("✅ Returned {} pending requests", pendingRequests.size());
            return ResponseEntity.ok(pendingRequests);
            
        } catch (Exception e) {
            log.error("Error fetching pending requests: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to fetch pending requests")
            );
        }
    }
    
    /**
     * Accept a chat invitation
     * POST /api/chat/accept/{id}
     * 
     * Path: id = ChatRequest ID
     * Response: 200 OK with accepted ChatRequest
     */
    @PostMapping("/accept/{id}")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            log.info("✅ POST /api/chat/accept/{} - Accepting invitation", id);
            
            String username = authentication.getName();
            ChatRequest chatRequest = chatRequestService.acceptInvitation(id, username);
            
            log.info("✅ Invitation accepted successfully");
            return ResponseEntity.ok(chatRequest);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Invalid request", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error accepting invitation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to accept invitation")
            );
        }
    }
    
    /**
     * Reject a chat invitation
     * POST /api/chat/reject/{id}
     * 
     * Path: id = ChatRequest ID
     * Response: 200 OK
     */
    @PostMapping("/reject/{id}")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            log.info("❌ POST /api/chat/reject/{} - Rejecting invitation", id);
            
            String username = authentication.getName();
            chatRequestService.rejectInvitation(id, username);
            
            log.info("✅ Invitation rejected successfully");
            return ResponseEntity.ok(
                Map.of("message", "Invitation rejected successfully")
            );
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Invalid request", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error rejecting invitation: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to reject invitation")
            );
        }
    }
    
    /**
     * Get all users that current user can chat with
     * Returns only users with ACCEPTED chat status
     * 
     * GET /api/chat/accepted-users
     * 
     * Response: 200 OK with list of accepted connections
     * Example: [
     *   {
     *     "id": 2,
     *     "username": "john",
     *     "email": "john@example.com"
     *   }
     * ]
     */
    @GetMapping("/accepted-users")
    public ResponseEntity<?> getAcceptedConnections(Authentication authentication) {
        try {
            log.info("🔗 GET /api/chat/accepted-users - Fetching accepted connections");
            
            String username = authentication.getName();
            List<Map<String, Object>> acceptedUsers = 
                chatRequestService.getAcceptedConnections(username);
            
            log.info("✅ Returned {} accepted connections", acceptedUsers.size());
            return ResponseEntity.ok(acceptedUsers);
            
        } catch (Exception e) {
            log.error("Error fetching accepted connections: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to fetch accepted connections")
            );
        }
    }
}
