package com.ai.SpAI.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_recipes")
@Data
@NoArgsConstructor
public class SavedRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recipeText;

    @Column(nullable = false)
    private String ingredients;

    @Column
    private String cuisine;

    @Column
    private String dietaryRestrictions;

    @Column(nullable = false)
    private LocalDateTime savedAt;

    @Column
    private String recipeName; // Optional: extract from recipe or let user name it

    @PrePersist
    protected void onCreate() {
        savedAt = LocalDateTime.now();
    }
}