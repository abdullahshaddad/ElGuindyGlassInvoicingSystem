package com.example.backend.models.enums;

/**
 * Customer Type Enum
 * Defines the three types of customers with different payment behaviors
 */
public enum CustomerType {
    /**
     * Cash Customer - Must pay full amount immediately, cannot have balance
     */
    CASH,
    
    /**
     * Regular Customer - Can pay partially or later, balance is tracked
     */
    REGULAR,
    
    /**
     * Company Customer - Business entity, can have outstanding balances like regular customers
     */
    COMPANY
}
