package com.ai.SpAI.controller;

import com.ai.SpAI.dto.SaveTravelRequest;
import com.ai.SpAI.dto.TravelPlanRequest;
import com.ai.SpAI.entity.SavedTravel;
import com.ai.SpAI.repository.SavedTravelRepository;
import com.ai.SpAI.service.TravelPlannerService;
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

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/travel")
@CrossOrigin(origins = "http://localhost:3000")
public class TravelController {

    private static final Logger logger = LoggerFactory.getLogger(TravelController.class);

    private final TravelPlannerService travelPlannerService;
    private final RateLimiter rateLimiter;

    @Autowired
    private SavedTravelRepository savedTravelRepository;

    @Autowired
    public TravelController(TravelPlannerService travelPlannerService, RateLimiter rateLimiter) {
        this.travelPlannerService = travelPlannerService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/itinerary")
    @Cacheable(value = "itineraries",
            key = "#destination + '_' + #days + '_' + #interests + '_' + #budget",
            unless = "#result.body == null")
    @CircuitBreaker(name = "travelService", fallbackMethod = "itineraryFallback")
    @io.github.resilience4j.ratelimiter.annotation.RateLimiter(name = "travelService")
    @Retry(name = "travelService")
    public ResponseEntity<?> planItinerary(
            @RequestParam @NotBlank String destination,
            @RequestParam @Min(1) Integer days,
            @RequestParam(required = false, defaultValue = "general sightseeing") String interests,
            @RequestParam(required = false, defaultValue = "moderate") String budget) {

        long startTime = System.currentTimeMillis();
        logger.info("Planning itinerary for destination: {}, days: {}", destination, days);

        try {
            if (!rateLimiter.tryAcquire("travel")) {
                return ResponseEntity.status(429)
                        .body(ApiResponseWrapper.error("Too many requests. Please try again later."));
            }

            TravelPlanRequest request = new TravelPlanRequest(
                    destination.trim(),
                    days,
                    interests.trim(),
                    budget.trim().toLowerCase()
            );

            String itinerary = travelPlannerService.generateItinerary(request);

            long duration = System.currentTimeMillis() - startTime;
            logger.info("Itinerary generated in {} ms for {}", duration, destination);

            return ResponseEntity.ok(ApiResponseWrapper.success(itinerary));

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error generating itinerary for {}: {}", destination, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to generate itinerary. Please try again."));
        }
    }

    @GetMapping("/itinerary/async")
    public DeferredResult<ResponseEntity<?>> planItineraryAsync(
            @RequestParam @NotBlank String destination,
            @RequestParam @Min(1) Integer days,
            @RequestParam(required = false) String interests,
            @RequestParam(required = false) String budget) {

        DeferredResult<ResponseEntity<?>> deferredResult = new DeferredResult<>(60000L);

        logger.info("Async itinerary request for {}", destination);

        CompletableFuture.supplyAsync(() -> {
            TravelPlanRequest request = new TravelPlanRequest(
                    destination.trim(),
                    days,
                    interests != null ? interests.trim() : "general sightseeing",
                    budget != null ? budget.trim().toLowerCase() : "moderate"
            );
            return travelPlannerService.generateItinerary(request);
        }).thenAccept(result -> {
            deferredResult.setResult(ResponseEntity.ok(ApiResponseWrapper.success(result)));
        }).exceptionally(error -> {
            logger.error("Async itinerary failed: {}", error.getMessage());
            deferredResult.setErrorResult(
                    ResponseEntity.status(500).body(ApiResponseWrapper.error("Failed to generate itinerary"))
            );
            return null;
        });

        deferredResult.onTimeout(() -> {
            logger.warn("Async itinerary timeout for {}", destination);
            deferredResult.setErrorResult(
                    ResponseEntity.status(408).body(ApiResponseWrapper.error("Request timeout"))
            );
        });

        return deferredResult;
    }

    // 🔥 FIXED: Save using userId from request body with null check
    @PostMapping("/save")
    public ResponseEntity<ApiResponseWrapper<SavedTravel>> saveItinerary(
            @RequestBody SaveTravelRequest request) {

        try {
            // 🔥 Get userId with null check
            String userId = request.getUserId();
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            logger.info("Saving itinerary for user: {}", userId);

            SavedTravel travel = new SavedTravel();
            travel.setUserId(userId);
            travel.setDestination(request.getDestination());
            travel.setDays(request.getDays());
            travel.setInterests(request.getInterests());
            travel.setBudget(request.getBudget());
            travel.setItineraryText(request.getItineraryText());

            if (request.getTripName() == null || request.getTripName().isEmpty()) {
                travel.setTripName(request.getDestination() + " - " + request.getDays() + " days");
            } else {
                travel.setTripName(request.getTripName());
            }

            SavedTravel saved = savedTravelRepository.save(travel);
            logger.info("Travel itinerary saved with ID: {} for user: {}", saved.getId(), userId);

            return ResponseEntity.ok(ApiResponseWrapper.success("Itinerary saved successfully", saved));
        } catch (Exception e) {
            logger.error("Failed to save itinerary: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to save itinerary: " + e.getMessage()));
        }
    }

    // 🔥 FIXED: Get saved using userId from query parameter with null check
    @GetMapping("/saved")
    public ResponseEntity<ApiResponseWrapper<List<SavedTravel>>> getSavedItineraries(
            @RequestParam(required = false) String userId) {  // Make it optional

        try {
            // 🔥 Handle null userId
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            logger.info("Fetching saved itineraries for user: {}", userId);
            List<SavedTravel> itineraries = savedTravelRepository.findByUserIdOrderBySavedAtDesc(userId);

            logger.info("Retrieved {} saved itineraries for user: {}", itineraries.size(), userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Itineraries retrieved", itineraries));
        } catch (Exception e) {
            logger.error("Failed to get saved itineraries: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get itineraries: " + e.getMessage()));
        }
    }

    @GetMapping("/saved/search")
    public ResponseEntity<ApiResponseWrapper<List<SavedTravel>>> searchSavedItineraries(
            @RequestParam(required = false) String userId,
            @RequestParam String destination) {

        try {
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            List<SavedTravel> itineraries = savedTravelRepository
                    .findByUserIdAndDestinationContainingIgnoreCase(userId, destination);

            return ResponseEntity.ok(ApiResponseWrapper.success("Search results", itineraries));
        } catch (Exception e) {
            logger.error("Failed to search itineraries: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to search: " + e.getMessage()));
        }
    }

    @GetMapping("/saved/{id}")
    public ResponseEntity<ApiResponseWrapper<SavedTravel>> getSavedItinerary(
            @PathVariable Long id,
            @RequestParam(required = false) String userId) {

        try {
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            SavedTravel itinerary = savedTravelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Itinerary not found"));

            if (!itinerary.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to view this itinerary"));
            }

            return ResponseEntity.ok(ApiResponseWrapper.success("Itinerary retrieved", itinerary));
        } catch (Exception e) {
            logger.error("Failed to get itinerary: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get itinerary: " + e.getMessage()));
        }
    }

    @DeleteMapping("/saved/{id}")
    public ResponseEntity<ApiResponseWrapper<Void>> deleteSavedItinerary(
            @PathVariable Long id,
            @RequestParam(required = false) String userId) {

        try {
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            SavedTravel itinerary = savedTravelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Itinerary not found"));

            if (!itinerary.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to delete this itinerary"));
            }

            savedTravelRepository.deleteById(id);

            logger.info("Itinerary deleted with ID: {} for user: {}", id, userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Itinerary deleted successfully", null));
        } catch (Exception e) {
            logger.error("Failed to delete itinerary: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to delete itinerary: " + e.getMessage()));
        }
    }

    @PutMapping("/saved/{id}")
    public ResponseEntity<ApiResponseWrapper<SavedTravel>> updateSavedItinerary(
            @PathVariable Long id,
            @RequestBody SaveTravelRequest request) {

        try {
            String userId = request.getUserId();
            if (userId == null || userId.trim().isEmpty()) {
                userId = "anonymous_user";
            }

            SavedTravel existing = savedTravelRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Itinerary not found"));

            if (!existing.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to update this itinerary"));
            }

            if (request.getDestination() != null) existing.setDestination(request.getDestination());
            if (request.getDays() != null) existing.setDays(request.getDays());
            if (request.getInterests() != null) existing.setInterests(request.getInterests());
            if (request.getBudget() != null) existing.setBudget(request.getBudget());
            if (request.getItineraryText() != null) existing.setItineraryText(request.getItineraryText());
            if (request.getTripName() != null) existing.setTripName(request.getTripName());

            SavedTravel updated = savedTravelRepository.save(existing);

            logger.info("Itinerary updated with ID: {} for user: {}", id, userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Itinerary updated successfully", updated));
        } catch (Exception e) {
            logger.error("Failed to update itinerary: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to update itinerary: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> itineraryFallback(String destination, Integer days,
                                               String interests, String budget, Exception e) {
        logger.warn("Fallback triggered for itinerary: {}", e.getMessage());
        return ResponseEntity.ok(ApiResponseWrapper.success(
                String.format("Quick guide for %s:\n" +
                                "Day 1: Arrival and explore main attractions\n" +
                                "Day 2: Cultural sites and local experiences\n" +
                                "Day 3: Nature and outdoor activities\n" +
                                "Day 4: Shopping and relaxation\n" +
                                "Day 5: Departure\n\n" +
                                "Please try again later for a detailed AI-generated itinerary.",
                        destination)
        ));
    }
}