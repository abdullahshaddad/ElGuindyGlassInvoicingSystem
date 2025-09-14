// src/utils/cuttingUtils.js

/**
 * Cutting price calculation utilities
 * Based on the backend ShatfCuttingStrategy implementation
 */

// Default rates based on backend CuttingRateService
const DEFAULT_SHATF_RATES = {
    '0-3': 5.0,
    '3.1-4': 7.0,
    '4.1-5': 9.0,
    '5.1-6': 11.0,
    '6.1-8': 13.0,
    '8.1-10': 15.0,
    '10.1-12': 17.0,
    '12+': 10.0 // fallback
};

/**
 * Calculate Shatf (شطف) cutting price
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
    if (thickness <= 3.0) return DEFAULT_SHATF_RATES['0-3'];
    if (thickness <= 4.0) return DEFAULT_SHATF_RATES['3.1-4'];
    if (thickness <= 5.0) return DEFAULT_SHATF_RATES['4.1-5'];
    if (thickness <= 6.0) return DEFAULT_SHATF_RATES['5.1-6'];
    if (thickness <= 8.0) return DEFAULT_SHATF_RATES['6.1-8'];
    if (thickness <= 10.0) return DEFAULT_SHATF_RATES['8.1-10'];
    if (thickness <= 12.0) return DEFAULT_SHATF_RATES['10.1-12'];
    return DEFAULT_SHATF_RATES['12+']; // 12mm+
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
 * @returns {Object} Calculation breakdown
 */
export const calculateLineTotal = (width, height, pricePerMeter, cuttingType, thickness, manualCuttingPrice = 0) => {
    const glassPrice = calculateGlassPrice(width, height, pricePerMeter);

    let cuttingPrice = 0;
    if (cuttingType === 'SHATF') {
        cuttingPrice = calculateShataf(thickness, width, height);
    } else if (cuttingType === 'LASER') {
        cuttingPrice = manualCuttingPrice;
    }

    return {
        area: calculateArea(width, height),
        glassPrice,
        cuttingPrice,
        total: glassPrice + cuttingPrice
    };
};