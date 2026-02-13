package com.ai.SpAI.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TravelPlanRequest(
        @JsonProperty("destination") String destination,
        @JsonProperty("days") Integer days,
        @JsonProperty("interests") String interests,
        @JsonProperty("budget") String budget
){
        public TravelPlanRequest(){
                this(null,null,null,null);
        }
}