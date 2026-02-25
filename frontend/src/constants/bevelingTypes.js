// src/constants/bevelingTypes.js

/**
 * Beveling (Cutting) Types Constants
 * Codes match the backend operationTypeCode schema literals.
 */

export const BEVELING_CATEGORIES = {
    FORMULA_BASED: 'formula_based',  // Depends on thickness + calculation method
    MANUAL_INPUT: 'manual_input',    // Manual price input
    AREA_BASED: 'area_based'         // Based on area calculation
};

/**
 * All beveling / operation types with their metadata.
 * Keys and `value` fields must match the Convex operationTypeCode union.
 */
export const BEVELING_TYPES = {
    // Formula-based types (depend on thickness)
    KHARZAN: {
        value: 'KHARZAN',
        arabicName: 'خرازان',
        englishName: 'Kharzan',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },
    CHAMBOURLIEH: {
        value: 'CHAMBOURLIEH',
        arabicName: 'شمبورليه',
        englishName: 'Chambourlieh',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },
    BEVEL_1_CM: {
        value: 'BEVEL_1_CM',
        arabicName: '1 سم',
        englishName: '1cm Bevel',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },
    BEVEL_2_CM: {
        value: 'BEVEL_2_CM',
        arabicName: '2 سم',
        englishName: '2cm Bevel',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },
    BEVEL_3_CM: {
        value: 'BEVEL_3_CM',
        arabicName: '3 سم',
        englishName: '3cm Bevel',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },
    JULIA: {
        value: 'JULIA',
        arabicName: 'جوليا',
        englishName: 'Julia',
        category: BEVELING_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: true,
        usesAreaCalculation: false
    },

    // Area-based type
    SANDING: {
        value: 'SANDING',
        arabicName: 'صنفرة (بالمتر المربع)',
        englishName: 'Sanding',
        category: BEVELING_CATEGORIES.AREA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresCalculation: false,
        usesAreaCalculation: true
    },

    // Manual Types
    LASER: {
        value: 'LASER',
        arabicName: 'ليزر (إدخال يدوي)',
        englishName: 'Laser',
        category: BEVELING_CATEGORIES.MANUAL_INPUT,
        requiresThicknessRate: false,
        requiresManualPrice: true,
        requiresCalculation: false,
        usesAreaCalculation: false
    }
};

/** Get beveling type info by code */
export const getBevelingTypeInfo = (type) => BEVELING_TYPES[type] || null;

/** Get all beveling types as array */
export const getAllBevelingTypes = () => Object.values(BEVELING_TYPES);

/** Get beveling types by category */
export const getBevelingTypesByCategory = (category) =>
    Object.values(BEVELING_TYPES).filter(t => t.category === category);

export const getFormulaBasedTypes = () => getBevelingTypesByCategory(BEVELING_CATEGORIES.FORMULA_BASED);
export const getManualInputTypes = () => getBevelingTypesByCategory(BEVELING_CATEGORIES.MANUAL_INPUT);
export const getAreaBasedTypes = () => getBevelingTypesByCategory(BEVELING_CATEGORIES.AREA_BASED);

export const requiresManualPrice = (type) => getBevelingTypeInfo(type)?.requiresManualPrice || false;
export const isFormulaBased = (type) => getBevelingTypeInfo(type)?.category === BEVELING_CATEGORIES.FORMULA_BASED;
export const isAreaBased = (type) => getBevelingTypeInfo(type)?.category === BEVELING_CATEGORIES.AREA_BASED;
export const requiresThicknessRate = (type) => getBevelingTypeInfo(type)?.requiresThicknessRate || false;

export const getBevelingTypeLabel = (type) => getBevelingTypeInfo(type)?.arabicName || type;
