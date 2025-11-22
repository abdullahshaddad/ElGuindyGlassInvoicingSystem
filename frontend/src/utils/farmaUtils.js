// src/utils/farmaUtils.js

/**
 * Farma (Frame) calculation utilities
 * Implements all farma formulas for shataf calculations
 */

/**
 * Farma types with their Arabic names and calculation methods
 */
export const FARMA_TYPES = {
    NORMAL_SHATAF: {
        value: 'NORMAL_SHATAF',
        arabicName: 'شطف عادي',
        requiresDiameter: false,
        isManual: false,
        formula: '2 × (length + width)'
    },
    ONE_HEAD_FARMA: {
        value: 'ONE_HEAD_FARMA',
        arabicName: 'فرما رأس 1',
        requiresDiameter: false,
        isManual: false,
        formula: '(3 × 2) + (length × width)'
    },
    TWO_HEAD_FARMA: {
        value: 'TWO_HEAD_FARMA',
        arabicName: 'فرما رأسين',
        requiresDiameter: false,
        isManual: false,
        formula: '(4 × 2) + (length × width)'
    },
    ONE_SIDE_FARMA: {
        value: 'ONE_SIDE_FARMA',
        arabicName: 'فرما جنب 1',
        requiresDiameter: false,
        isManual: false,
        formula: '(2 × 3) + (length × width)'
    },
    TWO_SIDE_FARMA: {
        value: 'TWO_SIDE_FARMA',
        arabicName: 'فرما جنبين',
        requiresDiameter: false,
        isManual: false,
        formula: '(2 × 4) + (length × width)'
    },
    HEAD_SIDE_FARMA: {
        value: 'HEAD_SIDE_FARMA',
        arabicName: 'فرما رأس وجنب',
        requiresDiameter: false,
        isManual: false,
        formula: '3 × (length + width)'
    },
    TWO_HEAD_ONE_SIDE_FARMA: {
        value: 'TWO_HEAD_ONE_SIDE_FARMA',
        arabicName: 'فرما رأسين وجنب',
        requiresDiameter: false,
        isManual: false,
        formula: '(4 × 3) + (length × width)'
    },
    TWO_SIDE_ONE_HEAD_FARMA: {
        value: 'TWO_SIDE_ONE_HEAD_FARMA',
        arabicName: 'فرما جنبين ورأس',
        requiresDiameter: false,
        isManual: false,
        formula: '(3 × 4) + (length × width)'
    },
    FULL_FARMA: {
        value: 'FULL_FARMA',
        arabicName: 'فرما كامل',
        requiresDiameter: false,
        isManual: false,
        formula: '4 × (length + width)'
    },
    WHEEL_CUT: {
        value: 'WHEEL_CUT',
        arabicName: 'العجلة',
        requiresDiameter: true,
        isManual: false,
        formula: '6 × diameter'
    },
    ROTATION: {
        value: 'ROTATION',
        arabicName: 'الدوران',
        requiresDiameter: false,
        isManual: true,
        formula: 'Manual input'
    },
    TABLEAUX: {
        value: 'TABLEAUX',
        arabicName: 'التابلوهات',
        requiresDiameter: false,
        isManual: true,
        formula: 'Manual input'
    }
};

/**
 * Calculate shataf meters based on farma type
 * @param {string} farmaType - Farma type key
 * @param {number} length - Length in meters
 * @param {number} width - Width in meters
 * @param {number} diameter - Diameter in meters (for WHEEL_CUT)
 * @returns {number} Calculated shataf meters
 */
export const calculateShatafMeters = (farmaType, length, width, diameter = null) => {
    if (!farmaType || !length || !width) return 0;

    const lengthM = length;
    const widthM = width;

    switch (farmaType) {
        case 'NORMAL_SHATAF':
            // 2 × (length + width)
            return 2 * (lengthM + widthM);

        case 'ONE_HEAD_FARMA':
            // (3 × 2) + (length × width)
            return (3 * 2) + (lengthM * widthM);

        case 'TWO_HEAD_FARMA':
            // (4 × 2) + (length × width)
            return (4 * 2) + (lengthM * widthM);

        case 'ONE_SIDE_FARMA':
            // (2 × 3) + (length × width)
            return (2 * 3) + (lengthM * widthM);

        case 'TWO_SIDE_FARMA':
            // (2 × 4) + (length × width)
            return (2 * 4) + (lengthM * widthM);

        case 'HEAD_SIDE_FARMA':
            // 3 × (length + width)
            return 3 * (lengthM + widthM);

        case 'TWO_HEAD_ONE_SIDE_FARMA':
            // (4 × 3) + (length × width)
            return (4 * 3) + (lengthM * widthM);

        case 'TWO_SIDE_ONE_HEAD_FARMA':
            // (3 × 4) + (length × width)
            return (3 * 4) + (lengthM * widthM);

        case 'FULL_FARMA':
            // 4 × (length + width)
            return 4 * (lengthM + widthM);

        case 'WHEEL_CUT':
            // 6 × diameter
            if (!diameter || diameter <= 0) {
                throw new Error('القطر مطلوب لحساب قطع العجلة');
            }
            return 6 * diameter;

        case 'ROTATION':
        case 'TABLEAUX':
            // Manual - no formula
            return 0;

        default:
            console.warn(`Unknown farma type: ${farmaType}`);
            return 2 * (lengthM + widthM); // Default to normal shataf
    }
};

/**
 * Get farma type info by value
 */
export const getFarmaTypeInfo = (farmaType) => {
    return FARMA_TYPES[farmaType] || FARMA_TYPES.NORMAL_SHATAF;
};

/**
 * Get all farma types as array
 */
export const getAllFarmaTypes = () => {
    return Object.values(FARMA_TYPES);
};

/**
 * Check if farma type requires diameter input
 */
export const requiresDiameter = (farmaType) => {
    const info = getFarmaTypeInfo(farmaType);
    return info.requiresDiameter;
};

/**
 * Check if farma type is manual (no formula)
 */
export const isManualFarma = (farmaType) => {
    const info = getFarmaTypeInfo(farmaType);
    return info.isManual;
};

/**
 * Format farma calculation for display
 */
export const formatFarmaCalculation = (farmaType, length, width, diameter, shatafMeters) => {
    const info = getFarmaTypeInfo(farmaType);

    if (info.isManual) {
        return 'إدخال يدوي';
    }

    if (farmaType === 'WHEEL_CUT') {
        return `6 × ${diameter?.toFixed(2)} م = ${shatafMeters?.toFixed(2)} م`;
    }

    return `${info.formula} = ${shatafMeters?.toFixed(2)} م`;
};