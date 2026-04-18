package com.crm.backend.campaign;

import com.crm.backend.dto.CreateCampaignRequest;
import com.crm.backend.dto.SendCampaignRequest;
import com.crm.backend.entity.Campaign;
import com.crm.backend.entity.CampaignUser;
import com.crm.backend.entity.ChatMessage;
import com.crm.backend.entity.Conversation;
import com.crm.backend.entity.User;
import com.crm.backend.repository.CampaignRepository;
import com.crm.backend.repository.CampaignUserRepository;
import com.crm.backend.repository.ChatMessageRepository;
import com.crm.backend.repository.ConversationRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignUserRepository campaignUserRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Create a new campaign and link users to it
     */
    public Campaign createCampaign(CreateCampaignRequest request) {
        try {
            log.info("Creating new campaign - name: {}", request.getName());
            
            // Validate name
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                log.warn("Campaign name is empty");
                throw new IllegalArgumentException("Campaign name is required");
            }
            
            // Validate message
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                log.warn("Campaign message is empty");
                throw new IllegalArgumentException("Campaign message is required");
            }
            
            // Create and save campaign
            Campaign campaign = new Campaign();
            campaign.setName(request.getName().trim());
            campaign.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
            campaign.setMessage(request.getMessage().trim());
            Campaign savedCampaign = campaignRepository.save(campaign);
            log.info("Campaign created successfully - id: {}, name: {}", savedCampaign.getId(), savedCampaign.getName());
            
            // Link selected users to campaign
            if (request.getUserIds() != null && !request.getUserIds().isEmpty()) {
                log.info("Linking {} users to campaign", request.getUserIds().size());
                
                for (Long userId : request.getUserIds()) {
                    User user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        CampaignUser campaignUser = new CampaignUser();
                        campaignUser.setCampaign(savedCampaign);
                        campaignUser.setUser(user);
                        campaignUserRepository.save(campaignUser);
                        log.info("Linked user {} to campaign {}", userId, savedCampaign.getId());
                    } else {
                        log.warn("User {} not found, skipping", userId);
                    }
                }
            } else {
                log.info("No users selected for this campaign");
            }
            
            return savedCampaign;
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error creating campaign: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create campaign: " + e.getMessage());
        }
    }

    /**
     * Send campaign messages to all selected users
     */
    public Map<String, Object> sendCampaign(SendCampaignRequest request, String senderUsername) {
        try {
            log.info("📨 Sending campaign messages");
            
            // Validate request
            if (request == null || request.getCampaignId() == null || request.getCampaignId() <= 0) {
                log.warn("Invalid send campaign request: campaignId={}", 
                    request != null ? request.getCampaignId() : "null");
                throw new IllegalArgumentException("Campaign ID is required and must be positive");
            }
            
            // Get current user (sender/admin)
            User sender = userRepository.findByUsername(senderUsername)
                    .orElseThrow(() -> {
                        log.error("Current user not found: {}", senderUsername);
                        return new IllegalArgumentException("Current user not found");
                    });
            
            log.info("Sender authenticated: {}", sender.getUsername());
            
            // Get campaign by ID
            Campaign campaign = campaignRepository.findById(request.getCampaignId())
                    .orElseThrow(() -> {
                        log.error("Campaign not found with ID: {}", request.getCampaignId());
                        return new IllegalArgumentException("Campaign not found with ID: " + request.getCampaignId());
                    });
            
            log.info("Campaign found: id={}, name={}", campaign.getId(), campaign.getName());
            
            // Get selected users for this campaign
            List<CampaignUser> campaignUsers = campaignUserRepository.findByCampaignId(campaign.getId());
            
            if (campaignUsers == null || campaignUsers.isEmpty()) {
                log.warn("No users selected for campaign {}", campaign.getId());
                throw new IllegalArgumentException("No users selected for this campaign");
            }
            
            log.info("Campaign has {} selected users", campaignUsers.size());
            
            // Send message to each user
            int successCount = 0;
            int failureCount = 0;
            
            for (CampaignUser campaignUser : campaignUsers) {
                try {
                    User recipient = campaignUser.getUser();
                    
                    if (recipient == null) {
                        log.warn("Recipient user is null, skipping");
                        failureCount++;
                        continue;
                    }
                    
                    log.debug("Sending campaign message to user: {}", recipient.getUsername());
                    
                    // Find or create conversation between sender and recipient
                    Conversation conversation = conversationRepository
                            .findConversation(sender.getId(), recipient.getId())
                            .orElseGet(() -> {
                                log.info("Creating new conversation between {} and {}", 
                                    sender.getUsername(), recipient.getUsername());
                                Conversation newConversation = new Conversation();
                                newConversation.setUser1(sender);
                                newConversation.setUser2(recipient);
                                return conversationRepository.save(newConversation);
                            });
                    
                    log.debug("Using conversation ID: {}", conversation.getId());
                    
                    // Create and save message
                    ChatMessage chatMessage = new ChatMessage();
                    chatMessage.setConversation(conversation);
                    chatMessage.setSender(sender);
                    chatMessage.setReceiver(recipient);
                    chatMessage.setContent(campaign.getMessage());
                    
                    ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
                    
                    log.info("✓ Message sent successfully to user {} via campaign", recipient.getUsername());
                    successCount++;
                    
                } catch (Exception e) {
                    log.error("Error sending message to user: {}", e.getMessage(), e);
                    failureCount++;
                }
            }
            
            log.info("Campaign message sending complete: success={}, failure={}", successCount, failureCount);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("campaignId", campaign.getId());
            response.put("campaignName", campaign.getName());
            response.put("totalRecipients", campaignUsers.size());
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("message", "Campaign messages sent successfully");
            
            return response;
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error sending campaign messages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send campaign messages: " + e.getMessage());
        }
    }
}
