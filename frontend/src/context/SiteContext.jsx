import { createContext, useContext } from 'react';
import i18n from '../i18n';

export const SiteCtx = createContext({});
export const useSite = () => useContext(SiteCtx);

/** Thoroughly strip HTML tags and decode HTML entities */
export const stripTags = (val) => {
    if (!val) return '';
    const str = typeof val === 'string' ? val : String(val);
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Safely extract a clean, tag-free localized string value based on current i18n language.
 * Guarantees no HTML tags are rendered as text, and falls back properly when switching languages.
 */
export const txt = (value, fallback = '') => {
    const lng = i18n.language?.split('-')[0] || 'en';
    if (!value) return stripTags(fallback);

    let res = '';
    if (typeof value === 'string') {
        const cleaned = stripTags(value);
        if (lng === 'en') {
            res = cleaned;
        } else if (fallback) {
            // In non-English with a fallback provided, allow the localized fallback to take priority
            res = stripTags(fallback);
        } else {
            res = cleaned;
        }
    } else if (typeof value === 'object') {
        const valLng = stripTags(value[lng]);
        if (valLng) {
            res = valLng;
        } else if (fallback) {
            res = stripTags(fallback);
        } else if (lng === 'en') {
            res = stripTags(value.en || value.am || value.om || '');
        } else {
            res = stripTags(value.en || value.am || value.om || '');
        }
    } else {
        res = stripTags(String(value));
    }

    return res || stripTags(fallback);
};

export const shadeColor = (hex, amount) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#0a2b5a';
    const value = hex.replace('#', '');
    if (value.length < 6) return hex;
    const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
    return `#${rgb
        .map((channel) =>
            Math.max(
                0,
                Math.min(
                    255,
                    Math.round(
                        channel + (amount < 0 ? channel * amount : (255 - channel) * amount)
                    )
                )
            ).toString(16).padStart(2, '0')
        )
        .join('')}`;
};
