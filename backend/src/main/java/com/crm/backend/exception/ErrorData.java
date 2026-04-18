package com.crm.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Simple error response object for API endpoints
 */
@Data
@AllArgsConstructor
public class ErrorData {
    private String error;
    private String message;
}
