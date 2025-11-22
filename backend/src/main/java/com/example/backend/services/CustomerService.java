package com.example.backend.services;

import com.example.backend.models.customer.Customer;
import com.example.backend.repositories.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Autowired
    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Customer saveCustomer(Customer customer) {
        // Clean and validate phone number
        if (customer.getPhone() != null) {
            customer.setPhone(cleanPhoneNumber(customer.getPhone()));
        }
        return customerRepository.save(customer);
    }

    public Optional<Customer> findById(Long id) {
        return customerRepository.findById(id);
    }

    public Optional<Customer> findByPhone(String phone) {
        return customerRepository.findByPhone(cleanPhoneNumber(phone));
    }

    public List<Customer> findByName(String name) {
        return customerRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    public Customer findOrCreateCustomer(String name, String phone, String address) {
        if (phone != null && !phone.trim().isEmpty()) {
            Optional<Customer> existing = findByPhone(phone);
            if (existing.isPresent()) {
                Customer customer = existing.get();
                // Update customer info if provided
                if (name != null && !name.trim().isEmpty()) {
                    customer.setName(name);
                }
                if (address != null && !address.trim().isEmpty()) {
                    customer.setAddress(address);
                }
                return saveCustomer(customer);
            }
        }

        Customer newCustomer = new Customer(name, phone, address);
        return saveCustomer(newCustomer);
    }

    private String cleanPhoneNumber(String phone) {
        if (phone == null) return null;
        // Remove all non-digit characters and normalize Egyptian phone numbers
        String cleaned = phone.replaceAll("[^0-9]", "");

        // Handle Egyptian phone number formats
        if (cleaned.startsWith("2010") || cleaned.startsWith("2011") ||
                cleaned.startsWith("2012") || cleaned.startsWith("2015")) {
            return cleaned;
        } else if (cleaned.startsWith("010") || cleaned.startsWith("011") ||
                cleaned.startsWith("012") || cleaned.startsWith("015")) {
            return "2" + cleaned;
        } else if (cleaned.startsWith("20")) {
            return cleaned;
        }

        return cleaned;
    }

    public void updateCustomer(Customer customer) {
    }
}
