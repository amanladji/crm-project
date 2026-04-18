package com.crm.backend.notification;

import com.crm.backend.entity.Notification;
import com.crm.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    /**
     * Get all notifications for a user, ordered by latest first
     */
    public List<Notification> getNotifications(String username) {
        return notificationRepository.findByUsernameOrderByCreatedAtDesc(username);
    }
    
    /**
     * Get count of unread notifications for a user
     */
    public Long getUnreadCount(String username) {
        return notificationRepository.countByUsernameAndIsReadFalse(username);
    }
    
    /**
     * Mark a notification as read
     */
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
    
    /**
     * Create a notification for a user (used internally by other services)
     */
    public Notification createNotification(String username, String message) {
        Notification notification = new Notification();
        notification.setUsername(username);
        notification.setMessage(message);
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notificationRepository.delete(notification);
    }
}
