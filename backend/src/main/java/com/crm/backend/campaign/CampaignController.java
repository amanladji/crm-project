package com.crm.backend.campaign;

import com.crm.backend.dto.CreateCampaignRequest;
import com.crm.backend.dto.SendCampaignRequest;
import com.crm.backend.entity.Campaign;
import com.crm.backend.exception.ErrorData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

/**
 * Campaign Controller - handles campaign creation and sending campaign messages
 * Features:
 * - Create campaigns and link users
 * - Send campaign messages to selected users
 * - Track campaign message delivery status
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    /**
     * Create a new campaign and link users to it
     * POST /api/campaigns
     * Request: { "name": "Email Campaign", "description": "...", "message": "...", "userIds": [1, 2, 3] }
     * Response: Campaign with 201 Created
     */
    @PostMapping
    public ResponseEntity<?> createCampaign(@Valid @RequestBody CreateCampaignRequest request) {
        try {
            log.info("📝 POST /api/campaigns - Creating new campaign: {}", request.getName());
            
            Campaign savedCampaign = campaignService.createCampaign(request);
            
            log.info("✓ Campaign created with ID: {}", savedCampaign.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCampaign);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Validation error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error creating campaign: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to create campaign: " + e.getMessage())
            );
        }
    }

    /**
     * Send campaign messages to selected users
     * POST /api/campaigns/send
     * Request: { "campaignId": 1 }
     * Response: { campaignId, campaignName, totalRecipients, successCount, failureCount, message }
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendCampaign(
            @RequestBody SendCampaignRequest request,
            Authentication authentication) {
        
        try {
            log.info("📨 POST /api/campaigns/send - Sending campaign messages");
            
            if (request == null) {
                log.warn("Send campaign request is null");
                return ResponseEntity.badRequest().body(
                    new ErrorData("Invalid request", "Request body is empty")
                );
            }
            
            String senderUsername = authentication.getName();
            Map<String, Object> response = campaignService.sendCampaign(request, senderUsername);
            
            log.info("✓ Campaign messages sent - Success: {}, Failure: {}", 
                response.get("successCount"), response.get("failureCount"));
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                new ErrorData("Validation error", e.getMessage())
            );
        } catch (Exception e) {
            log.error("Error sending campaign messages: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                new ErrorData("Server error", "Failed to send campaign messages: " + e.getMessage())
            );
        }
    }
}
