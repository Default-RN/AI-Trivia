package com.ai.SpAI.repository;

import com.ai.SpAI.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByTimestampDesc(String userId);
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(String sessionId);
    void deleteByUserId(String userId);
}