package com.ai.SpAI.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String userId;
    private String sessionId;
    private String prompt;
    private String aiResponse;
}