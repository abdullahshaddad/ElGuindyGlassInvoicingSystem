export const invoiceUtils = {
    // Unit conversion constants
    UNITS: {
        MM: { toMeters: 0.001, label: 'مم' },
        CM: { toMeters: 0.01, label: 'سم' },
        M: { toMeters: 1.0, label: 'م' }
    },

    /**
     * Convert dimension to meters
     */
    toMeters(value, unit = 'CM') {
        return parseFloat(value) * (this.UNITS[unit]?.toMeters || 0.01);
    },

    /**
     * Calculate line total for a single invoice line
     */
    calculateLineTotal(line, glassType) {
        if (!line.width || !line.height || !glassType) return 0;

        // Uses backend-calculated total if available and authoritative
        if (line.lineTotal && line.operations) {
            return line.lineTotal;
        }

        const widthM = this.toMeters(line.width, line.dimensionUnit || 'CM');
        const heightM = this.toMeters(line.height, line.dimensionUnit || 'CM');

        // Calculate glass price
        const area = widthM * heightM;
        const calculationMethod = glassType.calculationMethod || 'AREA';
        const quantityForPricing = calculationMethod === 'LENGTH'
            ? Math.max(widthM, heightM)
            : area;
        const glassPrice = quantityForPricing * (glassType.pricePerMeter || 0);

        // Calculate operations price
        let operationsPrice = 0;
        if (line.operations && Array.isArray(line.operations)) {
            // New structure: Sum of all operations
            operationsPrice = line.operations.reduce((sum, op) => {
                return sum + (parseFloat(op.operationPrice || op.calculatedPrice || op.manualPrice || 0));
            }, 0);
        } else {
            // Legacy structure
            if (line.cuttingType === 'LASER' && line.manualCuttingPrice) {
                operationsPrice = parseFloat(line.manualCuttingPrice);
            } else if (line.cuttingType === 'SHATF') {
                // Use legacy cuttingUtils
                // NOTE: This assumes Normal Shataf logic. 
                operationsPrice = calculateShatafWithCustomRates(
                    glassType.thickness,
                    line.width,
                    line.height,
                    null
                );
            }
        }

        return glassPrice + operationsPrice;
    },
    /**
     * Calculate detailed breakdown for display
     */
    calculateLineDetails(line, glassType) {
        if (!line.width || !line.height || !glassType) {
            return {
                areaM2: 0,
                lengthM: 0,
                quantity: 0,
                glassPrice: 0,
                cuttingPrice: 0,
                lineTotal: 0
            };
        }

        const unit = line.dimensionUnit || 'CM';
        const width = parseFloat(line.width);
        const height = parseFloat(line.height);

        const widthM = this.toMeters(width, unit);
        const heightM = this.toMeters(height, unit);
        const areaM2 = widthM * heightM;
        const lengthM = Math.max(widthM, heightM);

        const calculationMethod = glassType.calculationMethod || 'AREA';
        const quantity = calculationMethod === 'LENGTH' ? lengthM : areaM2;

        const glassPricePerMeter = parseFloat(glassType.pricePerMeter || 0);
        const glassPrice = quantity * glassPricePerMeter;

        let cuttingPrice = 0;

        // Handle new multi-operation structure
        if (line.operations && Array.isArray(line.operations)) {
            cuttingPrice = line.operations.reduce((sum, op) => {
                return sum + (parseFloat(op.operationPrice || op.calculatedPrice || op.manualPrice || 0));
            }, 0);
        } else {
            // Legacy handling
            if (line.cuttingType === 'LASER' && line.manualCuttingPrice) {
                cuttingPrice = parseFloat(line.manualCuttingPrice);
            } else if (line.cuttingType === 'SHATF') {
                // Approximate for display if not calculated
                const cuttingRate = 25; // Default fallback
                cuttingPrice = quantity * cuttingRate;
            }
        }

        return {
            areaM2,
            lengthM,
            quantity,
            quantityUnit: calculationMethod === 'LENGTH' ? 'متر طولي' : 'متر مربع',
            glassPrice,
            cuttingPrice, // Represents total operations price now
            lineTotal: glassPrice + cuttingPrice
        };
    },

    /**
     * Calculate invoice totals
     */
    calculateTotals(lines, glassTypes = []) {
        let subtotal = 0;
        let glassTotal = 0;
        let cuttingTotal = 0;

        lines.forEach(line => {
            // Use backend-calculated values
            subtotal += line.lineTotal || 0;
            glassTotal += line.glassPrice || 0;
            cuttingTotal += line.cuttingPrice || 0;
        });

        return {
            glassTotal: Math.round(glassTotal * 100) / 100,
            cuttingTotal: Math.round(cuttingTotal * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: 0,
            total: Math.round(subtotal * 100) / 100,
            items: lines.length
        };
    },
    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return `${parseFloat(amount || 0).toFixed(2)} ج.م`;
    },

    /**
     * Format dimensions for display with unit
     */
    formatDimensions(width, height, unit = 'CM') {
        const unitLabel = this.UNITS[unit]?.label || 'سم';
        return `${width} × ${height} ${unitLabel}`;
    },

    /**
     * Calculate area in square meters
     */
    calculateArea(width, height, unit = 'CM') {
        if (!width || !height) return 0;
        const widthM = this.toMeters(width, unit);
        const heightM = this.toMeters(height, unit);
        return widthM * heightM;
    }
};