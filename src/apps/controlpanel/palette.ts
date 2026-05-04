export type ColorScheme = { key: string; label: string; bg: string };

export const COLOR_SCHEMES: ColorScheme[] = [
  { key: 'standard',   label: 'Windows Standard',   bg: '#008080' },
  { key: 'brick',      label: 'Brick',              bg: '#800000' },
  { key: 'desert',     label: 'Desert',             bg: '#a08060' },
  { key: 'eggplant',   label: 'Eggplant',           bg: '#403050' },
  { key: 'rainy',      label: 'Rainy Day',          bg: '#406070' },
  { key: 'rose',       label: 'Rose',               bg: '#a06080' },
  { key: 'spruce',     label: 'Spruce',             bg: '#306040' },
  { key: 'storm',      label: 'Storm',              bg: '#4060c0' },
  { key: 'hcblack',    label: 'High Contrast Black', bg: '#000000' },
  { key: 'hcwhite',    label: 'High Contrast White', bg: '#ffffff' },
];

export const findSchemeByBg = (bg: string): ColorScheme | undefined =>
  COLOR_SCHEMES.find((s) => s.bg.toLowerCase() === bg.toLowerCase());
