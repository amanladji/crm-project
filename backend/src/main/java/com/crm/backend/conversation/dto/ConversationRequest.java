package com.crm.backend.conversation.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequest {
    private String otherUsername;  // Username of the other user to start conversation with
}
