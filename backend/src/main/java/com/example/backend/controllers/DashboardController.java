package com.example.backend.controllers;

import com.example.backend.models.Invoice;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final InvoiceRepository invoiceRepository;
    private final CustomerService customerService;

    @Autowired
    public DashboardController(InvoiceRepository invoiceRepository, CustomerService customerService) {
        this.invoiceRepository = invoiceRepository;
        this.customerService = customerService;
    }

    /**
     * Get dashboard statistics based on user role
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER', 'WORKER')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Get current month date range
            LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfMonth = LocalDateTime.now().withDayOfMonth(
                    LocalDateTime.now().toLocalDate().lengthOfMonth()
            ).withHour(23).withMinute(59).withSecond(59);

            // Get invoices for current month
            Page<Invoice> currentMonthInvoices = invoiceRepository.findByIssueDateBetween(
                    startOfMonth, endOfMonth, PageRequest.of(0, 1000));

            List<Invoice> invoices = currentMonthInvoices.getContent();

            // Calculate total revenue
            double totalRevenue = invoices.stream()
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            // Count invoices by status
            long paidInvoices = invoices.stream()
                    .filter(inv -> InvoiceStatus.PAID.equals(inv.getStatus()))
                    .count();

            long pendingInvoices = invoices.stream()
                    .filter(inv -> InvoiceStatus.PENDING.equals(inv.getStatus()))
                    .count();

            // Calculate average order value
            double averageOrderValue = invoices.isEmpty() ? 0.0 : totalRevenue / invoices.size();

            stats.put("totalInvoices", invoices.size());
            stats.put("totalRevenue", totalRevenue);
            stats.put("paidInvoices", paidInvoices);
            stats.put("pendingInvoices", pendingInvoices);
            stats.put("averageOrderValue", averageOrderValue);
            stats.put("period", "current_month");

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            // Return empty stats on error
            stats.put("totalInvoices", 0);
            stats.put("totalRevenue", 0.0);
            stats.put("paidInvoices", 0);
            stats.put("pendingInvoices", 0);
            stats.put("averageOrderValue", 0.0);
            stats.put("error", "Failed to load statistics");

            return ResponseEntity.ok(stats);
        }
    }

    /**
     * Get revenue statistics for a date range
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<Map<String, Object>> getRevenueStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "month") String period) {

        Map<String, Object> revenueStats = new HashMap<>();

        try {
            // Set default date range if not provided
            if (startDate == null || endDate == null) {
                endDate = LocalDateTime.now();
                switch (period.toLowerCase()) {
                    case "today":
                        startDate = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
                        break;
                    case "week":
                        startDate = LocalDateTime.now().minusWeeks(1);
                        break;
                    case "year":
                        startDate = LocalDateTime.now().minusYears(1);
                        break;
                    case "month":
                    default:
                        startDate = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                        break;
                }
            }

            Page<Invoice> invoices = invoiceRepository.findByIssueDateBetween(
                    startDate, endDate, PageRequest.of(0, 10000));

            double totalRevenue = invoices.getContent().stream()
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            double paidRevenue = invoices.getContent().stream()
                    .filter(inv -> InvoiceStatus.PAID.equals(inv.getStatus()))
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            double pendingRevenue = invoices.getContent().stream()
                    .filter(inv -> InvoiceStatus.PENDING.equals(inv.getStatus()))
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            revenueStats.put("totalRevenue", totalRevenue);
            revenueStats.put("paidRevenue", paidRevenue);
            revenueStats.put("pendingRevenue", pendingRevenue);
            revenueStats.put("invoiceCount", invoices.getContent().size());
            revenueStats.put("period", period);
            revenueStats.put("startDate", startDate);
            revenueStats.put("endDate", endDate);

            return ResponseEntity.ok(revenueStats);

        } catch (Exception e) {
            revenueStats.put("error", "Failed to load revenue statistics");
            revenueStats.put("totalRevenue", 0.0);
            return ResponseEntity.ok(revenueStats);
        }
    }

    /**
     * Get recent invoices for dashboard - Returns DTOs to avoid lazy loading issues
     */
    @GetMapping("/recent-invoices")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER', 'WORKER')")
    public ResponseEntity<List<Map<String, Object>>> getRecentInvoices(
            @RequestParam(required = false, defaultValue = "5") int limit) {

        try {
            Page<Invoice> invoices = invoiceRepository.findAll(
                    PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "issueDate")));

            // Convert to DTOs to avoid lazy loading serialization issues
            List<Map<String, Object>> invoiceDTOs = invoices.getContent().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(invoiceDTOs);

        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Get top customers by revenue
     */
    @GetMapping("/top-customers")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<List<Map<String, Object>>> getTopCustomers(
            @RequestParam(required = false, defaultValue = "5") int limit,
            @RequestParam(required = false, defaultValue = "month") String period) {

        try {
            LocalDateTime startDate = getStartDateByPeriod(period);
            LocalDateTime endDate = LocalDateTime.now();

            Page<Invoice> invoices = invoiceRepository.findByIssueDateBetween(
                    startDate, endDate, PageRequest.of(0, 10000));

            // Group by customer and calculate total revenue
            Map<Long, Double> customerRevenue = new HashMap<>();
            Map<Long, String> customerNames = new HashMap<>();
            Map<Long, Long> customerInvoiceCount = new HashMap<>();

            for (Invoice invoice : invoices.getContent()) {
                if (invoice.getCustomer() != null) {
                    Long customerId = invoice.getCustomer().getId();
                    customerRevenue.merge(customerId, invoice.getTotalPrice(), Double::sum);
                    customerNames.putIfAbsent(customerId, invoice.getCustomer().getName());
                    customerInvoiceCount.merge(customerId, 1L, Long::sum);
                }
            }

            // Sort by revenue and get top customers
            List<Map<String, Object>> topCustomers = customerRevenue.entrySet().stream()
                    .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                    .limit(limit)
                    .map(entry -> {
                        Map<String, Object> customer = new HashMap<>();
                        customer.put("customerId", entry.getKey());
                        customer.put("customerName", customerNames.get(entry.getKey()));
                        customer.put("totalRevenue", entry.getValue());
                        customer.put("invoiceCount", customerInvoiceCount.get(entry.getKey()));
                        return customer;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(topCustomers);

        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Get monthly revenue for chart
     */
    @GetMapping("/monthly-revenue")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyRevenue(
            @RequestParam(required = false, defaultValue = "12") int months) {

        try {
            List<Map<String, Object>> monthlyData = new ArrayList<>();

            for (int i = months - 1; i >= 0; i--) {
                YearMonth yearMonth = YearMonth.now().minusMonths(i);
                LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
                LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59);

                Page<Invoice> invoices = invoiceRepository.findByIssueDateBetween(
                        startOfMonth, endOfMonth, PageRequest.of(0, 10000));

                double revenue = invoices.getContent().stream()
                        .filter(inv -> InvoiceStatus.PAID.equals(inv.getStatus()))
                        .map(Invoice::getTotalPrice)
                        .filter(Objects::nonNull)
                        .mapToDouble(Double::doubleValue)
                        .sum();

                Map<String, Object> monthData = new HashMap<>();
                monthData.put("month", yearMonth.getMonth().toString());
                monthData.put("year", yearMonth.getYear());
                monthData.put("revenue", revenue);
                monthData.put("invoiceCount", invoices.getContent().size());

                monthlyData.add(monthData);
            }

            return ResponseEntity.ok(monthlyData);

        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Get sales overview
     */
    @GetMapping("/sales-overview")
    @PreAuthorize("hasAnyRole('OWNER', 'CASHIER')")
    public ResponseEntity<Map<String, Object>> getSalesOverview(
            @RequestParam(required = false, defaultValue = "month") String period) {

        Map<String, Object> overview = new HashMap<>();

        try {
            LocalDateTime startDate = getStartDateByPeriod(period);
            LocalDateTime endDate = LocalDateTime.now();

            Page<Invoice> invoices = invoiceRepository.findByIssueDateBetween(
                    startDate, endDate, PageRequest.of(0, 10000));

            List<Invoice> invoiceList = invoices.getContent();

            // Calculate metrics
            double totalSales = invoiceList.stream()
                    .filter(inv -> InvoiceStatus.PAID.equals(inv.getStatus()))
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            long completedOrders = invoiceList.stream()
                    .filter(inv -> InvoiceStatus.PAID.equals(inv.getStatus()))
                    .count();

            long pendingOrders = invoiceList.stream()
                    .filter(inv -> InvoiceStatus.PENDING.equals(inv.getStatus()))
                    .count();

            // Get unique customers
            long uniqueCustomers = invoiceList.stream()
                    .map(Invoice::getCustomer)
                    .filter(Objects::nonNull)
                    .map(Customer::getId)
                    .distinct()
                    .count();

            overview.put("totalSales", totalSales);
            overview.put("completedOrders", completedOrders);
            overview.put("pendingOrders", pendingOrders);
            overview.put("uniqueCustomers", uniqueCustomers);
            overview.put("period", period);

            return ResponseEntity.ok(overview);

        } catch (Exception e) {
            overview.put("error", "Failed to load sales overview");
            return ResponseEntity.ok(overview);
        }
    }

    /**
     * Get cashier daily summary
     */
    @GetMapping("/cashier-summary")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<Map<String, Object>> getCashierSummary() {
        Map<String, Object> summary = new HashMap<>();

        try {
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);

            Page<Invoice> todayInvoices = invoiceRepository.findByIssueDateBetween(
                    startOfDay, endOfDay, PageRequest.of(0, 1000));

            double todaySales = todayInvoices.getContent().stream()
                    .map(Invoice::getTotalPrice)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();

            summary.put("todayInvoices", todayInvoices.getContent().size());
            summary.put("todaySales", todaySales);
            summary.put("customersServed", todayInvoices.getContent().stream()
                    .map(Invoice::getCustomer)
                    .filter(Objects::nonNull)
                    .map(Customer::getId)
                    .distinct()
                    .count());

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            summary.put("error", "Failed to load cashier summary");
            return ResponseEntity.ok(summary);
        }
    }

    /**
     * Convert Invoice entity to DTO to avoid lazy loading issues
     */
    private Map<String, Object> convertToDTO(Invoice invoice) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", invoice.getId());
        dto.put("totalPrice", invoice.getTotalPrice());
        dto.put("status", invoice.getStatus().toString());
        dto.put("issueDate", invoice.getIssueDate());
        dto.put("paymentDate", invoice.getPaymentDate());
        dto.put("notes", invoice.getNotes());

        // Safely handle lazy-loaded customer
        if (invoice.getCustomer() != null) {
            Map<String, Object> customerDTO = new HashMap<>();
            customerDTO.put("id", invoice.getCustomer().getId());
            customerDTO.put("name", invoice.getCustomer().getName());
            customerDTO.put("phone", invoice.getCustomer().getPhone());
            dto.put("customer", customerDTO);
        }

        return dto;
    }

    /**
     * Helper method to get start date based on period
     */
    private LocalDateTime getStartDateByPeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        switch (period.toLowerCase()) {
            case "today":
                return now.withHour(0).withMinute(0).withSecond(0);
            case "week":
                return now.minusWeeks(1);
            case "year":
                return now.minusYears(1);
            case "all":
                return LocalDateTime.of(2020, 1, 1, 0, 0);
            case "month":
            default:
                return now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        }
    }
}