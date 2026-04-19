package com.crm.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

/**
 * ChatRequest Entity - Manages chat invitation system
 * Tracks invitation requests between users
 * 
 * Features:
 * - Users can send chat invitations to others
 * - Receivers can accept or reject invitations
 * - Only accepted requests allow chatting
 * - Status tracking: PENDING, ACCEPTED, REJECTED
 */
@Entity
@Table(name = "chat_requests", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"sender_id", "receiver_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * User who sends the chat invitation
     * Foreign key to users table
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    /**
     * User who receives the chat invitation
     * Foreign key to users table
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    
    /**
     * Request status: PENDING, ACCEPTED, REJECTED
     * PENDING: Awaiting receiver response
     * ACCEPTED: Receiver accepted, can now chat
     * REJECTED: Receiver rejected the invitation
     */
    @Column(nullable = false)
    private String status = "PENDING";  // Default: PENDING
    
    /**
     * Timestamp when the request was created
     * Auto-populated by database
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
