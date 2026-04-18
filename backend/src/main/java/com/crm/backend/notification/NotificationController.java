package com.crm.backend.notification;

import com.crm.backend.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * GET /api/notifications
     * Get all notifications for logged-in user
     */
    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Fetching notifications for user: {}", username);
            
            List<Notification> notifications = notificationService.getNotifications(username);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("error", "Failed to fetch notifications", "message", e.getMessage())
            );
        }
    }
    
    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications for logged-in user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Fetching unread count for user: {}", username);
            
            Long unreadCount = notificationService.getUnreadCount(username);
            return ResponseEntity.ok(
                Map.of("unreadCount", unreadCount)
            );
        } catch (Exception e) {
            log.error("Error fetching unread count: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                Map.of("error", "Failed to fetch unread count", "message", e.getMessage())
            );
        }
    }
    
    /**
     * PUT /api/notifications/{id}/read
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Marking notification {} as read for user: {}", id, username);
            
            Notification notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(notification);
        } catch (RuntimeException e) {
            log.error("Notification not found: {}", id);
            return ResponseEntity.status(404).body(
                Map.of("error", "Notification not found")
            );
        }
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Notification not found: {}", id);
            return ResponseEntity.status(404).body(
                Map.of("error", "Notification not found")
            );
        }
    }
}
