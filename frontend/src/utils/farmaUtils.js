/**
 * Farma Calculations Utility
 * Implements all farma formulas for calculating shataf meters
 */

/**
 * Calculate shataf meters based on farma type
 * @param {string} farmaType - The farma type enum value
 * @param {number} length - Length in meters
 * @param {number} width - Width in meters
 * @param {number|null} diameter - Diameter in meters (required for WHEEL_CUT)
 * @returns {number} Calculated meters for shataf
 * @throws {Error} If required parameters are missing or invalid
 */
export const calculateFarmaMeters = (farmaType, length, width, diameter = null) => {
    // Validate inputs
    if (!length || length <= 0) {
        throw new Error('الطول مطلوب ويجب أن يكون أكبر من صفر');
    }
    if (!width || width <= 0) {
        throw new Error('العرض مطلوب ويجب أن يكون أكبر من صفر');
    }

    switch (farmaType) {
        case 'NORMAL_SHATAF':
        case 'HAND_SHATAF':
            // 2 × (length + width)
            return 2 * (length + width);

        case 'ONE_HEAD_FARMA':
            // (3 × 2) + (length × width)
            return (3 * 2) + (length * width);

        case 'TWO_HEAD_FARMA':
            // (4 × 2) + (length × width)
            return (4 * 2) + (length * width);

        case 'ONE_SIDE_FARMA':
            // (2 × 3) + (length × width)
            return (2 * 3) + (length * width);

        case 'TWO_SIDE_FARMA':
            // (2 × 4) + (length × width)
            return (2 * 4) + (length * width);

        case 'HEAD_SIDE_FARMA':
            // 3 × (length + width)
            return 3 * (length + width);

        case 'TWO_HEAD_ONE_SIDE_FARMA':
            // (4 × 3) + (length × width)
            return (4 * 3) + (length * width);

        case 'TWO_SIDE_ONE_HEAD_FARMA':
            // (3 × 4) + (length × width)
            return (3 * 4) + (length * width);

        case 'FULL_FARMA':
            // 4 × (length + width)
            return 4 * (length + width);

        case 'WHEEL_CUT':
            // 6 × diameter
            if (!diameter || diameter <= 0) {
                throw new Error('القطر مطلوب لحساب العجلة');
            }
            return 6 * diameter;

        case 'ROTATION':
        case 'TABLEAUX':
            // Manual types don't have automatic calculation, return 0
            // This allows the flow to continue, and the manual price will be used
            return 0;

        default:
            throw new Error(`نوع فارمة غير معروف: ${farmaType}`);
    }
};

/**
 * Get formula description in Arabic
 * @param {string} farmaType - The farma type enum value
 * @returns {string} Formula description in Arabic
 */
export const getFarmaFormulaDescription = (farmaType) => {
    const formulas = {
        'NORMAL_SHATAF': '2 × (الطول + العرض)',
        'HAND_SHATAF': '2 × (الطول + العرض)',
        'ONE_HEAD_FARMA': '(3 × 2) + (الطول × العرض)',
        'TWO_HEAD_FARMA': '(4 × 2) + (الطول × العرض)',
        'ONE_SIDE_FARMA': '(2 × 3) + (الطول × العرض)',
        'TWO_SIDE_FARMA': '(2 × 4) + (الطول × العرض)',
        'HEAD_SIDE_FARMA': '3 × (الطول + العرض)',
        'TWO_HEAD_ONE_SIDE_FARMA': '(4 × 3) + (الطول × العرض)',
        'TWO_SIDE_ONE_HEAD_FARMA': '(3 × 4) + (الطول × العرض)',
        'FULL_FARMA': '4 × (الطول + العرض)',
        'WHEEL_CUT': '6 × القطر',
        'ROTATION': 'إدخال يدوي',
        'TABLEAUX': 'إدخال يدوي'
    };

    return formulas[farmaType] || 'غير معروف';
};

/**
 * Calculate detailed breakdown of farma calculation
 * @param {string} farmaType - The farma type enum value
 * @param {number} length - Length in meters
 * @param {number} width - Width in meters
 * @param {number|null} diameter - Diameter in meters
 * @returns {Object} Calculation breakdown with steps
 */
export const getFarmaCalculationBreakdown = (farmaType, length, width, diameter = null) => {
    try {
        const result = calculateFarmaMeters(farmaType, length, width, diameter);
        const formula = getFarmaFormulaDescription(farmaType);

        let steps = [];

        switch (farmaType) {
            case 'NORMAL_SHATAF':
            case 'HAND_SHATAF':
                steps = [
                    `الطول + العرض = ${length.toFixed(2)} + ${width.toFixed(2)} = ${(length + width).toFixed(2)} م`,
                    `2 × ${(length + width).toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'ONE_HEAD_FARMA':
                steps = [
                    `3 × 2 = 6`,
                    `الطول × العرض = ${length.toFixed(2)} × ${width.toFixed(2)} = ${(length * width).toFixed(2)}`,
                    `6 + ${(length * width).toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'WHEEL_CUT':
                steps = [
                    `القطر = ${diameter.toFixed(2)} م`,
                    `6 × ${diameter.toFixed(2)} = ${result.toFixed(2)} متر`
                ];
                break;

            case 'ROTATION':
            case 'TABLEAUX':
                steps = ['يتم تحديد السعر يدوياً'];
                break;

            // Add more detailed breakdowns as needed
            default:
                steps = [`النتيجة = ${result.toFixed(2)} متر`];
        }

        return {
            success: true,
            result,
            formula,
            steps,
            length,
            width,
            diameter
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            formula: getFarmaFormulaDescription(farmaType)
        };
    }
};

/**
 * Validate farma calculation inputs
 * @param {string} farmaType - The farma type enum value
 * @param {number} length - Length in meters
 * @param {number} width - Width in meters
 * @param {number|null} diameter - Diameter in meters
 * @returns {Object} Validation result with isValid and errors
 */
export const validateFarmaInputs = (farmaType, length, width, diameter = null) => {
    const errors = [];

    if (!farmaType) {
        errors.push('نوع الفارمة مطلوب');
    }

    if (!length || length <= 0) {
        errors.push('الطول مطلوب ويجب أن يكون أكبر من صفر');
    }

    if (!width || width <= 0) {
        errors.push('العرض مطلوب ويجب أن يكون أكبر من صفر');
    }

    if (farmaType === 'WHEEL_CUT' && (!diameter || diameter <= 0)) {
        errors.push('القطر مطلوب لحساب العجلة');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};