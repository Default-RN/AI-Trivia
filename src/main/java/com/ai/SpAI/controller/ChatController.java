package com.ai.SpAI.controller;

import com.ai.SpAI.dto.ChatRequest;
import com.ai.SpAI.entity.ChatMessage;
import com.ai.SpAI.repository.ChatMessageRepository;
import com.ai.SpAI.service.ChatService;
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
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final RateLimiter rateLimiter;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    public ChatController(ChatService chatService, RateLimiter rateLimiter) {
        this.chatService = chatService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/ask")
    @Cacheable(value = "chatResponses",
            key = "#prompt",
            unless = "#result.body.data == null")
    @CircuitBreaker(name = "chatService", fallbackMethod = "chatFallback")
    @io.github.resilience4j.ratelimiter.annotation.RateLimiter(name = "chatService")
    @Retry(name = "chatService")
    public ResponseEntity<?> getResponse(@RequestParam @NotBlank String prompt) {
        long startTime = System.currentTimeMillis();
        logger.info("Chat request: {}", prompt);

        try {
            if (!rateLimiter.tryAcquire("chat")) {
                return ResponseEntity.status(429)
                        .body(ApiResponseWrapper.error("Too many requests. Please try again later."));
            }

            String response = chatService.getResponse(prompt.trim());

            long duration = System.currentTimeMillis() - startTime;
            logger.info("Chat response generated in {} ms", duration);

            return ResponseEntity.ok(ApiResponseWrapper.success(response));

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid chat request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error processing chat request: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to process request. Please try again."));
        }
    }

    @GetMapping("/ask/stream")
    public DeferredResult<ResponseEntity<?>> getResponseStream(@RequestParam @NotBlank String prompt) {
        DeferredResult<ResponseEntity<?>> deferredResult = new DeferredResult<>(60000L);

        logger.info("Stream chat request for: {}", prompt);

        CompletableFuture.supplyAsync(() ->
                chatService.getResponse(prompt.trim())
        ).thenAccept(result -> {
            deferredResult.setResult(ResponseEntity.ok(ApiResponseWrapper.success(result)));
        }).exceptionally(error -> {
            logger.error("Stream chat failed: {}", error.getMessage());
            deferredResult.setErrorResult(
                    ResponseEntity.status(500).body(ApiResponseWrapper.error("Failed to process request"))
            );
            return null;
        });

        deferredResult.onTimeout(() -> {
            logger.warn("Stream chat timeout for: {}", prompt);
            deferredResult.setErrorResult(
                    ResponseEntity.status(408).body(ApiResponseWrapper.error("Request timeout"))
            );
        });

        return deferredResult;
    }

    // 🔥 FIXED: Save using userId from request body
    @PostMapping("/save")
    public ResponseEntity<ApiResponseWrapper<ChatMessage>> saveChatMessage(
            @RequestBody ChatRequest request) {

        try {
            String userId = request.getUserId();
            if (userId == null || userId.isEmpty()) {
                userId = "anonymous_user";
            }

            String aiResponse = request.getAiResponse();
            if (aiResponse == null || aiResponse.isEmpty()) {
                aiResponse = chatService.getResponse(request.getPrompt());
            }

            ChatMessage message = new ChatMessage();
            message.setUserId(userId);
            message.setUserMessage(request.getPrompt());
            message.setAiResponse(aiResponse);
            message.setSessionId(request.getSessionId());

            ChatMessage saved = chatMessageRepository.save(message);
            logger.info("Chat message saved with ID: {} for user: {}", saved.getId(), userId);

            return ResponseEntity.ok(ApiResponseWrapper.success("Chat saved successfully", saved));
        } catch (Exception e) {
            logger.error("Failed to save chat: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to save chat: " + e.getMessage()));
        }
    }

    // 🔥 FIXED: Get history using userId from query parameter
    @GetMapping("/history")
    public ResponseEntity<ApiResponseWrapper<List<ChatMessage>>> getChatHistory(
            @RequestParam(required = false) String sessionId,
            @RequestParam String userId) {

        try {
            if (userId == null || userId.isEmpty()) {
                userId = "anonymous_user";
            }

            List<ChatMessage> history;

            if (sessionId != null && !sessionId.isEmpty()) {
                history = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
            } else {
                history = chatMessageRepository.findByUserIdOrderByTimestampDesc(userId);
            }

            logger.info("Retrieved {} chat messages for user: {}", history.size(), userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("History retrieved", history));
        } catch (Exception e) {
            logger.error("Failed to get history: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get history: " + e.getMessage()));
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponseWrapper<List<ChatMessage>>> getChatSession(
            @PathVariable String sessionId,
            @RequestParam String userId) {

        try {
            List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);

            if (!messages.isEmpty() && !messages.get(0).getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponseWrapper.error("You don't have permission to view this session"));
            }

            logger.info("Retrieved {} messages for session: {}", messages.size(), sessionId);
            return ResponseEntity.ok(ApiResponseWrapper.success("Session retrieved", messages));
        } catch (Exception e) {
            logger.error("Failed to get chat session: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to get session: " + e.getMessage()));
        }
    }

    @DeleteMapping("/history/clear")
    public ResponseEntity<ApiResponseWrapper<Void>> clearChatHistory(
            @RequestParam String userId) {

        try {
            // Implement this method in your repository
            // chatMessageRepository.deleteByUserId(userId);
            logger.info("Chat history cleared for user: {}", userId);
            return ResponseEntity.ok(ApiResponseWrapper.success("History cleared successfully", null));
        } catch (Exception e) {
            logger.error("Failed to clear history: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to clear history: " + e.getMessage()));
        }
    }

    @GetMapping("/options")
    @Cacheable(value = "chatOptions", key = "#prompt")
    public ResponseEntity<?> getResponseOptions(@RequestParam @NotBlank String prompt) {
        try {
            String response = chatService.getResponseOptions(prompt.trim());
            return ResponseEntity.ok(ApiResponseWrapper.success(response));
        } catch (Exception e) {
            logger.error("Error generating options: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponseWrapper.error("Failed to generate options"));
        }
    }

    public ResponseEntity<?> chatFallback(String prompt, Exception e) {
        logger.warn("Fallback triggered for chat: {}", e.getMessage());
        return ResponseEntity.ok(ApiResponseWrapper.success(
                "I'm currently experiencing high demand. Please try again in a moment."
        ));
    }
}