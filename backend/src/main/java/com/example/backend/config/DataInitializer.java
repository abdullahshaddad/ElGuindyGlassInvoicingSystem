package com.example.backend.config;

import com.example.backend.authentication.AuthenticationService;
import com.example.backend.authentication.RegisterRequest;
import com.example.backend.models.user.Role;

import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner, CommandLineRunner {


    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting application data initialization...");
    // Re-enable this for existing equipment types

        log.info("Application data initialization completed successfully.");
    }

    @Override
    public void run(String... args) {
        // Check if admin user exists
        if (!userRepository.existsByUsername("owner")) {
            // Create admin user
            RegisterRequest adminRequest = RegisterRequest.builder()
                    .firstName("Owner")
                    .lastName("User")
                    .username("owner")
                    .password("admin123") // You should change this password after first login
                    .role(Role.OWNER)
                    .build();

            authenticationService.register(adminRequest);
            System.out.println("Admin user created successfully");
        }
    }


}