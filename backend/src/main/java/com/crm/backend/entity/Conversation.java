package com.crm.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Helper method to check if a user is part of this conversation
     */
    public boolean hasUser(Long userId) {
        return user1.getId().equals(userId) || user2.getId().equals(userId);
    }

    /**
     * Get the other user in this conversation
     */
    public User getOtherUser(Long userId) {
        if (user1.getId().equals(userId)) {
            return user2;
        } else if (user2.getId().equals(userId)) {
            return user1;
        }
        return null;
    }
}
