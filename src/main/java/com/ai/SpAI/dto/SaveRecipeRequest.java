package com.ai.SpAI.dto;

import lombok.Data;

@Data
public class SaveRecipeRequest {
    private String userId;
    private String recipeText;
    private String ingredients;
    private String cuisine;
    private String dietaryRestrictions;
    private String recipeName;
}