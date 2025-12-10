/**
 * Farma Types Constants
 * Defines all supported farma types with their Arabic names and formulas
 */

export const FARMA_TYPES = {
    // Normal Shataf
    NORMAL_SHATAF: {
        value: 'NORMAL_SHATAF',
        arabicName: 'شطف عادي',
        formula: '2 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Head Farma Types
    ONE_HEAD_FARMA: {
        value: 'ONE_HEAD_FARMA',
        arabicName: 'رأس فارمة',
        formula: '(3 × 2) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },
    TWO_HEAD_FARMA: {
        value: 'TWO_HEAD_FARMA',
        arabicName: '2 رأس فارمة',
        formula: '(4 × 2) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Side Farma Types
    ONE_SIDE_FARMA: {
        value: 'ONE_SIDE_FARMA',
        arabicName: 'جنب فارمة',
        formula: '(2 × 3) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },
    TWO_SIDE_FARMA: {
        value: 'TWO_SIDE_FARMA',
        arabicName: '2 جنب فارمة',
        formula: '(2 × 4) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Combined Farma Types
    HEAD_SIDE_FARMA: {
        value: 'HEAD_SIDE_FARMA',
        arabicName: 'رأس + جنب',
        formula: '3 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },
    TWO_HEAD_ONE_SIDE_FARMA: {
        value: 'TWO_HEAD_ONE_SIDE_FARMA',
        arabicName: '2 رأس + جنب',
        formula: '(4 × 3) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },
    TWO_SIDE_ONE_HEAD_FARMA: {
        value: 'TWO_SIDE_ONE_HEAD_FARMA',
        arabicName: '2 جنب + رأس',
        formula: '(3 × 4) + (الطول × العرض)',
        isManual: false,
        requiresDiameter: false
    },
    FULL_FARMA: {
        value: 'FULL_FARMA',
        arabicName: 'فارمة كاملة',
        formula: '4 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Special Types
    WHEEL_CUT: {
        value: 'WHEEL_CUT',
        arabicName: 'عجلة',
        formula: '6 × القطر',
        isManual: false,
        requiresDiameter: true
    },
    HAND_SHATAF: {
        value: 'HAND_SHATAF',
        arabicName: 'ليزر يدوي',
        formula: '2 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },
    ROTATION: {
        value: 'ROTATION',
        arabicName: 'دوران',
        formula: 'إدخال يدوي',
        isManual: true,
        requiresDiameter: false
    },
    TABLEAUX: {
        value: 'TABLEAUX',
        arabicName: 'تابلوهات',
        formula: 'إدخال يدوي',
        isManual: true,
        requiresDiameter: false
    }
};

/**
 * Get farma type info by value
 */
export const getFarmaTypeInfo = (farmaType) => {
    return FARMA_TYPES[farmaType] || null;
};

/**
 * Get all farma types as array
 */
export const getAllFarmaTypes = () => {
    return Object.values(FARMA_TYPES);
};

/**
 * Check if farma type requires diameter
 */
export const farmaRequiresDiameter = (farmaType) => {
    const info = getFarmaTypeInfo(farmaType);
    return info ? info.requiresDiameter : false;
};

/**
 * Check if farma type is manual
 */
export const farmaIsManual = (farmaType) => {
    const info = getFarmaTypeInfo(farmaType);
    return info ? info.isManual : false;
};

/**
 * Get farma types grouped by category
 */
export const getFarmaTypesByCategory = () => {
    return {
        normal: [FARMA_TYPES.NORMAL_SHATAF],
        head: [FARMA_TYPES.ONE_HEAD_FARMA, FARMA_TYPES.TWO_HEAD_FARMA],
        side: [FARMA_TYPES.ONE_SIDE_FARMA, FARMA_TYPES.TWO_SIDE_FARMA],
        combined: [
            FARMA_TYPES.HEAD_SIDE_FARMA,
            FARMA_TYPES.TWO_HEAD_ONE_SIDE_FARMA,
            FARMA_TYPES.TWO_SIDE_ONE_HEAD_FARMA,
            FARMA_TYPES.FULL_FARMA
        ],
        special: [FARMA_TYPES.WHEEL_CUT, FARMA_TYPES.HAND_SHATAF, FARMA_TYPES.ROTATION, FARMA_TYPES.TABLEAUX]
    };
};