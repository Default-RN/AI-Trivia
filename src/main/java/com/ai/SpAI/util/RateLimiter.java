package com.ai.SpAI.util;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiter {

    private final Map<String, UserRequestCount> requestCounts = new ConcurrentHashMap<>();
    private final int MAX_REQUESTS_PER_MINUTE = 10;

    public boolean tryAcquire(String userId) {
        UserRequestCount count = requestCounts.computeIfAbsent(userId,
                k -> new UserRequestCount());

        return count.incrementAndCheck();
    }

    private class UserRequestCount {
        private final AtomicInteger count = new AtomicInteger(0);
        private long windowStart = System.currentTimeMillis();

        public synchronized boolean incrementAndCheck() {
            long now = System.currentTimeMillis();

            // Reset window every minute
            if (now - windowStart > 60000) {
                count.set(0);
                windowStart = now;
            }

            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}