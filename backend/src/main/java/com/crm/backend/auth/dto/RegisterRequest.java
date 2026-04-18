package com.crm.backend.auth.dto;

import com.crm.backend.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private Role role;
}
