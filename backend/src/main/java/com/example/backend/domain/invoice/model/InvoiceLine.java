package com.example.backend.domain.invoice.model;

import com.example.backend.domain.glass.model.GlassTypeId;
import com.example.backend.domain.shared.valueobject.Dimensions;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.ShatafType;
import lombok.Getter;

import java.util.Objects;

/**
 * InvoiceLine Domain Entity
 * Represents a single line item on an invoice
 *
 * FIX BUG #1: Dimensions are properly converted to meters via Dimensions value object
 * FIX BUG #2: ShatafType and FarmaType are now stored as part of the domain model
 * FIX BUG #4: Glass price is properly calculated via LineCalculation
 */
@Getter
public class InvoiceLine {
    private final InvoiceLineId id;
    private final GlassTypeId glassTypeId;
    private final Dimensions dimensions;        // FIX BUG #1: Value object handles conversion
    private final ShatafType shatafType;        // FIX BUG #2: Now persisted
    private final FarmaType farmaType;          // FIX BUG #2: Now persisted
    private final Double diameter;              // For wheel cut (العجلة)
    private final Money manualCuttingPrice;     // For manual shataf types
    private final LineCalculation calculation;  // FIX BUG #4: All prices calculated
    private final Integer quantity;             // Number of pieces (default 1)

    private InvoiceLine(Builder builder) {
        this.id = builder.id;
        this.glassTypeId = Objects.requireNonNull(builder.glassTypeId, "Glass type ID cannot be null");
        this.dimensions = Objects.requireNonNull(builder.dimensions, "Dimensions cannot be null");
        this.shatafType = Objects.requireNonNull(builder.shatafType, "Shataf type cannot be null");
        this.farmaType = Objects.requireNonNull(builder.farmaType, "Farma type cannot be null");
        this.diameter = builder.diameter;
        this.manualCuttingPrice = builder.manualCuttingPrice;
        this.calculation = Objects.requireNonNull(builder.calculation, "Calculation cannot be null");
        this.quantity = builder.quantity != null && builder.quantity > 0 ? builder.quantity : 1;

        validateDiameter();
    }

    // Builder pattern for complex construction
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private InvoiceLineId id;
        private GlassTypeId glassTypeId;
        private Dimensions dimensions;
        private ShatafType shatafType;
        private FarmaType farmaType;
        private Double diameter;
        private Money manualCuttingPrice;
        private LineCalculation calculation;
        private Integer quantity;

        public Builder id(InvoiceLineId id) {
            this.id = id;
            return this;
        }

        public Builder glassTypeId(GlassTypeId glassTypeId) {
            this.glassTypeId = glassTypeId;
            return this;
        }

        public Builder dimensions(Dimensions dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        public Builder shatafType(ShatafType shatafType) {
            this.shatafType = shatafType;
            return this;
        }

        public Builder farmaType(FarmaType farmaType) {
            this.farmaType = farmaType;
            return this;
        }

        public Builder diameter(Double diameter) {
            this.diameter = diameter;
            return this;
        }

        public Builder manualCuttingPrice(Money manualCuttingPrice) {
            this.manualCuttingPrice = manualCuttingPrice;
            return this;
        }

        public Builder calculation(LineCalculation calculation) {
            this.calculation = calculation;
            return this;
        }

        public Builder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public InvoiceLine build() {
            return new InvoiceLine(this);
        }
    }

    // Business methods

    /**
     * Get total price for this line (glass + cutting) × quantity
     */
    public Money getTotalPrice() {
        Money unitPrice = calculation.getTotalPrice();
        int qty = (quantity != null && quantity > 0) ? quantity : 1;
        return unitPrice.multiply(qty);
    }

    /**
     * Get unit price for this line (glass + cutting) without quantity
     */
    public Money getUnitPrice() {
        return calculation.getTotalPrice();
    }

    /**
     * Get glass price
     */
    public Money getGlassPrice() {
        return calculation.getGlassPrice();
    }

    /**
     * Get cutting price
     */
    public Money getCuttingPrice() {
        return calculation.getCuttingPrice();
    }

    // Validation

    private void validateDiameter() {
        // Wheel cut (العجلة) requires diameter
        if (farmaType == FarmaType.WHEEL_CUT && (diameter == null || diameter <= 0)) {
            throw new IllegalArgumentException("قطع العجلة يتطلب قطر صحيح");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InvoiceLine)) return false;
        InvoiceLine that = (InvoiceLine) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "InvoiceLine{" +
                "id=" + id +
                ", glassTypeId=" + glassTypeId +
                ", dimensions=" + dimensions +
                ", shatafType=" + shatafType +
                ", farmaType=" + farmaType +
                ", totalPrice=" + getTotalPrice() +
                '}';
    }
}
