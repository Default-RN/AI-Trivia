package com.ai.SpAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;


@SpringBootApplication
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class SpAiApplication {

	public static void main(String[] args) {

		SpringApplication.run(SpAiApplication.class, args);

	}

}
