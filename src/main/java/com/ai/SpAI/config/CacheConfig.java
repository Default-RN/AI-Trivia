package com.ai.SpAI.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "itineraries",
                "chatResponses",
                "chatOptions",
                "recipes"
        );
    }

    @Scheduled(fixedRate = 3600000) // Clear cache every hour
    public void clearCache() {
        cacheManager().getCacheNames().stream()
                .forEach(name -> cacheManager().getCache(name).clear());
    }
}