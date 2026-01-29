package com.example.backend.repositories;

import com.example.backend.models.customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    List<Customer> findByNameContainingIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(c.id) FROM Customer c")
    Long findMaxNumericId();
}
