package com.example.backend.domain.shared.valueobject;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * Money Value Object
 * Immutable monetary value with proper decimal precision
 * Fixes Bug #8: Floating-point precision issues
 */
@Getter
@EqualsAndHashCode
public final class Money implements Serializable, Comparable<Money> {
    private static final Currency EGP = Currency.getInstance("EGP");
    private static final int SCALE = 2; // 2 decimal places for EGP

    private final BigDecimal amount;
    private final Currency currency;

    private Money(BigDecimal amount, Currency currency) {
        Objects.requireNonNull(amount, "Amount cannot be null");
        Objects.requireNonNull(currency, "Currency cannot be null");

        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Money amount cannot be negative: " + amount);
        }

        this.amount = amount.setScale(SCALE, RoundingMode.HALF_UP);
        this.currency = currency;
    }

    // Factory methods
    public static Money of(double amount) {
        return new Money(BigDecimal.valueOf(amount), EGP);
    }

    public static Money of(BigDecimal amount) {
        return new Money(amount, EGP);
    }

    public static Money of(String amount) {
        return new Money(new BigDecimal(amount), EGP);
    }

    public static Money zero() {
        return new Money(BigDecimal.ZERO, EGP);
    }

    public static Money egp(double amount) {
        return new Money(BigDecimal.valueOf(amount), EGP);
    }

    // Arithmetic operations
    public Money add(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.add(other.amount), currency);
    }

    public Money subtract(Money other) {
        assertSameCurrency(other);
        BigDecimal result = this.amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Result would be negative: " + result);
        }
        return new Money(result, currency);
    }

    public Money multiply(BigDecimal multiplier) {
        Objects.requireNonNull(multiplier, "Multiplier cannot be null");
        return new Money(amount.multiply(multiplier), currency);
    }

    public Money multiply(double multiplier) {
        return multiply(BigDecimal.valueOf(multiplier));
    }

    public Money divide(BigDecimal divisor) {
        Objects.requireNonNull(divisor, "Divisor cannot be null");
        if (divisor.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Cannot divide by zero");
        }
        return new Money(amount.divide(divisor, SCALE, RoundingMode.HALF_UP), currency);
    }

    public Money divide(double divisor) {
        return divide(BigDecimal.valueOf(divisor));
    }

    // Comparison operations
    public boolean isGreaterThan(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) > 0;
    }

    public boolean isGreaterThanOrEqual(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) >= 0;
    }

    public boolean isLessThan(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) < 0;
    }

    public boolean isLessThanOrEqual(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) <= 0;
    }

    public boolean isZero() {
        return amount.compareTo(BigDecimal.ZERO) == 0;
    }

    public boolean isPositive() {
        return amount.compareTo(BigDecimal.ZERO) > 0;
    }

    // Currency validation
    private void assertSameCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "Cannot operate on different currencies: " + currency + " vs " + other.currency
            );
        }
    }

    // Comparable implementation
    @Override
    public int compareTo(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount);
    }

    // String representation
    @Override
    public String toString() {
        return amount.toPlainString() + " " + currency.getCurrencyCode();
    }

    // For JSON serialization compatibility
    public double toDouble() {
        return amount.doubleValue();
    }

    public BigDecimal toBigDecimal() {
        return amount;
    }
}
