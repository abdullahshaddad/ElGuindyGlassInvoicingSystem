// src/constants/shatafTypes.js

/**
 * Shataf (Cutting) Types Constants
 * Defines all supported shataf types with their properties
 */

/**
 * Shataf type categories
 */
export const SHATAF_CATEGORIES = {
    FORMULA_BASED: 'formula_based',  // Depends on thickness
    MANUAL_INPUT: 'manual_input',    // Manual price input
    AREA_BASED: 'area_based'         // Based on area calculation
};

/**
 * All shataf types with their metadata
 */
export const SHATAF_TYPES = {
    // Formula-based types (depend on thickness)
    KHARAZAN: {
        value: 'KHARAZAN',
        arabicName: 'خرازان',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },
    SHAMBORLEH: {
        value: 'SHAMBORLEH',
        arabicName: 'شمبورليه',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },
    ONE_CM: {
        value: 'ONE_CM',
        arabicName: '1 سم',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },
    TWO_CM: {
        value: 'TWO_CM',
        arabicName: '2 سم',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },
    THREE_CM: {
        value: 'THREE_CM',
        arabicName: '3 سم',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },
    JULIA: {
        value: 'JULIA',
        arabicName: 'جوليا',
        category: SHATAF_CATEGORIES.FORMULA_BASED,
        requiresThicknessRate: true,
        requiresManualPrice: false,
        requiresFarma: true,  // ✅ ADDED
        usesAreaCalculation: false
    },

    // Manual input types removed (Laser is separate op, Rotation/Tableaux are Farma types)

    // Area-based type
    SANDING: {
        value: 'SANDING',
        arabicName: 'صنفرة',
        category: SHATAF_CATEGORIES.AREA_BASED,
        requiresThicknessRate: true,  // Rate per square meter
        requiresManualPrice: false,
        requiresFarma: false,  // ✅ ADDED - Sanding doesn't require farma
        usesAreaCalculation: true
    },

    // Manual Types
    LASER: {
        value: 'LASER',
        arabicName: 'ليزر (يدوي)',
        category: SHATAF_CATEGORIES.MANUAL_INPUT,
        requiresThicknessRate: false,
        requiresManualPrice: true,
        requiresFarma: false,
        usesAreaCalculation: false
    },
    ROTATION: {
        value: 'ROTATION',
        arabicName: 'دوران (يدوي)',
        category: SHATAF_CATEGORIES.MANUAL_INPUT,
        requiresThicknessRate: false,
        requiresManualPrice: true,
        requiresFarma: false,
        usesAreaCalculation: false
    },
    TABLEAUX: {
        value: 'TABLEAUX',
        arabicName: 'تابلوهات (يدوي)',
        category: SHATAF_CATEGORIES.MANUAL_INPUT,
        requiresThicknessRate: false,
        requiresManualPrice: true,
        requiresFarma: false,
        usesAreaCalculation: false
    }
};

/**
 * Get shataf type info by value
 */
export const getShatafTypeInfo = (shatafType) => {
    return SHATAF_TYPES[shatafType] || null;
};

/**
 * Get all shataf types as array
 */
export const getAllShatafTypes = () => {
    return Object.values(SHATAF_TYPES);
};

/**
 * Get shataf types by category
 */
export const getShatafTypesByCategory = (category) => {
    return Object.values(SHATAF_TYPES).filter(type => type.category === category);
};

/**
 * Get formula-based shataf types
 */
export const getFormulaBasedTypes = () => {
    return getShatafTypesByCategory(SHATAF_CATEGORIES.FORMULA_BASED);
};

/**
 * Get manual input shataf types
 */
export const getManualInputTypes = () => {
    return getShatafTypesByCategory(SHATAF_CATEGORIES.MANUAL_INPUT);
};

/**
 * Get area-based shataf types
 */
export const getAreaBasedTypes = () => {
    return getShatafTypesByCategory(SHATAF_CATEGORIES.AREA_BASED);
};

/**
 * Check if shataf type requires manual price input
 */
export const requiresManualPrice = (shatafType) => {
    const info = getShatafTypeInfo(shatafType);
    return info?.requiresManualPrice || false;
};

/**
 * Check if shataf type uses formula-based calculation
 */
export const isFormulaBased = (shatafType) => {
    const info = getShatafTypeInfo(shatafType);
    return info?.category === SHATAF_CATEGORIES.FORMULA_BASED;
};

/**
 * Check if shataf type uses area-based calculation
 */
export const isAreaBased = (shatafType) => {
    const info = getShatafTypeInfo(shatafType);
    return info?.category === SHATAF_CATEGORIES.AREA_BASED;
};

/**
 * Check if shataf type requires thickness rate
 */
export const requiresThicknessRate = (shatafType) => {
    const info = getShatafTypeInfo(shatafType);
    return info?.requiresThicknessRate || false;
};

/**
 * Get display label for shataf type
 */
export const getShatafTypeLabel = (shatafType) => {
    const info = getShatafTypeInfo(shatafType);
    return info?.arabicName || shatafType;
};