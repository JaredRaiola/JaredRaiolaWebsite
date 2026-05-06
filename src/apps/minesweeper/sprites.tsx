import type { ReactElement } from 'react';

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000ff',
  2: '#008000',
  3: '#ff0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
};

export type CellSprite =
  | 'covered' | 'empty' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  | 'flag' | 'question' | 'questionPressed'
  | 'mine' | 'mineExploded' | 'mineWrong';

export function CellSpriteSvg({ state }: { state: CellSprite }): ReactElement {
  // 16x16 viewport. Background bevel handled by CSS on the parent for covered states;
  // SVG renders only the glyph (and the explode background for mineExploded etc).
  if (state === 'covered') {
    return <svg width={16} height={16} viewBox="0 0 16 16" />;
  }
  if (state === 'empty') {
    return <svg width={16} height={16} viewBox="0 0 16 16" />;
  }
  if (typeof state === 'number') {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16">
        <text
          x={8} y={13}
          textAnchor="middle"
          fontFamily="Tahoma, sans-serif"
          fontSize={12}
          fontWeight={700}
          fill={NUMBER_COLORS[state]}
        >{state}</text>
      </svg>
    );
  }
  if (state === 'flag') {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16">
        <rect x={3} y={11} width={10} height={2} fill="#000" />
        <rect x={6} y={9}  width={5}  height={2} fill="#000" />
        <rect x={7} y={3}  width={1}  height={6} fill="#000" />
        <polygon points="2,3 7,1 7,7" fill="#ff0000" />
      </svg>
    );
  }
  if (state === 'question' || state === 'questionPressed') {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16">
        <text x={8} y={13} textAnchor="middle" fontFamily="Tahoma, sans-serif" fontSize={12} fontWeight={700} fill="#000">?</text>
      </svg>
    );
  }
  // Mines
  const bg = state === 'mineExploded' ? '#ff0000' : 'transparent';
  const cross = state === 'mineWrong';
  return (
    <svg width={16} height={16} viewBox="0 0 16 16">
      <rect x={0} y={0} width={16} height={16} fill={bg} />
      <circle cx={8} cy={8} r={4} fill="#000" />
      <rect x={7} y={2} width={2} height={12} fill="#000" />
      <rect x={2} y={7} width={12} height={2} fill="#000" />
      <rect x={4} y={4} width={2} height={2} fill="#000" transform="rotate(45 5 5)" />
      <rect x={10} y={10} width={2} height={2} fill="#000" transform="rotate(45 11 11)" />
      <rect x={6} y={6} width={2} height={2} fill="#fff" />
      {cross && (
        <>
          <line x1={1} y1={1} x2={15} y2={15} stroke="#ff0000" strokeWidth={2} />
          <line x1={15} y1={1} x2={1} y2={15} stroke="#ff0000" strokeWidth={2} />
        </>
      )}
    </svg>
  );
}

export type FaceSprite = 'smile' | 'smilePressed' | 'oh' | 'dead' | 'cool';

export function FaceSpriteSvg({ state }: { state: FaceSprite }): ReactElement {
  // 24x24 viewBox, drawn as 26x26 actual.
  const eyes: ReactElement = (() => {
    if (state === 'dead') {
      return (
        <>
          <line x1={7} y1={8} x2={11} y2={12} stroke="#000" strokeWidth={1.5} />
          <line x1={11} y1={8} x2={7} y2={12} stroke="#000" strokeWidth={1.5} />
          <line x1={13} y1={8} x2={17} y2={12} stroke="#000" strokeWidth={1.5} />
          <line x1={17} y1={8} x2={13} y2={12} stroke="#000" strokeWidth={1.5} />
        </>
      );
    }
    if (state === 'cool') {
      return <rect x={5} y={9} width={14} height={3} fill="#000" />;
    }
    return (
      <>
        <circle cx={9} cy={10} r={1.3} fill="#000" />
        <circle cx={15} cy={10} r={1.3} fill="#000" />
      </>
    );
  })();

  const mouth: ReactElement = (() => {
    if (state === 'oh') {
      return <circle cx={12} cy={16} r={2} fill="none" stroke="#000" strokeWidth={1.2} />;
    }
    if (state === 'dead') {
      return <path d="M8 17 L16 17" stroke="#000" strokeWidth={1.2} fill="none" />;
    }
    return <path d="M8 15 Q12 19 16 15" stroke="#000" strokeWidth={1.2} fill="none" />;
  })();

  return (
    <svg width={26} height={26} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={10} fill="#ffff00" stroke="#000" strokeWidth={1} />
      {eyes}
      {mouth}
    </svg>
  );
}

export function DigitSpriteSvg({ value }: { value: number | '-' }): ReactElement {
  // 7-segment LED, red on black. 13x23.
  const segments: Record<string | number, string[]> = {
    0: ['a','b','c','d','e','f'],
    1: ['b','c'],
    2: ['a','b','d','e','g'],
    3: ['a','b','c','d','g'],
    4: ['b','c','f','g'],
    5: ['a','c','d','f','g'],
    6: ['a','c','d','e','f','g'],
    7: ['a','b','c'],
    8: ['a','b','c','d','e','f','g'],
    9: ['a','b','c','d','f','g'],
    '-': ['g'],
  };
  const on = new Set(segments[value] ?? []);
  const lit = '#ff0000';
  const off = '#400000';
  // segment coords in a 13x23 box.
  const seg = (id: string): ReactElement => {
    const c = on.has(id) ? lit : off;
    switch (id) {
      case 'a': return <rect x={2} y={1}  width={9} height={2} fill={c} />;
      case 'b': return <rect x={10} y={2}  width={2} height={9} fill={c} />;
      case 'c': return <rect x={10} y={12} width={2} height={9} fill={c} />;
      case 'd': return <rect x={2} y={20} width={9} height={2} fill={c} />;
      case 'e': return <rect x={1} y={12} width={2} height={9} fill={c} />;
      case 'f': return <rect x={1} y={2}  width={2} height={9} fill={c} />;
      case 'g': return <rect x={2} y={11} width={9} height={2} fill={c} />;
      default:  return <></>;
    }
  };
  return (
    <svg width={13} height={23} viewBox="0 0 13 23" style={{ background: '#000' }}>
      {(['a','b','c','d','e','f','g'] as const).map((s) => <g key={s}>{seg(s)}</g>)}
    </svg>
  );
}
