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
    toMeters(value, unit = 'MM') {
        return parseFloat(value) * (this.UNITS[unit]?.toMeters || 0.001);
    },

    /**
     * Calculate line total for a single invoice line
     */
    calculateLineTotal(line, glassType) {
        if (!line.width || !line.height || !glassType) return 0;

        // **FIX 1: Determine input unit and convert to meters**
        // Assume input is in cm (clarify with your UI)
        const widthM = line.width / 100;   // cm to m
        const heightM = line.height / 100; // cm to m

        // Calculate glass price
        const area = widthM * heightM;
        const calculationMethod = glassType.calculationMethod || 'AREA';
        const quantityForPricing = calculationMethod === 'LENGTH'
            ? Math.max(widthM, heightM)
            : area;
        const glassPrice = quantityForPricing * (glassType.pricePerMeter || 0);

        // **FIX 2: Use proper cutting calculation**
        let cuttingPrice = 0;
        if (line.cuttingType === 'LASER' && line.manualCuttingPrice) {
            cuttingPrice = parseFloat(line.manualCuttingPrice);
        } else if (line.cuttingType === 'SHATF') {
            // Use cuttingUtils with correct units and thickness
            cuttingPrice = calculateShatafWithCustomRates(
                glassType.thickness,
                line.width,   // Already in cm as per cuttingUtils
                line.height,
                null  // Use default rates
            );
        }

        return glassPrice + cuttingPrice;
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

        const unit = line.dimensionUnit || 'MM';
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
        if (line.cuttingType === 'LASER' && line.manualCuttingPrice) {
            cuttingPrice = parseFloat(line.manualCuttingPrice);
        } else {
            const cuttingRate = line.cuttingType === 'LASER' ? 50 : 25;
            cuttingPrice = quantity * cuttingRate;
        }

        return {
            areaM2,
            lengthM,
            quantity,
            quantityUnit: calculationMethod === 'LENGTH' ? 'متر طولي' : 'متر مربع',
            glassPrice,
            cuttingPrice,
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
    formatDimensions(width, height, unit = 'MM') {
        const unitLabel = this.UNITS[unit]?.label || 'مم';
        return `${width} × ${height} ${unitLabel}`;
    },

    /**
     * Calculate area in square meters
     */
    calculateArea(width, height, unit = 'MM') {
        if (!width || !height) return 0;
        const widthM = this.toMeters(width, unit);
        const heightM = this.toMeters(height, unit);
        return widthM * heightM;
    }
};