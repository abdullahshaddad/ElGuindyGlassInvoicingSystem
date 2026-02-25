/**
 * Beveling Calculations Utility
 * Implements all beveling formulas for calculating beveling meters.
 * Codes match the backend calculationMethodCode schema literals.
 */

/**
 * Calculate beveling meters based on calculation type
 * @param {string} calcType - The calculation method code
 * @param {number} length - Length in meters
 * @param {number} width - Width in meters
 * @param {number|null} diameter - Diameter in meters (required for CIRCLE)
 * @returns {number} Calculated meters for beveling
 */
export const calculateBevelingMeters = (calcType, length, width, diameter = null) => {
    if (!length || length <= 0) {
        throw new Error('الطول مطلوب ويجب أن يكون أكبر من صفر');
    }
    if (!width || width <= 0) {
        throw new Error('العرض مطلوب ويجب أن يكون أكبر من صفر');
    }

    switch (calcType) {
        case 'STRAIGHT':
            return 2 * (length + width);

        case 'FRAME_HEAD':
            return (length * 2) + (width * 3);

        case '2_FRAME_HEADS':
            return (length * 2) + (width * 4);

        case 'FRAME_SIDE':
            return (length * 3) + (width * 2);

        case '2_FRAME_SIDES':
            return (length * 4) + (width * 2);

        case 'FRAME_HEAD_SIDE':
            return 3 * (length + width);

        case '2_FRAME_HEADS_SIDE':
            return (length * 3) + (width * 4);

        case '2_FRAME_SIDES_HEAD':
            return (length * 4) + (width * 3);

        case 'FULL_FRAME':
            return 4 * (length + width);

        case 'CIRCLE':
            if (!diameter || diameter <= 0) {
                throw new Error('القطر مطلوب لحساب العجلة');
            }
            return 6 * diameter;

        case 'CURVE_ARCH':
        case 'PANELS':
            // Manual types - return 0, manual meters will be used
            return 0;

        default:
            throw new Error(`نوع حساب غير معروف: ${calcType}`);
    }
};

/**
 * Get beveling formula description in Arabic
 * @param {string} calcType - The calculation method code
 * @returns {string} Formula description in Arabic
 */
export const getBevelingFormulaDescription = (calcType) => {
    const formulas = {
        'STRAIGHT': '2 × (الطول + العرض)',
        'FRAME_HEAD': '(الطول × 2) + (العرض × 3)',
        '2_FRAME_HEADS': '(الطول × 2) + (العرض × 4)',
        'FRAME_SIDE': '(الطول × 3) + (العرض × 2)',
        '2_FRAME_SIDES': '(الطول × 4) + (العرض × 2)',
        'FRAME_HEAD_SIDE': '3 × (الطول + العرض)',
        '2_FRAME_HEADS_SIDE': '(الطول × 3) + (العرض × 4)',
        '2_FRAME_SIDES_HEAD': '(الطول × 4) + (العرض × 3)',
        'FULL_FRAME': '4 × (الطول + العرض)',
        'CIRCLE': '6 × القطر',
        'CURVE_ARCH': 'إدخال يدوي',
        'PANELS': 'إدخال يدوي'
    };

    return formulas[calcType] || 'غير معروف';
};

/**
 * Calculate detailed breakdown of beveling calculation
 */
export const getBevelingCalculationBreakdown = (calcType, length, width, diameter = null) => {
    try {
        const result = calculateBevelingMeters(calcType, length, width, diameter);
        const formula = getBevelingFormulaDescription(calcType);

        let steps = [];

        switch (calcType) {
            case 'STRAIGHT':
                steps = [
                    `الطول + العرض = ${length.toFixed(2)} + ${width.toFixed(2)} = ${(length + width).toFixed(2)} م`,
                    `2 × ${(length + width).toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'FRAME_HEAD':
                steps = [
                    `الطول × 2 = ${length.toFixed(2)} × 2 = ${(length * 2).toFixed(2)}`,
                    `العرض × 3 = ${width.toFixed(2)} × 3 = ${(width * 3).toFixed(2)}`,
                    `${(length * 2).toFixed(2)} + ${(width * 3).toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'CIRCLE':
                steps = [
                    `القطر = ${diameter.toFixed(2)} م`,
                    `6 × ${diameter.toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'CURVE_ARCH':
            case 'PANELS':
                steps = ['يتم تحديد السعر يدوياً'];
                break;

            default:
                steps = [`النتيجة = ${result.toFixed(2)} متر`];
        }

        return { success: true, result, formula, steps, length, width, diameter };
    } catch (error) {
        return { success: false, error: error.message, formula: getBevelingFormulaDescription(calcType) };
    }
};

/**
 * Validate beveling calculation inputs
 */
export const validateBevelingInputs = (calcType, length, width, diameter = null) => {
    const errors = [];

    if (!calcType) errors.push('نوع الحساب مطلوب');
    if (!length || length <= 0) errors.push('الطول مطلوب ويجب أن يكون أكبر من صفر');
    if (!width || width <= 0) errors.push('العرض مطلوب ويجب أن يكون أكبر من صفر');
    if (calcType === 'CIRCLE' && (!diameter || diameter <= 0)) {
        errors.push('القطر مطلوب لحساب العجلة');
    }

    return { isValid: errors.length === 0, errors };
};
