package com.crm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private Long user1Id;
    private String user1Username;
    private Long user2Id;
    private String user2Username;
    private LocalDateTime createdAt;
    
    /**
     * Returns the other user's ID in this conversation
     */
    public Long getOtherUserId(Long currentUserId) {
        return currentUserId.equals(user1Id) ? user2Id : user1Id;
    }
    
    /**
     * Returns the other user's username in this conversation
     */
    public String getOtherUserUsername(Long currentUserId) {
        return currentUserId.equals(user1Id) ? user2Username : user1Username;
    }
}
