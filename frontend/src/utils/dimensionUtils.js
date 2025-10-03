// frontend/src/utils/dimensionUtils.js

/**
 * Dimension unit conversion utilities
 * Backend always expects dimensions in METERS
 * Frontend displays in MILLIMETERS by default
 */

export const DIMENSION_UNITS = {
    MM: 'mm',
    CM: 'cm',
    M: 'm'
};

/**
 * Convert dimensions to meters (backend format)
 * @param {number} value - Dimension value
 * @param {string} fromUnit - Source unit ('mm', 'cm', 'm')
 * @returns {number} Value in meters
 */
export const convertToMeters = (value, fromUnit = DIMENSION_UNITS.MM) => {
    if (!value || isNaN(value)) return 0;

    const numValue = parseFloat(value);

    switch (fromUnit.toLowerCase()) {
        case DIMENSION_UNITS.MM:
            return numValue / 1000; // mm to m
        case DIMENSION_UNITS.CM:
            return numValue / 100; // cm to m
        case DIMENSION_UNITS.M:
            return numValue; // already in meters
        default:
            console.warn(`Unknown unit: ${fromUnit}, assuming mm`);
            return numValue / 1000;
    }
};

/**
 * Convert dimensions from meters to target unit
 * @param {number} value - Value in meters
 * @param {string} toUnit - Target unit ('mm', 'cm', 'm')
 * @returns {number} Value in target unit
 */
export const convertFromMeters = (value, toUnit = DIMENSION_UNITS.MM) => {
    if (!value || isNaN(value)) return 0;

    const numValue = parseFloat(value);

    switch (toUnit.toLowerCase()) {
        case DIMENSION_UNITS.MM:
            return numValue * 1000; // m to mm
        case DIMENSION_UNITS.CM:
            return numValue * 100; // m to cm
        case DIMENSION_UNITS.M:
            return numValue; // already in meters
        default:
            console.warn(`Unknown unit: ${toUnit}, assuming mm`);
            return numValue * 1000;
    }
};

/**
 * Prepare dimensions for backend API call
 * @param {Object} dimensions - Dimensions object
 * @param {number} dimensions.width - Width value
 * @param {number} dimensions.height - Height value
 * @param {string} [dimensions.unit='mm'] - Current unit of dimensions
 * @returns {Object} Dimensions in meters
 */
export const prepareDimensionsForBackend = (dimensions) => {
    const { width, height, unit = DIMENSION_UNITS.MM } = dimensions;

    return {
        width: convertToMeters(width, unit),
        height: convertToMeters(height, unit)
    };
};

/**
 * Format dimensions for display
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {string} [unit='mm'] - Unit to display
 * @returns {string} Formatted dimension string
 */
export const formatDimensions = (width, height, unit = DIMENSION_UNITS.MM) => {
    if (!width || !height) return '-';

    const unitLabel = {
        [DIMENSION_UNITS.MM]: 'مم',
        [DIMENSION_UNITS.CM]: 'سم',
        [DIMENSION_UNITS.M]: 'م'
    }[unit] || 'مم';

    return `${parseFloat(width).toFixed(2)} × ${parseFloat(height).toFixed(2)} ${unitLabel}`;
};

/**
 * Validate dimension values
 * @param {number} width - Width value
 * @param {number} height - Height value
 * @param {string} unit - Current unit
 * @returns {Object} Validation result
 */
export const validateDimensions = (width, height, unit = DIMENSION_UNITS.MM) => {
    const errors = [];

    if (!width || isNaN(width) || parseFloat(width) <= 0) {
        errors.push('العرض مطلوب ويجب أن يكون أكبر من صفر');
    }

    if (!height || isNaN(height) || parseFloat(height) <= 0) {
        errors.push('الارتفاع مطلوب ويجب أن يكون أكبر من صفر');
    }

    // Convert to meters and check maximum dimensions
    const widthM = convertToMeters(width, unit);
    const heightM = convertToMeters(height, unit);

    const MAX_WIDTH = 5; // 5 meters
    const MAX_HEIGHT = 3; // 3 meters

    if (widthM > MAX_WIDTH) {
        errors.push(`العرض يجب ألا يتجاوز ${MAX_WIDTH} متر`);
    }

    if (heightM > MAX_HEIGHT) {
        errors.push(`الارتفاع يجب ألا يتجاوز ${MAX_HEIGHT} متر`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Convert between any two units
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} Converted value
 */
export const convertBetweenUnits = (value, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return parseFloat(value);

    // Convert to meters first, then to target unit
    const inMeters = convertToMeters(value, fromUnit);
    return convertFromMeters(inMeters, toUnit);
};