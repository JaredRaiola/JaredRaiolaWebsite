import type { Tool } from './types';

const TOOL_LABELS: Record<Tool['id'], string> = {
  pencil: '✎',
  brush: '🖌',
  eraser: '⌫',
  fill: '🪣',
  line: '╱',
  rect: '▭',
  ellipse: '⬭',
  picker: '👁',
};

type Props = {
  active: Tool['id'];
  onPick(id: Tool['id']): void;
};

export function Toolbox({ active, onPick }: Props) {
  const ids: Tool['id'][] = [
    'pencil',
    'brush',
    'eraser',
    'fill',
    'line',
    'rect',
    'ellipse',
    'picker',
  ];
  return (
    <div className="paint-toolbox">
      {ids.map((id) => (
        <button
          key={id}
          className={'paint-tool' + (active === id ? ' active' : '')}
          onClick={() => onPick(id)}
          title={id}
        >
          {TOOL_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
