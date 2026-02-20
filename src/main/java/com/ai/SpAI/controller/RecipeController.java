package com.ai.SpAI.controller;

import com.ai.SpAI.dto.SaveRecipeRequest;
import com.ai.SpAI.entity.SavedRecipe;
import com.ai.SpAI.repository.SavedRecipeRepository;
import com.ai.SpAI.service.RecipeService;
import com.ai.SpAI.util.ApiResponseWrapper;
import com.ai.SpAI.util.RateLimiter;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:3000")
public class RecipeController {

    private static final Logger logger = LoggerFactory.getLogger(RecipeController.class);

    private final RecipeService recipeService;
    private final RateLimiter rateLimiter;

    @Autowired
    private SavedRecipeRepository savedRecipeRepository;

    @Autowired
    public RecipeController(RecipeService recipeService, RateLimiter rateLimiter) {
        this.recipeService = recipeService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/create")
    @Cacheable(value = "recipes",
            key = "#ingredients + '_' + #cuisine + '_' + #dietaryRestrictions",
            unless = "#result.body.data == null")
    @CircuitBreaker(name = "recipeService", fallbackMethod = "recipeFallback")
    @io.github.resilience4j.ratelimiter.annotation.RateLimiter(name = "recipeService")
    @Retry(name = "recipeService")
    public ResponseEntity<?> createRecipe(
            @RequestParam @NotBlank String ingredients,
            @RequestParam(defaultValue = "any") String cuisine,
            @RequestParam(defaultValue = "") String dietaryRestrictions) {

        long startTime = System.currentTimeMillis();
        logger.info("Recipe request with ingredients: {}", ingredients);

        try {
            if (!rateLimiter.tryAcquire("recipe")) {
                return ResponseEntity.status(429)
                        .body(ApiResponseWrapper.error("Too many requests. Please try again later."));
            }

            String recipe = recipeService.createRecipe(
                    ingredients.trim(),
                    cuisine.trim().toLowerCase(),
                    dietaryRestrictions.trim()
            );

            long duration = System.currentTimeMillis() - startTime;
            logger.info("Recipe generated in {} ms", duration);

            return ResponseEntity.ok(ApiResponseWrapper.success(recipe));

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid recipe request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error generating recipe: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to generate recipe. Please try again."));
        }
    }

    @GetMapping("/create/async")
    public DeferredResult<ResponseEntity<?>> createRecipeAsync(
            @RequestParam @NotBlank String ingredients,
            @RequestParam(defaultValue = "any") String cuisine,
            @RequestParam(defaultValue = "") String dietaryRestrictions) {

        DeferredResult<ResponseEntity<?>> deferredResult = new DeferredResult<>(60000L);

        logger.info("Async recipe request with ingredients: {}", ingredients);

        CompletableFuture.supplyAsync(() ->
                recipeService.createRecipe(
                        ingredients.trim(),
                        cuisine.trim().toLowerCase(),
                        dietaryRestrictions.trim()
                )
        ).thenAccept(result -> {
            deferredResult.setResult(ResponseEntity.ok(ApiResponseWrapper.success(result)));
        }).exceptionally(error -> {
            logger.error("Async recipe failed: {}", error.getMessage());
            deferredResult.setErrorResult(
                    ResponseEntity.status(500).body(ApiResponseWrapper.error("Failed to generate recipe"))
            );
            return null;
        });

        deferredResult.onTimeout(() -> {
            logger.warn("Async recipe timeout");
            deferredResult.setErrorResult(
                    ResponseEntity.status(408).body(ApiResponseWrapper.error("Request timeout"))
            );
        });

        return deferredResult;
    }

    // 🔥 FIXED: Save using userId from request body
    @PostMapping("/save")
    public ResponseEntity<ApiResponseWrapper<SavedRecipe>> saveRecipe(
            @RequestBody SaveRecipeRequest request) {

        try {
            String userId = request.getUserId();
            if (userId == null || userId.isEmpty()) {
                userId = "anonymous_user";
            }

            SavedRecipe recipe = new SavedRecipe();
            recipe.setUserId(userId);
            recipe.setRecipeText(request.getRecipeText());
            recipe.setIngredients(request.getIngredients());
            recipe.setCuisine(request.getCuisine());
            recipe.setDietaryRestrictions(request.getDietaryRestrictions());
            recipe.setRecipeName(request.getRecipeName());

            SavedRecipe saved = savedRecipeRepository.save(recipe);
            logger.info("Recipe saved with ID: {} for user: {}", saved.getId(), userId);

            return ResponseEntity.ok(ApiResponseWrapper.success("Recipe saved successfully", saved));
        } catch (Exception e) {
            logger.error("Failed to save recipe: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to save recipe: " + e.getMessage()));
        }
    }

    // 🔥 FIXED: Get saved recipes using userId from query parameter
    @GetMapping("/saved")
    public ResponseEntity<ApiResponseWrapper<List<SavedRecipe>>> getSavedRecipes(
            @RequestParam String userId) {

        try {
            if (userId == null || userId.isEmpty()) {
                userId = "anonymous_user";
            }

            List<SavedRecipe> recipes = savedRecipeRepository.findByUserIdOrderBySavedAtDesc(userId);

            logger.info("Retrieved {} saved recipes for user: {}", recipes.size(), userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Recipes retrieved", recipes));
        } catch (Exception e) {
            logger.error("Failed to get saved recipes: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get recipes: " + e.getMessage()));
        }
    }

    @GetMapping("/saved/{id}")
    public ResponseEntity<ApiResponseWrapper<SavedRecipe>> getSavedRecipe(
            @PathVariable Long id,
            @RequestParam String userId) {

        try {
            SavedRecipe recipe = savedRecipeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Recipe not found"));

            if (!recipe.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to view this recipe"));
            }

            return ResponseEntity.ok(ApiResponseWrapper.success("Recipe retrieved", recipe));
        } catch (Exception e) {
            logger.error("Failed to get recipe: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get recipe: " + e.getMessage()));
        }
    }

    @DeleteMapping("/saved/{id}")
    public ResponseEntity<ApiResponseWrapper<Void>> deleteSavedRecipe(
            @PathVariable Long id,
            @RequestParam String userId) {

        try {
            SavedRecipe recipe = savedRecipeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Recipe not found"));

            if (!recipe.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to delete this recipe"));
            }

            savedRecipeRepository.deleteById(id);

            logger.info("Recipe deleted with ID: {} for user: {}", id, userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Recipe deleted successfully", null));
        } catch (Exception e) {
            logger.error("Failed to delete recipe: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to delete recipe: " + e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam String ingredients) {
        try {
            String suggestions = "Try these: pasta, stir-fry, soup, salad based on " + ingredients;
            return ResponseEntity.ok(ApiResponseWrapper.success(suggestions));
        } catch (Exception e) {
            logger.error("Error getting suggestions: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get suggestions"));
        }
    }

    public ResponseEntity<?> recipeFallback(String ingredients, String cuisine,
                                            String dietaryRestrictions, Exception e) {
        logger.warn("Fallback triggered for recipe: {}", e.getMessage());
        return ResponseEntity.ok(ApiResponseWrapper.success(
                "Simple Recipe:\n\n" +
                        "1. Heat oil in a pan\n" +
                        "2. Add your ingredients and stir-fry\n" +
                        "3. Season to taste\n" +
                        "4. Serve hot\n\n" +
                        "For a detailed AI-generated recipe, please try again later."
        ));
    }
}