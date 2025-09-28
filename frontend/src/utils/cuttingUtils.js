// src/utils/cuttingUtils.js

/**
 * Cutting price calculation utilities
 * Based on the backend ShatfCuttingStrategy implementation
 */

// Default Shataf rates based on backend CuttingRateService initialization
const DEFAULT_SHATAF_RATES = {
    '0-3': 5.0,      // 0.0 - 3.0 mm
    '3.1-4': 7.0,    // 3.1 - 4.0 mm
    '4.1-5': 9.0,    // 4.1 - 5.0 mm
    '5.1-6': 11.0,   // 5.1 - 6.0 mm
    '6.1-8': 13.0,   // 6.1 - 8.0 mm
    '8.1-10': 15.0,  // 8.1 - 10.0 mm
    '10.1-12': 18.0, // 10.1 - 50.0 mm (backend range)
    '12+': 18.0      // Same as highest range
};

/**
 * Calculate Shataf (شطف) cutting price
 * @param {number} thickness - Glass thickness in mm
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @returns {number} Cutting price in EGP
 */
export const calculateShataf = (thickness, width, height) => {
    if (!thickness || !width || !height) return 0;

    // Convert cm to meters for perimeter calculation
    const widthM = width / 100;
    const heightM = height / 100;
    const perimeter = 2 * (widthM + heightM);

    const rate = getRateForThickness(thickness);
    return perimeter * rate;
};

/**
 * Get cutting rate based on thickness
 * @param {number} thickness - Glass thickness in mm
 * @returns {number} Rate per meter
 */
const getRateForThickness = (thickness) => {
    if (thickness <= 3.0) return DEFAULT_SHATAF_RATES['0-3'];
    if (thickness <= 4.0) return DEFAULT_SHATAF_RATES['3.1-4'];
    if (thickness <= 5.0) return DEFAULT_SHATAF_RATES['4.1-5'];
    if (thickness <= 6.0) return DEFAULT_SHATAF_RATES['5.1-6'];
    if (thickness <= 8.0) return DEFAULT_SHATAF_RATES['6.1-8'];
    if (thickness <= 10.0) return DEFAULT_SHATAF_RATES['8.1-10'];
    if (thickness <= 12.0) return DEFAULT_SHATAF_RATES['10.1-12'];
    return DEFAULT_SHATAF_RATES['12+']; // 12mm+
};

/**
 * Get cutting rate for thickness with custom rates
 * @param {number} thickness - Glass thickness in mm
 * @param {Object} customRates - Custom rates object (optional)
 * @returns {number} Rate per meter
 */
export const getRateForThicknessWithCustom = (thickness, customRates = null) => {
    const rates = customRates || DEFAULT_SHATAF_RATES;

    if (thickness <= 3.0) return rates['0-3'] || DEFAULT_SHATAF_RATES['0-3'];
    if (thickness <= 4.0) return rates['3.1-4'] || DEFAULT_SHATAF_RATES['3.1-4'];
    if (thickness <= 5.0) return rates['4.1-5'] || DEFAULT_SHATAF_RATES['4.1-5'];
    if (thickness <= 6.0) return rates['5.1-6'] || DEFAULT_SHATAF_RATES['5.1-6'];
    if (thickness <= 8.0) return rates['6.1-8'] || DEFAULT_SHATAF_RATES['6.1-8'];
    if (thickness <= 10.0) return rates['8.1-10'] || DEFAULT_SHATAF_RATES['8.1-10'];
    if (thickness <= 12.0) return rates['10.1-12'] || DEFAULT_SHATAF_RATES['10.1-12'];
    return rates['12+'] || DEFAULT_SHATAF_RATES['12+'];
};

/**
 * Calculate Shataf cutting price with custom rates
 * @param {number} thickness - Glass thickness in mm
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @param {Object} customRates - Custom rates object (optional)
 * @returns {number} Cutting price in EGP
 */
export const calculateShatafWithCustomRates = (thickness, width, height, customRates = null) => {
    if (!thickness || !width || !height) return 0;

    // Convert cm to meters for perimeter calculation
    const widthM = width / 100;
    const heightM = height / 100;
    const perimeter = 2 * (widthM + heightM);

    const rate = getRateForThicknessWithCustom(thickness, customRates);
    return perimeter * rate;
};

/**
 * Calculate perimeter in meters
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @returns {number} Perimeter in meters
 */
export const calculatePerimeter = (width, height) => {
    if (!width || !height) return 0;
    const widthM = width / 100;
    const heightM = height / 100;
    return 2 * (widthM + heightM);
};

/**
 * Calculate area in square meters
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @returns {number} Area in m²
 */
export const calculateArea = (width, height) => {
    if (!width || !height) return 0;
    return (width / 100) * (height / 100);
};

/**
 * Calculate glass price (area × price per m²)
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @param {number} pricePerMeter - Price per square meter
 * @returns {number} Glass price in EGP
 */
export const calculateGlassPrice = (width, height, pricePerMeter) => {
    if (!width || !height || !pricePerMeter) return 0;
    const area = calculateArea(width, height);
    return area * pricePerMeter;
};

/**
 * Calculate total line price (glass + cutting)
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @param {number} pricePerMeter - Glass price per m²
 * @param {string} cuttingType - 'SHATF' or 'LASER'
 * @param {number} thickness - Glass thickness for Shatf calculation
 * @param {number} [manualCuttingPrice=0] - Manual cutting price for laser
 * @param {Object} [customRates=null] - Custom Shataf rates
 * @returns {Object} Calculation breakdown
 */
export const calculateLineTotal = (width, height, pricePerMeter, cuttingType, thickness, manualCuttingPrice = 0, customRates = null) => {
    const glassPrice = calculateGlassPrice(width, height, pricePerMeter);

    let cuttingPrice = 0;
    if (cuttingType === 'SHATF') {
        cuttingPrice = calculateShatafWithCustomRates(thickness, width, height, customRates);
    } else if (cuttingType === 'LASER') {
        cuttingPrice = manualCuttingPrice;
    }

    return {
        area: calculateArea(width, height),
        perimeter: calculatePerimeter(width, height),
        glassPrice,
        cuttingPrice,
        total: glassPrice + cuttingPrice,
        cuttingRate: cuttingType === 'SHATF' ? getRateForThicknessWithCustom(thickness, customRates) : 0
    };
};

/**
 * Get thickness range for a given thickness value
 * @param {number} thickness - Glass thickness in mm
 * @returns {string} Thickness range key
 */
export const getThicknessRange = (thickness) => {
    if (thickness <= 3.0) return '0-3';
    if (thickness <= 4.0) return '3.1-4';
    if (thickness <= 5.0) return '4.1-5';
    if (thickness <= 6.0) return '5.1-6';
    if (thickness <= 8.0) return '6.1-8';
    if (thickness <= 10.0) return '8.1-10';
    if (thickness <= 12.0) return '10.1-12';
    return '12+';
};

/**
 * Format currency for display
 * @param {number} amount - Amount in EGP
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    return `${parseFloat(amount || 0).toFixed(2)} ج.م`;
};

/**
 * Format dimensions for display
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @returns {string} Formatted dimensions string
 */
export const formatDimensions = (width, height) => {
    return `${width} × ${height} سم`;
};

/**
 * Validate cutting calculation inputs
 * @param {Object} inputs - Calculation inputs
 * @returns {Object} Validation result
 */
export const validateCuttingInputs = (inputs) => {
    const { width, height, thickness, cuttingType } = inputs;
    const errors = [];

    if (!width || width <= 0) errors.push('العرض مطلوب ويجب أن يكون أكبر من صفر');
    if (!height || height <= 0) errors.push('الارتفاع مطلوب ويجب أن يكون أكبر من صفر');
    if (!thickness || thickness <= 0) errors.push('السماكة مطلوبة ويجب أن تكون أكبر من صفر');
    if (!cuttingType) errors.push('نوع القطع مطلوب');

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Export default rates for external use
export { DEFAULT_SHATAF_RATES };