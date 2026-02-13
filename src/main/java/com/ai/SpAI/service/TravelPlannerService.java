package com.ai.SpAI.service;

import com.ai.SpAI.dto.TravelPlanRequest;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class TravelPlannerService {

    private final ChatModel chatModel;

    public TravelPlannerService(@Qualifier("ollamaChatModel") ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String generateItinerary(TravelPlanRequest request) {
        String promptText = buildPrompt(request);
        Prompt prompt = new Prompt(promptText);
        return chatModel.call(prompt).getResult().getOutput().getText();
    }

    private String buildPrompt(TravelPlanRequest request) {
        return String.format("""
            You are an expert travel consultant. Create a detailed, day-by-day travel itinerary.

            Destination: %s
            Number of days: %d
            Interests: %s
            Budget: %s

            The itinerary should include:
            - Daily activities (morning, afternoon, evening)
            - Recommended local restaurants or food experiences
            - Cultural tips and hidden gems
            - Practical advice (transport, dress code, etc.)

            Write in a friendly, enthusiastic tone.
            """,
                request.destination(),
                request.days(),
                request.interests() != null ? request.interests() : "general sightseeing",
                request.budget() != null ? request.budget() : "mid-range"
        );
    }
}