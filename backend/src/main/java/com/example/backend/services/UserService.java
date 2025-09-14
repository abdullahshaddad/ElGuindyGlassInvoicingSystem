package com.example.backend.services;

import com.example.backend.controllers.UserController.CreateUserRequest;
import com.example.backend.exceptions.AccessDeniedException;
import com.example.backend.exceptions.UserNotFoundException;
import com.example.backend.exceptions.UsernameAlreadyExistsException;
import com.example.backend.models.user.Role;
import com.example.backend.models.user.User;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all users - filters based on caller's role
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Create a new user with role validation
     */
    public User createUser(CreateUserRequest request) {
        try {
            // Check if username already exists
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new UsernameAlreadyExistsException("Username already exists: " + request.getUsername());
            }

            User newUser = User.builder()
                    .username(request.getUsername())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(request.getRole())
                    .isActive(true)
                    .build();

            return userRepository.save(newUser);

        } catch (DataIntegrityViolationException e) {
            if (e.getMessage().contains("username") || e.getMessage().contains("unique")) {
                throw new UsernameAlreadyExistsException("Username already exists: " + request.getUsername());
            }
            throw e;
        }
    }

    /**
     * Set user as inactive
     */
    public User setUserInactive(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        user.setIsActive(false);
        return userRepository.save(user);
    }

    /**
     * Set user as active
     */
    public User setUserActive(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        user.setIsActive(true);
        return userRepository.save(user);
    }

    /**
     * Update user role - OWNER only operation
     */
    public User updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        
        user.setRole(newRole);
        return userRepository.save(user);
    }

    /**
     * Check if current user can create a user with the specified role
     */
    public boolean canCreateUserWithRole(User currentUser, Role targetRole) {
        Role currentRole = currentUser.getRole();
        
        switch (currentRole) {
            case OWNER:
                // OWNER can create any role
                return true;
            case ADMIN:
                // ADMIN can create ADMIN, CASHIER, WORKER but not OWNER
                return targetRole != Role.OWNER;
            default:
                // CASHIER and WORKER cannot create users
                return false;
        }
    }

    /**
     * Check if current user can manage (edit/deactivate) target user
     */
    public boolean canManageUser(User currentUser, User targetUser) {
        Role currentRole = currentUser.getRole();
        Role targetRole = targetUser.getRole();
        
        switch (currentRole) {
            case OWNER:
                // OWNER can manage any user
                return true;
            case ADMIN:
                // ADMIN can manage ADMIN, CASHIER, WORKER but not OWNER
                return targetRole != Role.OWNER;
            default:
                // CASHIER and WORKER cannot manage users
                return false;
        }
    }

    /**
     * Check if a role can access system settings
     */
    public boolean canAccessSystemSettings(Role role) {
        return role == Role.OWNER;
    }

    /**
     * Check if a role can access user management
     */
    public boolean canAccessUserManagement(Role role) {
        return role == Role.OWNER || role == Role.ADMIN;
    }

    /**
     * Get users that the current user can manage
     */
    public List<User> getUsersManagedBy(User currentUser) {
        Role currentRole = currentUser.getRole();
        
        switch (currentRole) {
            case OWNER:
                // OWNER can see all users
                return userRepository.findAll();
            case ADMIN:
                // ADMIN can see all users except other OWNER users
                return userRepository.findAll().stream()
                        .filter(user -> user.getRole() != Role.OWNER)
                        .toList();
            default:
                // CASHIER and WORKER cannot manage users
                return List.of();
        }
    }

    /**
     * Get available roles that the current user can assign
     */
    public List<Role> getAssignableRoles(Role currentRole) {
        switch (currentRole) {
            case OWNER:
                return List.of(Role.OWNER, Role.ADMIN, Role.CASHIER, Role.WORKER);
            case ADMIN:
                return List.of(Role.ADMIN, Role.CASHIER, Role.WORKER);
            default:
                return List.of();
        }
    }

    /**
     * Validate role hierarchy rules
     */
    public void validateRoleHierarchy(Role currentRole, Role targetRole, String operation) {
        if (!canOperateOnRole(currentRole, targetRole, operation)) {
            throw new AccessDeniedException(
                String.format("Role %s cannot %s users with role %s", 
                    currentRole, operation, targetRole)
            );
        }
    }

    private boolean canOperateOnRole(Role currentRole, Role targetRole, String operation) {
        switch (operation.toLowerCase()) {
            case "create":
            case "edit":
            case "deactivate":
                return canManageRole(currentRole, targetRole);
            case "view":
                return canViewRole(currentRole, targetRole);
            default:
                return false;
        }
    }

    private boolean canManageRole(Role currentRole, Role targetRole) {
        return currentRole.canManage(targetRole);
    }

    private boolean canViewRole(Role currentRole, Role targetRole) {
        switch (currentRole) {
            case OWNER:
                return true; // OWNER can view all roles
            case ADMIN:
                return targetRole != Role.OWNER; // ADMIN cannot view OWNER
            default:
                return false; // Others cannot view user roles
        }
    }
}