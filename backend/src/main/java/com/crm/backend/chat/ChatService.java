package com.crm.backend.chat;

import com.crm.backend.dto.ChatMessageRequest;
import com.crm.backend.dto.ChatMessageResponse;
import com.crm.backend.entity.ChatMessage;
import com.crm.backend.entity.Conversation;
import com.crm.backend.entity.User;
import com.crm.backend.repository.ChatMessageRepository;
import com.crm.backend.repository.ConversationRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    /**
     * Send a message between two users
     */
    public ChatMessageResponse sendMessage(ChatMessageRequest request, String senderUsername) {
        try {
            log.info("📨 Sending message from {} to receiver ID {}", senderUsername, request.getReceiverId());
            
            // Validate input
            if (request == null || request.getReceiverId() == null || request.getReceiverId() <= 0) {
                log.warn("Invalid message request: receiverId={}", 
                    request != null ? request.getReceiverId() : "null");
                throw new IllegalArgumentException("Receiver ID is required and must be positive");
            }
            
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                log.warn("Message content is empty");
                throw new IllegalArgumentException("Message content cannot be empty");
            }
            
            // Get sender
            User sender = userRepository.findByUsername(senderUsername)
                    .orElseThrow(() -> {
                        log.error("Sender not found: {}", senderUsername);
                        return new IllegalArgumentException("Sender user not found");
                    });
            
            log.debug("Sender found: ID={}, Username={}", sender.getId(), sender.getUsername());
            
            // Get receiver
            User receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> {
                        log.error("Receiver not found with ID: {}", request.getReceiverId());
                        return new IllegalArgumentException("Receiver user not found with ID: " + request.getReceiverId());
                    });
            
            log.debug("Receiver found: ID={}, Username={}", receiver.getId(), receiver.getUsername());
            
            // Find or create conversation
            Conversation conversation = conversationRepository
                    .findConversation(sender.getId(), receiver.getId())
                    .orElseGet(() -> {
                        log.info("Creating new conversation between {} and {}", sender.getId(), receiver.getId());
                        Conversation newConversation = new Conversation();
                        newConversation.setUser1(sender);
                        newConversation.setUser2(receiver);
                        return conversationRepository.save(newConversation);
                    });
            
            log.debug("Using conversation ID: {}", conversation.getId());
            
            // Create and save message
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setConversation(conversation);
            chatMessage.setSender(sender);
            chatMessage.setReceiver(receiver);
            chatMessage.setContent(request.getContent().trim());
            
            log.debug("Saving message: sender={}, receiver={}, content length={}", 
                sender.getId(), receiver.getId(), chatMessage.getContent().length());
            
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            
            log.info("✓ Message saved successfully with ID: {}", savedMessage.getId());
            
            return mapToResponse(savedMessage);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send message: " + e.getMessage());
        }
    }

    /**
     * Get all messages in a conversation between two users
     */
    public List<ChatMessageResponse> getConversation(Long userId, String currentUsername) {
        try {
            User currentUser = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new IllegalArgumentException("Current user not found"));
            
            log.info("📥 Fetching messages between User {} ({}) and User {}", 
                currentUser.getId(), currentUser.getUsername(), userId);
            
            // Fetch all messages in conversation (bidirectional)
            List<ChatMessage> messages = chatMessageRepository.findConversation(currentUser.getId(), userId);
            
            log.info("✓ Found {} messages in conversation", messages.size());
            
            if (messages.isEmpty()) {
                log.warn("  No messages found between users {} and {}", currentUser.getId(), userId);
            }
            
            // Map to response DTOs
            return messages.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching conversation with user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch conversation: " + e.getMessage());
        }
    }

    /**
     * Search for users by username or email
     */
    public List<Map<String, Object>> searchUsers(String query, String currentUsername) {
        try {
            User currentUser = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new IllegalArgumentException("Current user not found"));
            
            log.info("🔍 Searching for users with query: {}", query);
            
            if (query == null || query.trim().isEmpty()) {
                throw new IllegalArgumentException("Search query cannot be empty");
            }
            
            String searchQuery = query.trim().toLowerCase();
            
            // Search by username or email
            List<Map<String, Object>> results = userRepository.findAll().stream()
                    .filter(u -> !u.getId().equals(currentUser.getId())) // Exclude current user
                    .filter(u -> u.getUsername().toLowerCase().contains(searchQuery) || 
                               u.getEmail().toLowerCase().contains(searchQuery))
                    .limit(10) // Limit to 10 results
                    .map(u -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", u.getId());
                        userMap.put("username", u.getUsername());
                        userMap.put("email", u.getEmail());
                        userMap.put("name", u.getUsername());
                        return userMap;
                    })
                    .collect(Collectors.toList());
            
            log.info("✓ Found {} users matching query '{}'", results.size(), query);
            
            return results;
            
        } catch (Exception e) {
            log.error("Error searching users: {}", e.getMessage(), e);
            throw new RuntimeException("Error searching users: " + e.getMessage());
        }
    }

    /**
     * Process WebSocket message
     */
    public ChatMessageResponse processWebSocketMessage(ChatMessageRequest request, String currentUsername) {
        return sendMessage(request, currentUsername);
    }

    /**
     * Map ChatMessage entity to ChatMessageResponse DTO
     */
    private ChatMessageResponse mapToResponse(ChatMessage msg) {
        return new ChatMessageResponse(
                msg.getId(),
                msg.getConversation().getId(),
                msg.getSender().getId(),
                msg.getSender().getUsername(),
                msg.getReceiver().getId(),
                msg.getReceiver().getUsername(),
                msg.getContent(),
                msg.getTimestamp()
        );
    }
}
