export const invoiceUtils = {
    /**
     * Calculate line total for a single invoice line
     * @param {Object} line - Invoice line
     * @param {GlassType} glassType - Glass type data
     * @returns {number} Line total
     */
    calculateLineTotal(line, glassType) {
        if (!line.width || !line.height || !glassType) return 0;

        // Convert mm to meters and calculate area
        const widthM = line.width / 1000;
        const heightM = line.height / 1000;
        const area = widthM * heightM;

        // Glass price
        const glassPrice = area * (glassType.pricePerSquareMeter || 0);

        // Cutting price (simplified - would use actual cutting service)
        let cuttingPrice = 0;
        if (line.cuttingType === 'LASER' && line.manualCuttingPrice) {
            cuttingPrice = parseFloat(line.manualCuttingPrice);
        } else {
            // Default cutting price calculation
            const perimeter = 2 * (widthM + heightM);
            cuttingPrice = perimeter * (line.cuttingType === 'LASER' ? 50 : 20); // Example rates
        }

        return glassPrice + cuttingPrice;
    },

    /**
     * Calculate invoice totals
     * @param {Array} lines - Invoice lines
     * @param {Array} glassTypes - Available glass types
     * @returns {Object} Totals object
     */
    calculateTotals(lines, glassTypes) {
        const glassTypeMap = {};
        glassTypes.forEach(type => glassTypeMap[type.id] = type);

        let subtotal = 0;
        lines.forEach(line => {
            const glassType = glassTypeMap[line.glassTypeId];
            subtotal += this.calculateLineTotal(line, glassType);
        });

        const tax = 0; // No tax in this system
        const total = subtotal;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax,
            total: Math.round(total * 100) / 100
        };
    },

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return `${parseFloat(amount || 0).toFixed(2)} ج.م`;
    },

    /**
     * Format dimensions for display
     * @param {number} width - Width in mm
     * @param {number} height - Height in mm
     * @returns {string} Formatted dimensions
     */
    formatDimensions(width, height) {
        return `${width} × ${height} مم`;
    },

    /**
     * Calculate area in square meters
     * @param {number} width - Width in mm
     * @param {number} height - Height in mm
     * @returns {number} Area in square meters
     */
    calculateArea(width, height) {
        if (!width || !height) return 0;
        return (width * height) / 1000000; // Convert mm² to m²
    }
};