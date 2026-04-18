package com.crm.backend.repository;

import com.crm.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find all notifications for a user, ordered by latest first
    List<Notification> findByUsernameOrderByCreatedAtDesc(String username);
    
    // Count unread notifications for a user
    Long countByUsernameAndIsReadFalse(String username);
}
