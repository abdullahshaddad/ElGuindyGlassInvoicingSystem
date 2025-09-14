package com.example.backend.repositories;

import com.example.backend.models.user.User;
import com.example.backend.models.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(Role role);

    List<User> findByIsActive(Boolean isActive);

    boolean existsByUsername(String username);

    /**
     * Find users by role and active status
     */
    List<User> findByRoleAndIsActive(Role role, Boolean isActive);

    /**
     * Find all active users
     */
    List<User> findByIsActiveTrue();

    /**
     * Find all inactive users
     */
    List<User> findByIsActiveFalse();

    /**
     * Find users by role excluding specific roles
     */
    @Query("SELECT u FROM User u WHERE u.role NOT IN :excludedRoles")
    List<User> findByRoleNotIn(@Param("excludedRoles") List<Role> excludedRoles);

    /**
     * Find users by role including specific roles only
     */
    @Query("SELECT u FROM User u WHERE u.role IN :includedRoles")
    List<User> findByRoleIn(@Param("includedRoles") List<Role> includedRoles);

    /**
     * Count users by role
     */
    long countByRole(Role role);

    /**
     * Count active users by role
     */
    long countByRoleAndIsActive(Role role, Boolean isActive);

    /**
     * Find users by first name or last name containing search term (case insensitive)
     */
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> findBySearchTerm(@Param("searchTerm") String searchTerm);

    /**
     * Find users that can be managed by the given role
     * This method helps filter users based on role hierarchy
     */
    @Query("SELECT u FROM User u WHERE " +
            "(:currentRole = 'OWNER') OR " +
            "(:currentRole = 'ADMIN' AND u.role != 'OWNER')")
    List<User> findManagedUsers(@Param("currentRole") String currentRole);
}