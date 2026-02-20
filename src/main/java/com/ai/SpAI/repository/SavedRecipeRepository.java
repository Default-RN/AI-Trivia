package com.ai.SpAI.repository;

import com.ai.SpAI.entity.SavedRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavedRecipeRepository extends JpaRepository<SavedRecipe, Long> {
    List<SavedRecipe> findByUserIdOrderBySavedAtDesc(String userId);
    void deleteByUserIdAndId(String userId, Long id);
}