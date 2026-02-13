package com.ai.SpAI.service;

import com.ai.SpAI.dto.AuthResponse;
import com.ai.SpAI.dto.LoginRequest;
import com.ai.SpAI.dto.RegisterRequest;
import com.ai.SpAI.entity.User;
import com.ai.SpAI.repository.UserRepository;
import com.ai.SpAI.security.JWTUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;

    public AuthService(UserRepository userRepository, JWTUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public AuthResponse register(RegisterRequest request) {
        try {
            // Check if username exists
            if (userRepository.existsByUsername(request.getUsername())) {
                return new AuthResponse("Username already taken!", false);
            }

            // Check if email exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse("Email already registered!", false);
            }

            // Create new user
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName());

            userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getUsername());

            return new AuthResponse(
                    "Registration successful!",
                    true,
                    token,
                    user.getUsername(),
                    user.getEmail()
            );
        } catch (Exception e) {
            e.printStackTrace();
            return new AuthResponse("Registration failed: " + e.getMessage(), false);
        }
    }

    public AuthResponse login(LoginRequest request) {
        try {
            // Find user by username or email
            User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail())
                    .orElse(null);

            if (user == null) {
                return new AuthResponse("Invalid username/email or password!", false);
            }

            // Check password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return new AuthResponse("Invalid username/email or password!", false);
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getUsername());

            return new AuthResponse(
                    "Login successful!",
                    true,
                    token,
                    user.getUsername(),
                    user.getEmail()
            );
        } catch (Exception e) {
            e.printStackTrace();
            return new AuthResponse("Login failed: " + e.getMessage(), false);
        }
    }
}