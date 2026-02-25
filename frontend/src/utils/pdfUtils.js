// src/utils/pdfUtils.js
// Arabic text preparation and font loading utilities for pdf-lib

import _reshaper from 'arabic-reshaper';
import _fontkit from '@pdf-lib/fontkit';

// Resolve ESM/CJS interop (Vite wraps CJS default exports)
export const fontkit = _fontkit?.default || _fontkit;
const convertArabic = _reshaper?.convertArabic || _reshaper?.default?.convertArabic || _reshaper;

// ============================================================
// Font cache
// ============================================================
let _fontCache = null;

export async function loadFonts() {
    if (_fontCache) return _fontCache;

    const [regularRes, boldRes] = await Promise.all([
        fetch('/fonts/Amiri-Regular.ttf'),
        fetch('/fonts/Amiri-Bold.ttf'),
    ]);

    if (!regularRes.ok || !boldRes.ok) {
        throw new Error('Failed to load Arabic font files');
    }

    _fontCache = {
        regular: await regularRes.arrayBuffer(),
        bold: await boldRes.arrayBuffer(),
    };
    return _fontCache;
}

// ============================================================
// Character detection
// ============================================================

function isArabicChar(ch) {
    const c = ch.codePointAt(0);
    // Exclude Eastern Arabic digits so they can be parsed as numbers (L run)
    if (c >= 0x0660 && c <= 0x0669) return false;
    if (c >= 0x06F0 && c <= 0x06F9) return false;

    return (
        (c >= 0x0600 && c <= 0x06FF) ||   // Arabic
        (c >= 0x0750 && c <= 0x077F) ||   // Arabic Supplement
        (c >= 0xFB50 && c <= 0xFDFF) ||   // Arabic Presentation Forms-A
        (c >= 0xFE70 && c <= 0xFEFF) ||   // Arabic Presentation Forms-B
        (c >= 0xE000 && c <= 0xE00F)      // PUA placeholders
    );
}

function hasArabic(text) {
    for (const ch of text) {
        if (isArabicChar(ch)) return true;
    }
    return false;
}

function isLatinChar(ch) {
    return /[a-zA-Z]/.test(ch);
}

function isDigit(ch) {
    // Include Western and Eastern Arabic numerals
    return /[0-9\u0660-\u0669\u06F0-\u06F9]/.test(ch);
}

function isNumberPart(ch) {
    return /[0-9\u0660-\u0669\u06F0-\u06F9.,\u066B\u066C]/.test(ch);
}

// ============================================================
// Arabic abbreviation protection
// ============================================================

const ARABIC_ABBREVS = {
    'ج.م': '\uE000',
    'م.ط': '\uE001',
    'س.ض': '\uE002',
    'م²': '\uE003',
};
const ABBREV_RESTORE = Object.fromEntries(
    Object.entries(ARABIC_ABBREVS).map(([k, v]) => [v, k])
);

function protectAbbreviations(text) {
    let result = text;
    for (const [abbr, placeholder] of Object.entries(ARABIC_ABBREVS)) {
        result = result.replaceAll(abbr, placeholder);
    }
    return result;
}

function restoreAbbreviations(text) {
    let result = text;
    for (const [placeholder, abbr] of Object.entries(ABBREV_RESTORE)) {
        result = result.replaceAll(placeholder, abbr);
    }
    return result;
}

const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u061C\uFEFF\u00AD\u202A-\u202E\u2060-\u2069]/g;

function stripInvisible(text) {
    return text.replace(INVISIBLE_RE, '');
}

// ============================================================
// Token-based BiDi processing
// ============================================================

const MIRROR_MAP = {
    '(': ')', ')': '(',
    '[': ']', ']': '[',
    '{': '}', '}': '{',
    '<': '>', '>': '<'
};

function mirrorBrackets(text) {
    return text.split('').map(c => MIRROR_MAP[c] || c).join('');
}

function tokenize(text) {
    const tokens = [];
    const chars = [...text];
    let i = 0;

    while (i < chars.length) {
        const ch = chars[i];

        if (isArabicChar(ch)) {
            let seg = '';
            while (i < chars.length && (isArabicChar(chars[i]) || (chars[i] === ' ' && i + 1 < chars.length && isArabicChar(chars[i + 1])))) {
                seg += chars[i];
                i++;
            }
            tokens.push({ type: 'R', text: seg });
        } else if (isLatinChar(ch) || isDigit(ch)) {
            let seg = '';
            while (i < chars.length && (isLatinChar(chars[i]) || isDigit(chars[i]) || isNumberPart(chars[i]) || (chars[i] === ' ' && i + 1 < chars.length && (isLatinChar(chars[i + 1]) || isDigit(chars[i + 1]))))) {
                if ((chars[i] === '.' || chars[i] === ',') && i + 1 < chars.length && isArabicChar(chars[i + 1])) {
                    break;
                }
                seg += chars[i];
                i++;
            }
            while (seg.length > 0 && /[,.]$/.test(seg)) {
                i--;
                seg = seg.slice(0, -1);
            }
            tokens.push({ type: 'L', text: seg });
        } else {
            tokens.push({ type: 'N', text: ch });
            i++;
        }
    }
    return tokens;
}

function resolveNeutrals(tokens) {
    return tokens.map((token, i) => {
        if (token.type !== 'N') return token;
        let leftType = 'R';
        for (let j = i - 1; j >= 0; j--) { if (tokens[j].type !== 'N') { leftType = tokens[j].type; break; } }
        let rightType = 'R';
        for (let j = i + 1; j < tokens.length; j++) { if (tokens[j].type !== 'N') { rightType = tokens[j].type; break; } }
        const resolved = (leftType === 'L' && rightType === 'L') ? 'L' : 'R';
        return { ...token, type: resolved };
    });
}

function groupIntoRuns(tokens) {
    if (tokens.length === 0) return [];
    const runs = [];
    let cur = { type: tokens[0].type, text: tokens[0].text };
    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i].type === cur.type) {
            cur.text += tokens[i].text;
        } else {
            runs.push(cur);
            cur = { type: tokens[i].type, text: tokens[i].text };
        }
    }
    runs.push(cur);
    return runs;
}

// ============================================================
// Main export: ar() function
// ============================================================

export function ar(text) {
    if (!text && text !== 0) return '';
    text = String(text);
    if (!text) return '';

    if (!hasArabic(text)) return text;

    const protected_ = protectAbbreviations(text);

    const tokens = tokenize(protected_);
    const resolved = resolveNeutrals(tokens);
    const runs = groupIntoRuns(resolved);

    // RTL layout - Reverse the sequential order of chunks
    runs.reverse();

    const processedRuns = runs.map(run => {
        if (run.type === 'R') {
            // Apply reshaping ONLY to Arabic runs (which safely reverses it within its block)
            let reshaped = convertArabic(run.text);
            reshaped = stripInvisible(reshaped);
            return mirrorBrackets(reshaped);
        } else {
            // Leave Numbers and English blocks correctly oriented
            return run.text;
        }
    });

    const visualText = processedRuns.join('');
    return restoreAbbreviations(visualText);
}

// ============================================================
// Safe font helpers & UI Elements
// ============================================================

export function safeWidth(font, text, size) {
    if (!text) return 0;
    try {
        return font.widthOfTextAtSize(text, size);
    } catch {
        let total = 0;
        for (const ch of text) {
            try { total += font.widthOfTextAtSize(ch, size); }
            catch { total += size * 0.4; }
        }
        return total;
    }
}

function safeDrawText(page, text, font, size, x, y, color) {
    try {
        page.drawText(text, { x, y, size, font, color });
    } catch {
        let curX = x;
        for (const ch of text) {
            try {
                page.drawText(ch, { x: curX, y, size, font, color });
                curX += font.widthOfTextAtSize(ch, size);
            } catch { curX += size * 0.4; }
        }
    }
}

export function drawRight(page, text, font, size, rightX, y, color) {
    if (!text) return;
    const w = safeWidth(font, text, size);
    safeDrawText(page, text, font, size, rightX - w, y, color);
}

export function drawCenter(page, text, font, size, centerX, y, color) {
    if (!text) return;
    const w = safeWidth(font, text, size);
    safeDrawText(page, text, font, size, centerX - w / 2, y, color);
}

export function drawLeft(page, text, font, size, leftX, y, color) {
    if (!text) return;
    safeDrawText(page, text, font, size, leftX, y, color);
}

export const COLORS = {
    blue: { r: 0.145, g: 0.388, b: 0.922 },
    darkBlue: { r: 0.071, g: 0.176, b: 0.373 },
    dark: { r: 0.067, g: 0.094, b: 0.153 },
    gray: { r: 0.42, g: 0.447, b: 0.502 },
    lightGray: { r: 0.898, g: 0.906, b: 0.922 },
    veryLightGray: { r: 0.945, g: 0.961, b: 0.976 },
    green: { r: 0.02, g: 0.588, b: 0.412 },
    red: { r: 0.863, g: 0.149, b: 0.149 },
    white: { r: 1, g: 1, b: 1 },
    black: { r: 0, g: 0, b: 0 },
};

export function toRgb(rgb, colorFn) {
    return colorFn(rgb.r, rgb.g, rgb.b);
}