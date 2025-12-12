package com.example.backend.domain.customer.repository;

import com.example.backend.domain.customer.model.Customer;
import com.example.backend.domain.customer.model.CustomerId;

import java.util.List;
import java.util.Optional;

/**
 * Customer Repository Port (Interface)
 * Defines what the domain needs from infrastructure
 * Implementation will be in infrastructure layer
 */
public interface CustomerRepository {

    Customer save(Customer customer);

    Optional<Customer> findById(CustomerId id);

    Optional<Customer> findByPhone(String phone);

    List<Customer> findAll();

    void delete(CustomerId id);

    boolean existsById(CustomerId id);
}
