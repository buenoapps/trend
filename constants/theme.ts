/**
 * Trend palette: gentle sage greens with rosy cheek accents and a soft cream
 * backdrop. Keys are the same in light and dark so `useThemeColor(_, key)`
 * works for either scheme.
 */

import { Platform } from 'react-native';

const sproutLight = '#A8C4A2';
const sproutDark = '#7FA47A';
const leafLight = '#6FA46A';
const leafDark = '#9CC79A';
const cheekLight = '#F2B5B0';
const cheekDark = '#C4827E';
const cream = '#FBF7EE';
const creamSoft = '#F4EFE2';
const inkLight = '#2E3A2C';
const inkDark = '#E7EDE5';

export const Colors = {
  light: {
    text: inkLight,
    background: cream,
    tint: leafLight,
    icon: '#5C6A5A',
    tabIconDefault: '#9AAA98',
    tabIconSelected: leafLight,
    sprout: sproutLight,
    sproutSoft: '#C7DBC3',
    leaf: leafLight,
    cheek: cheekLight,
    card: '#FFFFFF',
    cardSoft: creamSoft,
    border: '#E2DCCB',
    chartLine: leafLight,
    chartFill: 'rgba(111,164,106,0.18)',
    danger: '#C76B5C',
    muted: '#7C8A7A',
  },
  dark: {
    text: inkDark,
    background: '#10140F',
    tint: leafDark,
    icon: '#9AA89A',
    tabIconDefault: '#6F7A6E',
    tabIconSelected: leafDark,
    sprout: sproutDark,
    sproutSoft: '#3E5A3A',
    leaf: leafDark,
    cheek: cheekDark,
    card: '#1A1F18',
    cardSoft: '#222A20',
    border: '#2C342A',
    chartLine: leafDark,
    chartFill: 'rgba(156,199,154,0.20)',
    danger: '#E08A7C',
    muted: '#8A968A',
  },
};

/**
 * Per-person accent colours for the family tracker. Each entry carries a
 * light/dark pair so a person's colour stays legible in either scheme,
 * mirroring how `Colors[scheme]` is consumed elsewhere.
 */
export const PERSON_COLORS = [
  { key: 'rose', light: '#E08AA8', dark: '#C76B92' },
  { key: 'leaf', light: '#6FA46A', dark: '#9CC79A' },
  { key: 'sky', light: '#5B95C9', dark: '#8FB8DD' },
  { key: 'amber', light: '#D99A4E', dark: '#E0B274' },
  { key: 'plum', light: '#9B72C4', dark: '#B79AD6' },
  { key: 'teal', light: '#4FA89C', dark: '#7FC4BA' },
  { key: 'coral', light: '#E0795C', dark: '#E09A84' },
  { key: 'slate', light: '#6E7F8C', dark: '#97A6B1' },
] as const;

export type PersonColorKey = (typeof PERSON_COLORS)[number]['key'];

export function personColor(colorKey: PersonColorKey, scheme: 'light' | 'dark'): string {
  const entry = PERSON_COLORS.find((c) => c.key === colorKey) ?? PERSON_COLORS[0];
  return entry[scheme];
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
