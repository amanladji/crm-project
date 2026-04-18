package com.crm.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequest {
    private Long userId;  // ID of the other user to create conversation with
}
