package com.ai.SpAI.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChatService {
    private final ChatModel chatModel;

    @Value("${spring.ai.chat.model:llama3.2:1b}")
    private String defaultModel;

    @Autowired
    public ChatService(@Qualifier("ollamaChatModel") ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String getResponse(String prompt) {
        return chatModel.call(prompt);
    }

    public String getResponseOptions(String prompt) {
        ChatOptions options = ChatOptions.builder()
                .model(defaultModel)
                .build();

        ChatResponse response = chatModel.call(
                new Prompt(
                        prompt,
                        options
                ));

        return response.getResult().getOutput().getText();
    }

    public String getResponseOptions(String prompt, String modelName) {
        ChatOptions options = ChatOptions.builder()
                .model(modelName)
                .build();

        ChatResponse response = chatModel.call(
                new Prompt(
                        prompt,
                        options
                ));

        return response.getResult().getOutput().getText();
    }
}