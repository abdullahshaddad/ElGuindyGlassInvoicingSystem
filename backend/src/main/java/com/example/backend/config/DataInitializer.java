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
        // Add any additional data initialization logic here
        log.info("Application data initialization completed successfully.");
    }

    @Override
    public void run(String... args) {
        initializeDefaultUsers();
    }

    private void initializeDefaultUsers() {
        // Create default OWNER user if it doesn't exist
        if (!userRepository.existsByUsername("owner")) {
            RegisterRequest ownerRequest = RegisterRequest.builder()
                    .firstName("System")
                    .lastName("Owner")
                    .username("owner")
                    .password("owner123") // Change this password after first login
                    .role(Role.OWNER)
                    .build();

            try {
                authenticationService.register(ownerRequest);
                log.info("Default OWNER user created successfully with username: 'owner'");
            } catch (Exception e) {
                log.error("Failed to create default OWNER user: {}", e.getMessage());
            }
        }

        // Create default ADMIN user if it doesn't exist
        if (!userRepository.existsByUsername("admin")) {
            RegisterRequest adminRequest = RegisterRequest.builder()
                    .firstName("System")
                    .lastName("Admin")
                    .username("admin")
                    .password("admin123") // Change this password after first login
                    .role(Role.ADMIN)
                    .build();

            try {
                authenticationService.register(adminRequest);
                log.info("Default ADMIN user created successfully with username: 'admin'");
            } catch (Exception e) {
                log.error("Failed to create default ADMIN user: {}", e.getMessage());
            }
        }

        // Create default CASHIER user if it doesn't exist
        if (!userRepository.existsByUsername("cashier")) {
            RegisterRequest cashierRequest = RegisterRequest.builder()
                    .firstName("Demo")
                    .lastName("Cashier")
                    .username("cashier")
                    .password("cashier123") // Change this password after first login
                    .role(Role.CASHIER)
                    .build();

            try {
                authenticationService.register(cashierRequest);
                log.info("Default CASHIER user created successfully with username: 'cashier'");
            } catch (Exception e) {
                log.error("Failed to create default CASHIER user: {}", e.getMessage());
            }
        }

        // Create default WORKER user if it doesn't exist
        if (!userRepository.existsByUsername("worker")) {
            RegisterRequest workerRequest = RegisterRequest.builder()
                    .firstName("Demo")
                    .lastName("Worker")
                    .username("worker")
                    .password("worker123") // Change this password after first login
                    .role(Role.WORKER)
                    .build();

            try {
                authenticationService.register(workerRequest);
                log.info("Default WORKER user created successfully with username: 'worker'");
            } catch (Exception e) {
                log.error("Failed to create default WORKER user: {}", e.getMessage());
            }
        }

        log.info("User initialization completed. Default users created if they didn't exist.");
        log.info("IMPORTANT: Please change default passwords after first login for security!");
    }
}