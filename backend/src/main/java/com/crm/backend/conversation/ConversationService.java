package com.crm.backend.conversation;

import com.crm.backend.dto.ConversationRequest;
import com.crm.backend.entity.Conversation;
import com.crm.backend.entity.User;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.ConversationRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    /**
     * Get all conversations for a user
     */
    public List<?> getUserConversations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        List<Conversation> conversations = conversationRepository.findConversationsForUser(user.getId());
        
        return conversations.stream().map(conv -> {
            Map<String, Object> response = new HashMap<>();
            response.put("id", conv.getId());
            response.put("user1Id", conv.getUser1().getId());
            response.put("user1Username", conv.getUser1().getUsername());
            response.put("user2Id", conv.getUser2().getId());
            response.put("user2Username", conv.getUser2().getUsername());
            
            // Get "other user" from current user's perspective
            User otherUser = conv.getOtherUser(user.getId());
            response.put("otherUserId", otherUser != null ? otherUser.getId() : null);
            response.put("otherUsername", otherUser != null ? otherUser.getUsername() : null);
            
            response.put("createdAt", conv.getCreatedAt());
            return response;
        }).collect(Collectors.toList());
    }

    /**
     * Get conversation details for a specific conversation
     */
    public Map<String, Object> getConversationDetails(Long conversationId, String username) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        // Check if user is part of this conversation
        if (!conversation.hasUser(currentUser.getId())) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", conversation.getId());
        response.put("user1Id", conversation.getUser1().getId());
        response.put("user1Username", conversation.getUser1().getUsername());
        response.put("user2Id", conversation.getUser2().getId());
        response.put("user2Username", conversation.getUser2().getUsername());
        response.put("createdAt", conversation.getCreatedAt());
        
        User otherUser = conversation.getOtherUser(currentUser.getId());
        response.put("otherUserId", otherUser.getId());
        response.put("otherUsername", otherUser.getUsername());
        
        return response;
    }

    /**
     * Create or get existing conversation between two users
     */
    public Map<String, Object> createOrGetConversation(String currentUsername, Long otherUserId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found: " + currentUsername));
        
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Other user not found: " + otherUserId));
        
        if (currentUser.getId().equals(otherUser.getId())) {
            throw new IllegalArgumentException("Cannot create conversation with yourself");
        }
        
        // Try to find existing conversation
        java.util.Optional<Conversation> existing = conversationRepository.findConversation(
                currentUser.getId(), 
                otherUser.getId()
        );
        
        Conversation conversation;
        if (existing.isPresent()) {
            conversation = existing.get();
        } else {
            conversation = new Conversation();
            conversation.setUser1(currentUser);
            conversation.setUser2(otherUser);
            conversation = conversationRepository.save(conversation);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", conversation.getId());
        response.put("user1Id", conversation.getUser1().getId());
        response.put("user1Username", conversation.getUser1().getUsername());
        response.put("user2Id", conversation.getUser2().getId());
        response.put("user2Username", conversation.getUser2().getUsername());
        response.put("createdAt", conversation.getCreatedAt());
        response.put("otherUserId", otherUser.getId());
        response.put("otherUsername", otherUser.getUsername());
        
        return response;
    }

    /**
     * Delete a conversation
     */
    public void deleteConversation(Long conversationId, String username) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        // Check if user is part of this conversation
        if (!conversation.hasUser(currentUser.getId())) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
        
        conversationRepository.delete(conversation);
    }
}
