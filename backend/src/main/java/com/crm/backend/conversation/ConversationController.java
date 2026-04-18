package com.crm.backend.conversation;

import com.crm.backend.dto.ConversationRequest;
import com.crm.backend.entity.Conversation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    /**
     * GET /api/conversations
     * Get all conversations for logged-in user
     */
    @GetMapping
    public ResponseEntity<List<?>> getAllConversations(Authentication authentication) {
        String username = authentication.getName();
        List<?> conversations = conversationService.getUserConversations(username);
        return ResponseEntity.ok(conversations);
    }

    /**
     * GET /api/conversations/{conversationId}
     * Get a specific conversation by ID
     */
    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getConversation(@PathVariable Long conversationId, Authentication authentication) {
        String username = authentication.getName();
        var response = conversationService.getConversationDetails(conversationId, username);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/conversations
     * Create or get existing conversation with another user
     */
    @PostMapping
    public ResponseEntity<?> createConversation(
            @RequestBody ConversationRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        var conversation = conversationService.createOrGetConversation(username, request.getUserId());
        return new ResponseEntity<>(conversation, HttpStatus.CREATED);
    }

    /**
     * DELETE /api/conversations/{conversationId}
     * Delete a conversation
     */
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long conversationId, Authentication authentication) {
        String username = authentication.getName();
        conversationService.deleteConversation(conversationId, username);
        return ResponseEntity.noContent().build();
    }
}
