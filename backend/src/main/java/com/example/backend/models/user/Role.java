package com.example.backend.models.user;

import lombok.Getter;

@Getter
public enum Role {
    WORKER("عامل", 1),
    CASHIER("كاشير", 2),
    ADMIN("مدير", 3),
    OWNER("مالك", 4);

    private final String arabicName;
    private final int hierarchy;

    Role(String arabicName, int hierarchy) {
        this.arabicName = arabicName;
        this.hierarchy = hierarchy;
    }

    /**
     * Check if this role can manage (add/edit/deactivate) another role
     * @param targetRole the role to be managed
     * @return true if this role can manage the target role
     */
    public boolean canManage(Role targetRole) {
        return this.hierarchy > targetRole.hierarchy;
    }

    /**
     * Check if this role is equal to or higher than another role
     * @param other the role to compare against
     * @return true if this role is equal to or higher than the other role
     */
    public boolean isEqualOrHigherThan(Role other) {
        return this.hierarchy >= other.hierarchy;
    }

    /**
     * Check if this role is lower than another role
     * @param other the role to compare against
     * @return true if this role is lower than the other role
     */
    public boolean isLowerThan(Role other) {
        return this.hierarchy < other.hierarchy;
    }
}