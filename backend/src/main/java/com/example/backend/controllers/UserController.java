package com.example.backend.controllers;

import com.example.backend.exceptions.AccessDeniedException;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.exceptions.UsernameAlreadyExistsException;
import com.example.backend.models.user.Role;
import com.example.backend.models.user.User;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    /**
     * Get all users - accessible by OWNER and ADMIN only
     */
    @GetMapping
//    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            System.out.println("Getting all users");
            List<User> users = userService.getAllUsers();
            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .toList();
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error fetching users: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch users", e.getMessage()));
        }
    }

    /**
     * Create a new user - accessible by OWNER and ADMIN
     * ADMIN cannot create OWNER accounts
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = (User) auth.getPrincipal();

            // Check if current user can create the requested role
            if (!userService.canCreateUserWithRole(currentUser, request.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Access denied", 
                            "You cannot create users with role: " + request.getRole()));
            }

            User newUser = userService.createUser(request);
            return ResponseEntity.ok(convertToDto(newUser));

        } catch (UsernameAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Username already exists", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Access denied", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating user: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create user", e.getMessage()));
        }
    }

    /**
     * Set user as inactive - accessible by OWNER and ADMIN
     * ADMIN cannot deactivate OWNER accounts
     */
    @PutMapping("/{userId}/inactive")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> setUserInactive(@PathVariable UUID userId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = (User) auth.getPrincipal();

            // Get the target user
            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

            // Check if current user can deactivate the target user
            if (!userService.canManageUser(currentUser, targetUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Access denied", 
                            "You cannot deactivate users with role: " + targetUser.getRole()));
            }

            // Prevent users from deactivating themselves
            if (currentUser.getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Invalid operation", "You cannot deactivate yourself"));
            }

            User updatedUser = userService.setUserInactive(userId);
            return ResponseEntity.ok(convertToDto(updatedUser));

        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("User not found", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Access denied", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deactivating user: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to deactivate user", e.getMessage()));
        }
    }

    /**
     * Activate user - accessible by OWNER and ADMIN
     * ADMIN cannot activate OWNER accounts
     */
    @PutMapping("/{userId}/active")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> setUserActive(@PathVariable UUID userId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = (User) auth.getPrincipal();

            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

            if (!userService.canManageUser(currentUser, targetUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Access denied", 
                            "You cannot activate users with role: " + targetUser.getRole()));
            }

            User updatedUser = userService.setUserActive(userId);
            return ResponseEntity.ok(convertToDto(updatedUser));

        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("User not found", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Access denied", e.getMessage()));
        } catch (Exception e) {
            log.error("Error activating user: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to activate user", e.getMessage()));
        }
    }

    /**
     * Update user role - OWNER only
     */
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> updateUserRole(@PathVariable UUID userId, @RequestBody UpdateUserRoleRequest request) {
        try {
            User updatedUser = userService.updateUserRole(userId, request.getRole());
            return ResponseEntity.ok(convertToDto(updatedUser));

        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("User not found", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating user role: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update user role", e.getMessage()));
        }
    }

    // Helper method to convert User entity to DTO
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .build();
    }

    // Inner classes for requests and responses
    public static class CreateUserRequest {
        private String username;
        private String firstName;
        private String lastName;
        private String password;
        private Role role;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }

    public static class UpdateUserRoleRequest {
        private Role role;
        
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }

    public static class UserDto {
        private UUID id;
        private String username;
        private String firstName;
        private String lastName;
        private Role role;
        private Boolean isActive;

        public static UserDtoBuilder builder() {
            return new UserDtoBuilder();
        }

        // Getters and setters
        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }

        // Builder class
        public static class UserDtoBuilder {
            private UUID id;
            private String username;
            private String firstName;
            private String lastName;
            private Role role;
            private Boolean isActive;

            public UserDtoBuilder id(UUID id) {
                this.id = id;
                return this;
            }

            public UserDtoBuilder username(String username) {
                this.username = username;
                return this;
            }

            public UserDtoBuilder firstName(String firstName) {
                this.firstName = firstName;
                return this;
            }

            public UserDtoBuilder lastName(String lastName) {
                this.lastName = lastName;
                return this;
            }

            public UserDtoBuilder role(Role role) {
                this.role = role;
                return this;
            }

            public UserDtoBuilder isActive(Boolean isActive) {
                this.isActive = isActive;
                return this;
            }

            public UserDto build() {
                UserDto userDto = new UserDto();
                userDto.setId(this.id);
                userDto.setUsername(this.username);
                userDto.setFirstName(this.firstName);
                userDto.setLastName(this.lastName);
                userDto.setRole(this.role);
                userDto.setIsActive(this.isActive);
                return userDto;
            }
        }
    }

    public static class ErrorResponse {
        private String error;
        private String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}