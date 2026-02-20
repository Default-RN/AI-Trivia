package com.ai.SpAI.repository;

import com.ai.SpAI.entity.SavedTravel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavedTravelRepository extends JpaRepository<SavedTravel, Long> {
    List<SavedTravel> findByUserIdOrderBySavedAtDesc(String userId);
    List<SavedTravel> findByUserIdAndDestinationContainingIgnoreCase(String userId, String destination);
    void deleteByUserIdAndId(String userId, Long id);
}