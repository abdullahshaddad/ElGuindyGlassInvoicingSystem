package com.example.backend.dto;

import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.CustomerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Customer responses - Enhanced with customer type and balance
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private CustomerType customerType;
    private Double balance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Statistics (optional)
    private Long totalInvoices;
    private Double totalRevenue;
    private Double totalPaid;
    
    /**
     * Convert Customer entity to DTO
     */
    public static CustomerDTO from(Customer customer) {
        if (customer == null) {
            return null;
        }
        
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .customerType(customer.getCustomerType())
                .balance(customer.getBalance())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
    
    /**
     * Convert Customer entity to DTO with statistics
     */
    public static CustomerDTO fromWithStats(Customer customer, Long totalInvoices, 
                                           Double totalRevenue, Double totalPaid) {
        CustomerDTO dto = from(customer);
        if (dto != null) {
            dto.setTotalInvoices(totalInvoices);
            dto.setTotalRevenue(totalRevenue);
            dto.setTotalPaid(totalPaid);
        }
        return dto;
    }
}

/**
 * Request DTO for creating a new customer
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class CreateCustomerRequest {
    private String name;
    private String phone;
    private String address;
    private CustomerType customerType = CustomerType.REGULAR;
}

/**
 * Request DTO for updating customer information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateCustomerRequest {
    private String name;
    private String phone;
    private String address;
    private CustomerType customerType;
}
