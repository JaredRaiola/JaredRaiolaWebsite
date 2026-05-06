export type DifficultyName = 'beginner' | 'intermediate' | 'expert' | 'custom';

export type DifficultyConfig = {
  width: number;   // columns
  height: number;  // rows
  mines: number;
};

export const DIFFICULTIES: Record<Exclude<DifficultyName, 'custom'>, DifficultyConfig> = {
  beginner:     { width: 9,  height: 9,  mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert:       { width: 30, height: 16, mines: 99 },
};

export const CUSTOM_LIMITS = {
  minWidth: 9, maxWidth: 30,
  minHeight: 9, maxHeight: 24,
  minMines: 10,
};

export function maxMinesFor(width: number, height: number): number {
  // Leave at least 9 non-mine cells (so a corner first-click can't be impossible).
  return Math.max(CUSTOM_LIMITS.minMines, width * height - 9);
}

export const TILE_PX = 24;

/** Pixel size of the inner area (board + header + bevels), excluding window chrome. */
export function computeContentSize(width: number, height: number): { contentWidth: number; contentHeight: number } {
  const HEADER_H = 52;        // counter / smiley / timer strip (36px face + 12px padding + 4px border)
  const OUTER_PAD = 8;        // raised outer frame thickness
  const INNER_PAD = 6;        // sunken inner frame thickness around board
  const HEADER_GAP = 8;       // gap between header strip and board
  const boardW = width * TILE_PX;
  const boardH = height * TILE_PX;
  const contentWidth = OUTER_PAD * 2 + INNER_PAD * 2 + boardW;
  const contentHeight = OUTER_PAD * 2 + HEADER_H + HEADER_GAP + INNER_PAD * 2 + boardH;
  return { contentWidth, contentHeight };
}

/**
 * Window size including chrome (title bar + menu bar + frame).
 * Matches actual Window.css: 26px title bar + 4px padding + ~28px menu bar + 4px frame.
 */
export function computeWindowSize(width: number, height: number): { windowWidth: number; windowHeight: number } {
  const { contentWidth, contentHeight } = computeContentSize(width, height);
  const TITLE_H = 30;
  const MENU_H = 28;
  const FRAME_X = 4;
  const FRAME_Y = 4;
  return {
    windowWidth: contentWidth + FRAME_X * 2,
    windowHeight: contentHeight + TITLE_H + MENU_H + FRAME_Y * 2,
  };
}
