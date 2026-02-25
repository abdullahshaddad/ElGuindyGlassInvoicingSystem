/**
 * Beveling Calculation Formulas
 * Codes match the backend calculationMethodCode schema literals.
 */

export const BEVELING_CALCULATIONS = {
    // Straight Edge
    STRAIGHT: {
        value: 'STRAIGHT',
        arabicName: 'عدل',
        englishName: 'Straight',
        formula: '2 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Head Frame Types
    FRAME_HEAD: {
        value: 'FRAME_HEAD',
        arabicName: 'رأس فارمة',
        englishName: 'Frame Head',
        formula: '(الطول × 2) + (العرض × 3)',
        isManual: false,
        requiresDiameter: false
    },
    '2_FRAME_HEADS': {
        value: '2_FRAME_HEADS',
        arabicName: '2 رأس فارمة',
        englishName: '2 Frame Heads',
        formula: '(الطول × 2) + (العرض × 4)',
        isManual: false,
        requiresDiameter: false
    },

    // Side Frame Types
    FRAME_SIDE: {
        value: 'FRAME_SIDE',
        arabicName: 'جنب فارمة',
        englishName: 'Frame Side',
        formula: '(الطول × 3) + (العرض × 2)',
        isManual: false,
        requiresDiameter: false
    },
    '2_FRAME_SIDES': {
        value: '2_FRAME_SIDES',
        arabicName: '2 جنب فارمة',
        englishName: '2 Frame Sides',
        formula: '(الطول × 4) + (العرض × 2)',
        isManual: false,
        requiresDiameter: false
    },

    // Combined Frame Types
    FRAME_HEAD_SIDE: {
        value: 'FRAME_HEAD_SIDE',
        arabicName: 'رأس + جنب',
        englishName: 'Frame Head + Side',
        formula: '3 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },
    '2_FRAME_HEADS_SIDE': {
        value: '2_FRAME_HEADS_SIDE',
        arabicName: '2 رأس + جنب فارمة',
        englishName: '2 Frame Heads + Side',
        formula: '(الطول × 3) + (العرض × 4)',
        isManual: false,
        requiresDiameter: false
    },
    '2_FRAME_SIDES_HEAD': {
        value: '2_FRAME_SIDES_HEAD',
        arabicName: '2 جنب + رأس فارمة',
        englishName: '2 Frame Sides + Head',
        formula: '(الطول × 4) + (العرض × 3)',
        isManual: false,
        requiresDiameter: false
    },
    FULL_FRAME: {
        value: 'FULL_FRAME',
        arabicName: 'فارمة كاملة',
        englishName: 'Full Frame',
        formula: '4 × (الطول + العرض)',
        isManual: false,
        requiresDiameter: false
    },

    // Special Types
    CIRCLE: {
        value: 'CIRCLE',
        arabicName: 'العجلة',
        englishName: 'Circle',
        formula: '6 × القطر',
        isManual: false,
        requiresDiameter: true
    },
    CURVE_ARCH: {
        value: 'CURVE_ARCH',
        arabicName: 'الدوران',
        englishName: 'Curve / Arch',
        formula: 'إدخال يدوي',
        isManual: true,
        requiresDiameter: false
    },
    PANELS: {
        value: 'PANELS',
        arabicName: 'التابلوهات',
        englishName: 'Panels',
        formula: 'إدخال يدوي',
        isManual: true,
        requiresDiameter: false
    }
};

/** Get beveling calculation info by code */
export const getBevelingCalcInfo = (calcType) => BEVELING_CALCULATIONS[calcType] || null;

/** Get all beveling calculations as array */
export const getAllBevelingCalcs = () => Object.values(BEVELING_CALCULATIONS);

/** Check if beveling calculation requires diameter */
export const bevelingCalcRequiresDiameter = (calcType) => getBevelingCalcInfo(calcType)?.requiresDiameter || false;

/** Check if beveling calculation is manual */
export const bevelingCalcIsManual = (calcType) => getBevelingCalcInfo(calcType)?.isManual || false;

/** Get beveling calculations grouped by category */
export const getBevelingCalcsByCategory = () => ({
    normal: [BEVELING_CALCULATIONS.STRAIGHT],
    head: [BEVELING_CALCULATIONS.FRAME_HEAD, BEVELING_CALCULATIONS['2_FRAME_HEADS']],
    side: [BEVELING_CALCULATIONS.FRAME_SIDE, BEVELING_CALCULATIONS['2_FRAME_SIDES']],
    combined: [
        BEVELING_CALCULATIONS.FRAME_HEAD_SIDE,
        BEVELING_CALCULATIONS['2_FRAME_HEADS_SIDE'],
        BEVELING_CALCULATIONS['2_FRAME_SIDES_HEAD'],
        BEVELING_CALCULATIONS.FULL_FRAME
    ],
    special: [BEVELING_CALCULATIONS.CIRCLE, BEVELING_CALCULATIONS.CURVE_ARCH, BEVELING_CALCULATIONS.PANELS]
});
