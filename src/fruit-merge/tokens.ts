// Design tokens (TS side). CSS-variable twins live in styles.css under .fm-root.
export const COLORS = {
  black: '#0A0A0A',
  cream: '#FCE3D5',
  orangeRed: '#F2502C',
  orange: '#FF7A1A',
  pink: '#F2C6E0',
  yellow: '#F5D90A',
  teal: '#12B5C4',
  blue: '#2B4FD8',
  magenta: '#E0218A',
  green: '#3FA66B',
  red: '#D9301E',
  brown: '#6B4A1B', // apple/orange stems
} as const;

export const FONTS = {
  display: "'Anton', 'Impact', 'Arial Narrow', sans-serif",
  mono: "'DM Mono', ui-monospace, 'Courier New', monospace",
  body: "'DM Sans', system-ui, sans-serif",
} as const;
