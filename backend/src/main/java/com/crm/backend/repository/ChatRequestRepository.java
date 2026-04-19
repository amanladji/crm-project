package com.crm.backend.repository;

import com.crm.backend.entity.ChatRequest;
import com.crm.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ChatRequest entity
 * Provides database operations for chat invitation system
 */
@Repository
public interface ChatRequestRepository extends JpaRepository<ChatRequest, Long> {
    
    /**
     * Find all pending requests for a receiver
     * Used to show "You have pending invitations" on chat page
     * 
     * @param receiver The user receiving the invitations
     * @return List of pending chat requests
     */
    List<ChatRequest> findByReceiverAndStatus(User receiver, String status);
    
    /**
     * Find all accepted requests between two users (in either direction)
     * Used to determine if two users can chat
     * 
     * @param user1 First user
     * @param user2 Second user
     * @param status Request status (usually "ACCEPTED")
     * @return Optional containing accepted request if it exists
     */
    @Query("SELECT cr FROM ChatRequest cr WHERE " +
           "((cr.sender = ?1 AND cr.receiver = ?2) OR (cr.sender = ?2 AND cr.receiver = ?1)) " +
           "AND cr.status = ?3")
    Optional<ChatRequest> findAcceptedRequest(User user1, User user2, String status);
    
    /**
     * Find existing request between two users (any status)
     * Used to prevent duplicate invitations
     * 
     * @param sender Sender user
     * @param receiver Receiver user
     * @return Optional containing existing request if found
     */
    Optional<ChatRequest> findBySenderAndReceiver(User sender, User receiver);
    
    /**
     * Get all accepted connections for a user (both sent and received)
     * Used to show list of users that current user can chat with
     * 
     * @param user User to get connections for
     * @param status Request status (usually "ACCEPTED")
     * @return List of users that have accepted chat requests
     */
    @Query("SELECT cr FROM ChatRequest cr WHERE (cr.sender = ?1 OR cr.receiver = ?1) AND cr.status = ?2")
    List<ChatRequest> findAcceptedRequests(User user, String status);
}
