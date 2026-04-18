package com.crm.backend.repository;

import com.crm.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    /**
     * Find a conversation between two users, checking both directions
     * (user1=A AND user2=B) OR (user1=B AND user2=A)
     */
    @Query("SELECT c FROM Conversation c WHERE (c.user1.id = :user1Id AND c.user2.id = :user2Id) " +
           "OR (c.user1.id = :user2Id AND c.user2.id = :user1Id)")
    Optional<Conversation> findConversation(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    /**
     * Find all conversations for a specific user
     */
    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.createdAt DESC")
    List<Conversation> findConversationsForUser(@Param("userId") Long userId);
    
    /**
     * Find a conversation between two users (bidirectional), ordered by creation time
     */
    @Query("SELECT c FROM Conversation c WHERE (c.user1.id = :user1Id AND c.user2.id = :user2Id) " +
           "OR (c.user1.id = :user2Id AND c.user2.id = :user1Id) ORDER BY c.createdAt DESC")
    List<Conversation> findAllConversations(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
