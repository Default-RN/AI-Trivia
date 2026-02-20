package com.ai.SpAI.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_trips")
@Data
@NoArgsConstructor
public class SavedTravel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private Integer days;

    @Column(length = 500)
    private String interests;

    @Column
    private String budget;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String itineraryText;

    @Column
    private String tripName;

    @Column(nullable = false)
    private LocalDateTime savedAt;

    @PrePersist
    protected void onCreate() {
        savedAt = LocalDateTime.now();
    }
}