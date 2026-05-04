export type ToolContext = {
  ctx: CanvasRenderingContext2D;
  preview: CanvasRenderingContext2D;
  fg: string;
  bg: string;
  size: number;
};

export type ToolHandlers = {
  onMove?(p: { x: number; y: number }): void;
  onUp?(p: { x: number; y: number }): void;
};

export type Tool = {
  id: 'pencil' | 'brush' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse' | 'picker';
  cursor: string;
  onDown(p: { x: number; y: number }, tc: ToolContext): ToolHandlers;
};
