package com.crm.backend.repository;

import com.crm.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :user1Id AND m.receiver.id = :user2Id) " +
           "OR (m.sender.id = :user2Id AND m.receiver.id = :user1Id) ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM ChatMessage m2 WHERE m2.sender.id = :userId OR m2.receiver.id = :userId " +
           "GROUP BY CASE WHEN m2.sender.id = :userId THEN m2.receiver.id ELSE m2.sender.id END)")
    List<ChatMessage> findLatestMessagesForUser(@Param("userId") Long userId);
}