package com.ai.SpAI.dto;

import lombok.Data;

@Data
public class SaveTravelRequest {
    private String destination;
    private Integer days;
    private String interests;
    private String budget;
    private String itineraryText;
    private String tripName;
    private String userId;
}