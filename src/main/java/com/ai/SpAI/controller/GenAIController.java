package com.ai.SpAI.controller;

import com.ai.SpAI.service.ChatService;
import com.ai.SpAI.service.RecipeService;
import com.ai.SpAI.dto.TravelPlanRequest;
import com.ai.SpAI.service.TravelPlannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class GenAIController {

    private final RecipeService recipeService;
    private final ChatService chatService;
    private final TravelPlannerService travelPlannerService;

    @Autowired
    public GenAIController(RecipeService recipeService,
                           ChatService chatService,
                           TravelPlannerService travelPlannerService) {
        this.recipeService = recipeService;
        this.chatService = chatService;
        this.travelPlannerService = travelPlannerService;
    }

    @GetMapping("/ask-ai")
    public ResponseEntity<?> getResponse(@RequestParam String prompt) {
        try {
            System.out.println("/ask-ai called with prompt: " + prompt);
            String response = chatService.getResponse(prompt);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/ask-ai-options")
    public ResponseEntity<?> getResponseOptions(@RequestParam String prompt) {
        try {
            String response = chatService.getResponseOptions(prompt);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/recipe-creator")
    public ResponseEntity<?> recipeCreator(
            @RequestParam String ingredients,
            @RequestParam(defaultValue = "any") String cuisine,
            @RequestParam(defaultValue = "") String dietaryRestrictions) {
        try {
            String recipe = recipeService.createRecipe(ingredients, cuisine, dietaryRestrictions);
            return ResponseEntity.ok(recipe);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/travel/itinerary")
    public ResponseEntity<?> planItineraryGet(
            @RequestParam String destination,
            @RequestParam Integer days,
            @RequestParam(required = false) String interests,
            @RequestParam(required = false) String budget) {
        try {
            TravelPlanRequest request = new TravelPlanRequest(
                    destination,
                    days,
                    interests != null ? interests : "general sightseeing",
                    budget != null ? budget : "moderate"
            );

            String itinerary = travelPlannerService.generateItinerary(request);
            return ResponseEntity.ok(itinerary);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}