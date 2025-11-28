package com.example.backend.application.dto;

import com.example.backend.models.enums.CustomerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command to update customer details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerCommand {
    private Long customerId;
    private String name;
    private String phone;
    private String address;
    private CustomerType customerType;
}
