# Solitaire (Klondike) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build authentic Win95 Klondike Solitaire as a desktop app with full Microsoft scoring, draw 1/3, Vegas mode, win cascade, undo, and session persistence.

**Architecture:** Pure `engine.ts` (state, reducer, deal, move-legality, scoring) + React component using `useReducer`. Components render from state and dispatch on input. `options.ts` and `bestTimes.ts` isolate `localStorage` access. SVG card faces parametric. Win cascade is a `<canvas>` overlay. Per-window session state plugs into existing `registerSnapshot`/`registerBlob` API.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (only for `windowStore`). vitest with jsdom + fake-indexeddb (already configured). 98.css for chrome only.

**Spec:** `docs/superpowers/specs/2026-05-06-solitaire-design.md`

**Branch:** `feat/solitaire` (already created and rebased onto master).

---

## File Structure

**New files:**
```
src/apps/solitaire/
  meta.ts                       app registration
  index.tsx                     React component, reducer wiring, snapshot/best-times wiring
  engine.ts                     pure: state types, reducer, deal, move-legality, scoring, win detection
  engine.test.ts                vitest
  options.ts                    Options + vegasBalance localStorage
  options.test.ts               vitest
  bestTimes.ts                  best times localStorage
  bestTimes.test.ts             vitest
  rng.ts                        mulberry32 seeded RNG
  components/
    Card.tsx
    Pile.tsx
    Stock.tsx
    Waste.tsx
    Foundation.tsx
    Tableau.tsx
    StatusBar.tsx
    OptionsDialog.tsx
    StatisticsDialog.tsx
    WinCascade.tsx
  cards/
    CardFaceSvg.tsx
    CardBackSvg.tsx
  solitaire.css
```

**Modified files:**
- `src/core/boot.ts` — add `import solitaireMeta from '@/apps/solitaire/meta'` + `registerApp(solitaireMeta)`.

---

## Task Conventions

- **Branch:** `feat/solitaire`. All work commits here.
- **Commit prefix:** `feat(solitaire): ...` for code, `test(solitaire): ...` for test-only commits.
- **Test runner:** `npm test -- src/apps/solitaire --run` runs the suite; `npm test -- src/apps/solitaire/engine.test.ts --run` for one file. The repo uses vitest with `--run` to avoid watch mode.
- **Type check:** `npm run build` is the gold-standard type check. `npx tsc --noEmit` works for fast feedback if the dev runs it.
- **Pattern reference:** Minesweeper (`src/apps/minesweeper/*`) is the closest analog and was built with this same architecture. When in doubt, mirror its structure.
- **Style:** No comments unless WHY is non-obvious. Prefer pure functions in engine. No premature abstractions.

---

### Task 1: Skeleton — types, RNG, meta, stub component, registration

Get the app shell wired so opening Solitaire from the Start menu shows an empty window. No game logic yet.

**Files:**
- Create: `src/apps/solitaire/rng.ts`
- Create: `src/apps/solitaire/engine.ts` (types only this task)
- Create: `src/apps/solitaire/meta.ts`
- Create: `src/apps/solitaire/index.tsx`
- Create: `src/apps/solitaire/solitaire.css`
- Modify: `src/core/boot.ts` (register app)

- [ ] **Step 1: Create RNG module**

`src/apps/solitaire/rng.ts`:
```ts
export type RNG = () => number;

/** mulberry32 — small, fast, deterministic. Returns a function in [0,1). */
export function makeRng(seed: number): RNG {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 2: Create engine types-only file**

`src/apps/solitaire/engine.ts`:
```ts
export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

export type PileId =
  | 'stock' | 'waste'
  | 'foundation-spades' | 'foundation-hearts' | 'foundation-clubs' | 'foundation-diamonds'
  | 'tableau-0' | 'tableau-1' | 'tableau-2' | 'tableau-3' | 'tableau-4' | 'tableau-5' | 'tableau-6';

export type Phase = 'idle' | 'playing' | 'won' | 'cascading';

export type Options = {
  draw: 1 | 3;
  scoring: 'standard' | 'vegas' | 'none';
  timed: boolean;
  statusBar: boolean;
  outlineDragging: boolean;
  vegasKeepScore: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  draw: 1,
  scoring: 'standard',
  timed: true,
  statusBar: true,
  outlineDragging: false,
  vegasKeepScore: false,
};

export type GameState = {
  phase: Phase;
  piles: Record<PileId, Card[]>;
  options: Options;
  score: number;
  vegasBalance: number;
  startedAt: number | null;
  elapsedMs: number;
  recyclesUsed: number;
  prev: { piles: Record<PileId, Card[]>; score: number; recyclesUsed: number } | null;
  drag: { from: PileId; cards: Card[]; pointerOffset: { x: number; y: number } } | null;
};

export const ALL_PILES: PileId[] = [
  'stock', 'waste',
  'foundation-spades', 'foundation-hearts', 'foundation-clubs', 'foundation-diamonds',
  'tableau-0', 'tableau-1', 'tableau-2', 'tableau-3', 'tableau-4', 'tableau-5', 'tableau-6',
];

export function emptyPiles(): Record<PileId, Card[]> {
  return {
    stock: [], waste: [],
    'foundation-spades': [], 'foundation-hearts': [], 'foundation-clubs': [], 'foundation-diamonds': [],
    'tableau-0': [], 'tableau-1': [], 'tableau-2': [], 'tableau-3': [], 'tableau-4': [], 'tableau-5': [], 'tableau-6': [],
  };
}
```

- [ ] **Step 3: Create meta**

`src/apps/solitaire/meta.ts`:
```ts
import type { AppDef } from '@/core/apps/registry';

const meta: AppDef = {
  id: 'solitaire',
  displayName: 'Solitaire',
  icon: '/assets/win98/png/game_solitaire-0.png',
  defaultSize: { width: 700, height: 600 },
  minSize: { width: 580, height: 480 },
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
  resizable: true,
  component: () => import('./index'),
};

export default meta;
```

- [ ] **Step 4: Create stub component**

`src/apps/solitaire/index.tsx`:
```tsx
import type { AppProps } from '@/core/apps/registry';
import './solitaire.css';

export default function Solitaire(_props: AppProps) {
  return (
    <div className="sol-root">
      <div className="sol-felt">Solitaire — coming soon</div>
    </div>
  );
}
```

- [ ] **Step 5: Create CSS skeleton**

`src/apps/solitaire/solitaire.css`:
```css
.sol-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #008000;
}
.sol-felt {
  flex: 1;
  position: relative;
  overflow: auto;
  color: #fff;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  padding: 12px;
}
```

- [ ] **Step 6: Register app in boot**

In `src/core/boot.ts`, add the import after `minesweeperMeta`:
```ts
import minesweeperMeta from '@/apps/minesweeper/meta';
import solitaireMeta from '@/apps/solitaire/meta';
```

And in `registerAllApps()`, add after the minesweeper line:
```ts
  registerApp(minesweeperMeta);
  registerApp(solitaireMeta);
```

- [ ] **Step 7: Verify icon exists**

Run: `ls public/assets/win98/png/ | grep -i solitaire`
Expected: `game_solitaire-0.png` (or similar). If missing, fall back to `game_freecell-0.png` or any `.png` under `/win98/png/` and update `meta.ts`.

- [ ] **Step 8: Type check + manual smoke**

Run: `npm run build`
Expected: builds clean.

Run: `npm run dev` and open Start → Programs → Games → Solitaire.
Expected: window opens 700×600 with green background and "Solitaire — coming soon".

- [ ] **Step 9: Commit**

```bash
git add src/apps/solitaire src/core/boot.ts
git commit -m "feat(solitaire): skeleton — types, meta, stub component, registration"
```

---

### Task 2: Engine — deal + tests

Build the deal function and lock down deck construction with deterministic tests.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Create: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

`src/apps/solitaire/engine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makeDeck, deal } from './engine';
import { makeRng } from './rng';

describe('makeDeck', () => {
  it('produces 52 unique cards', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });
  it('all cards face down', () => {
    expect(makeDeck().every((c) => c.faceUp === false)).toBe(true);
  });
});

describe('deal', () => {
  it('puts 28 cards in the tableau (1+2+3+4+5+6+7)', () => {
    const s = deal(makeRng(1));
    const tab = [0, 1, 2, 3, 4, 5, 6].map((i) => s.piles[`tableau-${i}` as const].length);
    expect(tab).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('only top tableau card is face up', () => {
    const s = deal(makeRng(1));
    for (let i = 0; i < 7; i++) {
      const col = s.piles[`tableau-${i}` as const];
      expect(col[col.length - 1].faceUp).toBe(true);
      for (let j = 0; j < col.length - 1; j++) expect(col[j].faceUp).toBe(false);
    }
  });
  it('puts the remaining 24 cards face-down in the stock', () => {
    const s = deal(makeRng(1));
    expect(s.piles.stock).toHaveLength(24);
    expect(s.piles.stock.every((c) => c.faceUp === false)).toBe(true);
  });
  it('foundations and waste start empty', () => {
    const s = deal(makeRng(1));
    expect(s.piles.waste).toHaveLength(0);
    expect(s.piles['foundation-spades']).toHaveLength(0);
    expect(s.piles['foundation-hearts']).toHaveLength(0);
    expect(s.piles['foundation-clubs']).toHaveLength(0);
    expect(s.piles['foundation-diamonds']).toHaveLength(0);
  });
  it('is deterministic for the same seed', () => {
    const a = deal(makeRng(42));
    const b = deal(makeRng(42));
    expect(a.piles).toEqual(b.piles);
  });
  it('initial phase is playing, score 0, recyclesUsed 0', () => {
    const s = deal(makeRng(1));
    expect(s.phase).toBe('playing');
    expect(s.score).toBe(0);
    expect(s.recyclesUsed).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL — `makeDeck` and `deal` not exported.

- [ ] **Step 3: Implement makeDeck and deal**

Append to `src/apps/solitaire/engine.ts`:
```ts
import type { RNG } from './rng';

export function makeDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const suitChar: Record<Suit, string> = { spades: 'S', hearts: 'H', clubs: 'C', diamonds: 'D' };
  const out: Card[] = [];
  for (const suit of suits) {
    for (let r = 1; r <= 13; r++) {
      const rank = r as Rank;
      const rankChar = rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
      out.push({ id: `${rankChar}${suitChar[suit]}`, suit, rank, faceUp: false });
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal(rng: RNG, options: Options = DEFAULT_OPTIONS): GameState {
  const deck = shuffle(makeDeck(), rng);
  const piles = emptyPiles();
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] };
      if (row === col) card.faceUp = true;
      piles[`tableau-${col}` as PileId].push(card);
    }
  }
  for (; idx < deck.length; idx++) piles.stock.push({ ...deck[idx], faceUp: false });

  const startedAt = options.timed ? Date.now() : null;
  return {
    phase: 'playing',
    piles,
    options,
    score: options.scoring === 'vegas' ? -52 : 0,
    vegasBalance: 0,
    startedAt,
    elapsedMs: 0,
    recyclesUsed: 0,
    prev: null,
    drag: null,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS — 7/7 tests for deck and deal.

- [ ] **Step 5: Commit**

```bash
git add src/apps/solitaire/engine.ts src/apps/solitaire/engine.test.ts
git commit -m "feat(solitaire): deck construction + deterministic deal"
```

---

### Task 3: Engine — move legality

Pure helpers for whether a card / run can be placed on a destination pile.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `engine.test.ts`:
```ts
import { canStackOnTableau, canStackOnFoundation, isValidRun, color } from './engine';

describe('color', () => {
  it('hearts and diamonds are red', () => {
    expect(color('hearts')).toBe('red');
    expect(color('diamonds')).toBe('red');
  });
  it('spades and clubs are black', () => {
    expect(color('spades')).toBe('black');
    expect(color('clubs')).toBe('black');
  });
});

describe('canStackOnTableau', () => {
  const ks = { id: 'KS', suit: 'spades', rank: 13, faceUp: true } as const;
  const qh = { id: 'QH', suit: 'hearts', rank: 12, faceUp: true } as const;
  const qd = { id: 'QD', suit: 'diamonds', rank: 12, faceUp: true } as const;
  const jc = { id: 'JC', suit: 'clubs', rank: 11, faceUp: true } as const;
  it('king on empty', () => {
    expect(canStackOnTableau(undefined, ks)).toBe(true);
  });
  it('non-king on empty rejects', () => {
    expect(canStackOnTableau(undefined, qh)).toBe(false);
  });
  it('opposite color one rank lower', () => {
    expect(canStackOnTableau(ks, qh)).toBe(true);
    expect(canStackOnTableau(qh, jc)).toBe(true);
  });
  it('same color rejects', () => {
    expect(canStackOnTableau(ks, qd)).toBe(false);
  });
  it('wrong rank rejects', () => {
    expect(canStackOnTableau(ks, jc)).toBe(false);
  });
});

describe('canStackOnFoundation', () => {
  const as = { id: 'AS', suit: 'spades', rank: 1, faceUp: true } as const;
  const twos = { id: '2S', suit: 'spades', rank: 2, faceUp: true } as const;
  const twoh = { id: '2H', suit: 'hearts', rank: 2, faceUp: true } as const;
  it('ace on empty', () => {
    expect(canStackOnFoundation(undefined, as)).toBe(true);
  });
  it('non-ace on empty rejects', () => {
    expect(canStackOnFoundation(undefined, twos)).toBe(false);
  });
  it('same suit one rank higher', () => {
    expect(canStackOnFoundation(as, twos)).toBe(true);
  });
  it('different suit rejects', () => {
    expect(canStackOnFoundation(as, twoh)).toBe(false);
  });
  it('wrong rank rejects', () => {
    const ks = { id: 'KS', suit: 'spades', rank: 13, faceUp: true } as const;
    expect(canStackOnFoundation(as, ks)).toBe(false);
  });
});

describe('isValidRun', () => {
  it('single card is a valid run', () => {
    expect(isValidRun([{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }])).toBe(true);
  });
  it('alternating colors descending', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '4S', suit: 'spades', rank: 4, faceUp: true },
        { id: '3D', suit: 'diamonds', rank: 3, faceUp: true },
      ]),
    ).toBe(true);
  });
  it('rejects same color', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '4D', suit: 'diamonds', rank: 4, faceUp: true },
      ]),
    ).toBe(false);
  });
  it('rejects non-descending', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
        { id: '6S', suit: 'spades', rank: 6, faceUp: true },
      ]),
    ).toBe(false);
  });
  it('rejects face-down cards in the run', () => {
    expect(
      isValidRun([
        { id: '5H', suit: 'hearts', rank: 5, faceUp: false },
      ]),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Implement helpers**

Append to `engine.ts`:
```ts
export function color(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function canStackOnTableau(top: Card | undefined, candidate: Card): boolean {
  if (!candidate.faceUp) return false;
  if (top === undefined) return candidate.rank === 13;
  if (!top.faceUp) return false;
  return color(top.suit) !== color(candidate.suit) && top.rank === candidate.rank + 1;
}

export function canStackOnFoundation(top: Card | undefined, candidate: Card): boolean {
  if (!candidate.faceUp) return false;
  if (top === undefined) return candidate.rank === 1;
  return top.suit === candidate.suit && candidate.rank === top.rank + 1;
}

export function isValidRun(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  if (!cards.every((c) => c.faceUp)) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    if (a.rank !== b.rank + 1) return false;
    if (color(a.suit) === color(b.suit)) return false;
  }
  return true;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/apps/solitaire/engine.ts src/apps/solitaire/engine.test.ts
git commit -m "feat(solitaire): move-legality helpers"
```

---

### Task 4: Engine — reducer scaffold + drawFromStock + recycleStock

Reducer dispatches actions to a `GameState`. Start with stock interactions.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `engine.test.ts`:
```ts
import { reducer } from './engine';

describe('reducer/drawFromStock', () => {
  it('draw 1 moves one card from stock to waste face-up', () => {
    const s0 = deal(makeRng(1));
    const stockBefore = s0.piles.stock.length;
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.piles.stock).toHaveLength(stockBefore - 1);
    expect(s1.piles.waste).toHaveLength(1);
    expect(s1.piles.waste[0].faceUp).toBe(true);
  });
  it('draw 3 moves three cards from stock to waste face-up', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, draw: 3 });
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.piles.waste).toHaveLength(3);
    expect(s1.piles.waste.every((c) => c.faceUp)).toBe(true);
  });
  it('draw 3 moves remaining cards if fewer than 3', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, draw: 3 });
    let s = s0;
    while (s.piles.stock.length > 2) s = reducer(s, { type: 'drawFromStock' });
    s.piles.stock = s.piles.stock.slice(0, 2);
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2.piles.stock).toHaveLength(0);
    expect(s2.piles.waste.length - s.piles.waste.length).toBe(2);
  });
  it('drawFromStock on empty stock with non-empty waste recycles', () => {
    const s0 = deal(makeRng(1));
    const s = { ...s0, piles: { ...s0.piles, stock: [], waste: s0.piles.stock.slice() } };
    const wasteBefore = s.piles.waste.length;
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2.piles.stock).toHaveLength(wasteBefore);
    expect(s2.piles.waste).toHaveLength(0);
    expect(s2.piles.stock.every((c) => c.faceUp === false)).toBe(true);
    expect(s2.recyclesUsed).toBe(1);
  });
  it('vegas mode blocks recycle after one pass for draw 1', () => {
    const s0 = deal(makeRng(1), { ...DEFAULT_OPTIONS, scoring: 'vegas', draw: 1 });
    const s = { ...s0, piles: { ...s0.piles, stock: [], waste: s0.piles.stock.slice() }, recyclesUsed: 1 };
    const s2 = reducer(s, { type: 'drawFromStock' });
    expect(s2).toBe(s);
  });
});
```

- [ ] **Step 2: Run tests to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL — `reducer` not exported.

- [ ] **Step 3: Implement reducer + drawFromStock**

Append to `engine.ts`:
```ts
export type Action =
  | { type: 'drawFromStock' }
  | { type: 'tryMove'; from: PileId; fromIdx: number; to: PileId }
  | { type: 'autoMoveToFoundation'; from: PileId }
  | { type: 'autoFinish' }
  | { type: 'undo' }
  | { type: 'deal'; rng: RNG }
  | { type: 'pickUpDrag'; from: PileId; cards: Card[]; pointerOffset: { x: number; y: number } }
  | { type: 'cancelDrag' }
  | { type: 'setOptions'; options: Partial<Options> }
  | { type: 'tick'; now: number };

function snapshotPrev(s: GameState): GameState['prev'] {
  return { piles: clonePiles(s.piles), score: s.score, recyclesUsed: s.recyclesUsed };
}

function clonePiles(p: Record<PileId, Card[]>): Record<PileId, Card[]> {
  const out = emptyPiles();
  for (const k of ALL_PILES) out[k] = p[k].map((c) => ({ ...c }));
  return out;
}

function maxRecyclesForVegas(draw: 1 | 3): number {
  return draw === 1 ? 1 : 3;
}

function drawFromStock(s: GameState): GameState {
  if (s.phase !== 'playing') return s;
  if (s.piles.stock.length > 0) {
    const piles = clonePiles(s.piles);
    const n = Math.min(s.options.draw, piles.stock.length);
    for (let i = 0; i < n; i++) {
      const card = piles.stock.pop()!;
      card.faceUp = true;
      piles.waste.push(card);
    }
    return { ...s, piles, prev: snapshotPrev(s) };
  }
  // Stock empty → recycle, if allowed.
  if (s.piles.waste.length === 0) return s;
  if (s.options.scoring === 'vegas' && s.recyclesUsed >= maxRecyclesForVegas(s.options.draw)) return s;
  const piles = clonePiles(s.piles);
  while (piles.waste.length > 0) {
    const card = piles.waste.pop()!;
    card.faceUp = false;
    piles.stock.push(card);
  }
  let score = s.score;
  if (s.options.scoring === 'standard') {
    score = Math.max(0, score - (s.options.draw === 1 ? 100 : 20));
  }
  return { ...s, piles, score, recyclesUsed: s.recyclesUsed + 1, prev: snapshotPrev(s) };
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'drawFromStock': return drawFromStock(s);
    default: return s;
  }
}
```

- [ ] **Step 4: Run tests to pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): reducer scaffold + draw/recycle stock"
```

---

### Task 5: Engine — tryMove (tableau, foundation, multi-card runs)

The single most-used action: move one or more cards from a source pile to a destination pile.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `engine.test.ts`:
```ts
function findCardLocation(s: GameState, cardId: string): { pile: PileId; idx: number } | null {
  for (const p of ALL_PILES) {
    const idx = s.piles[p].findIndex((c) => c.id === cardId);
    if (idx >= 0) return { pile: p, idx };
  }
  return null;
}

import { ALL_PILES } from './engine';

describe('reducer/tryMove', () => {
  it('illegal move returns same state reference', () => {
    const s0 = deal(makeRng(1));
    const r = reducer(s0, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'tableau-1' });
    expect(r).toBe(s0);
  });
  it('legal single-card tableau→tableau move transfers and reveals new top', () => {
    // Construct a state by hand for predictability.
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: 'XX', suit: 'spades', rank: 7, faceUp: false },
      { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
    ];
    piles['tableau-1'] = [{ id: '6S', suit: 'spades', rank: 6, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 1, to: 'tableau-1' });
    expect(r.piles['tableau-1'].map((c) => c.id)).toEqual(['6S', '5H']);
    expect(r.piles['tableau-0']).toHaveLength(1);
    expect(r.piles['tableau-0'][0].faceUp).toBe(true);
  });
  it('legal multi-card tableau→tableau move requires valid run', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: '6S', suit: 'spades', rank: 6, faceUp: true },
      { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
      { id: '4C', suit: 'clubs', rank: 4, faceUp: true },
    ];
    piles['tableau-1'] = [{ id: '7H', suit: 'hearts', rank: 7, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'tableau-1' });
    expect(r.piles['tableau-1']).toHaveLength(4);
    expect(r.piles['tableau-0']).toHaveLength(0);
  });
  it('foundation only accepts single card', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: 'AS', suit: 'spades', rank: 1, faceUp: true },
      { id: '2S', suit: 'spades', rank: 2, faceUp: true },
    ];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'foundation-spades' });
    expect(r).toBe(s); // multi-card to foundation rejected
    const r2 = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 1, to: 'foundation-spades' });
    expect(r2.piles['foundation-spades'].map((c) => c.id)).toEqual(['2S']);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL — tryMove not implemented.

- [ ] **Step 3: Implement tryMove**

Add to `engine.ts`:
```ts
function isFoundationPile(p: PileId): boolean {
  return p.startsWith('foundation-');
}

function isTableauPile(p: PileId): boolean {
  return p.startsWith('tableau-');
}

function tryMove(s: GameState, from: PileId, fromIdx: number, to: PileId): GameState {
  if (s.phase !== 'playing') return s;
  if (from === to) return s;
  const src = s.piles[from];
  if (fromIdx < 0 || fromIdx >= src.length) return s;
  const moving = src.slice(fromIdx);
  if (!isValidRun(moving)) return s;

  if (isFoundationPile(to)) {
    if (moving.length !== 1) return s;
    if (!canStackOnFoundation(s.piles[to][s.piles[to].length - 1], moving[0])) return s;
  } else if (isTableauPile(to)) {
    const top = s.piles[to][s.piles[to].length - 1];
    if (!canStackOnTableau(top, moving[0])) return s;
  } else {
    return s;
  }

  const piles = clonePiles(s.piles);
  piles[from] = piles[from].slice(0, fromIdx);
  piles[to] = piles[to].concat(moving.map((c) => ({ ...c })));
  // Reveal new top of tableau source if face-down.
  if (isTableauPile(from)) {
    const newTop = piles[from][piles[from].length - 1];
    if (newTop && !newTop.faceUp) newTop.faceUp = true;
  }

  return { ...s, piles, prev: snapshotPrev(s) };
}
```

Update reducer switch:
```ts
    case 'tryMove': return tryMove(s, a.from, a.fromIdx, a.to);
```

- [ ] **Step 4: Run to pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): tryMove with single + multi-card runs"
```

---

### Task 6: Engine — autoMoveToFoundation + autoFinish + win detection

Double-click action and right-click auto-finish, plus the win check that runs after every mutation.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `engine.test.ts`:
```ts
describe('reducer/autoMoveToFoundation', () => {
  it('moves the top card of source to its suit foundation when legal', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'autoMoveToFoundation', from: 'waste' });
    expect(r.piles['foundation-spades'].map((c) => c.id)).toEqual(['AS']);
    expect(r.piles.waste).toHaveLength(0);
  });
  it('no-ops when illegal', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    expect(reducer(s, { type: 'autoMoveToFoundation', from: 'waste' })).toBe(s);
  });
});

describe('reducer/autoFinish + win detection', () => {
  it('autoFinish only runs when all face-down + stock + waste empty', () => {
    const piles = emptyPiles();
    piles['stock'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: false }];
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    expect(reducer(s, { type: 'autoFinish' })).toBe(s);
  });
  it('autoFinish moves all tableau cards to foundations and wins', () => {
    // Build a state where every tableau column has Ace through King in suit order.
    const piles = emptyPiles();
    const cols: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
    for (let i = 0; i < 4; i++) {
      const cards: Card[] = [];
      for (let r = 13; r >= 1; r--) {
        cards.push({
          id: `${r}${cols[i][0].toUpperCase()}`,
          suit: cols[i],
          rank: r as Rank,
          faceUp: true,
        });
      }
      piles[`tableau-${i}` as PileId] = cards;
    }
    const s: GameState = {
      phase: 'playing', piles, options: DEFAULT_OPTIONS, score: 0, vegasBalance: 0,
      startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'autoFinish' });
    expect(r.phase).toBe('won');
    for (const suit of cols) expect(r.piles[`foundation-${suit}` as PileId]).toHaveLength(13);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `engine.ts`:
```ts
function autoMoveToFoundation(s: GameState, from: PileId): GameState {
  if (s.phase !== 'playing') return s;
  const src = s.piles[from];
  if (src.length === 0) return s;
  const top = src[src.length - 1];
  if (!top.faceUp) return s;
  const dest = `foundation-${top.suit}` as PileId;
  return tryMove(s, from, src.length - 1, dest);
}

function checkWin(s: GameState): GameState {
  const total =
    s.piles['foundation-spades'].length +
    s.piles['foundation-hearts'].length +
    s.piles['foundation-clubs'].length +
    s.piles['foundation-diamonds'].length;
  if (total === 52 && s.phase === 'playing') return { ...s, phase: 'won' };
  return s;
}

function canAutoFinish(s: GameState): boolean {
  if (s.piles.stock.length > 0 || s.piles.waste.length > 0) return false;
  for (let i = 0; i < 7; i++) {
    const col = s.piles[`tableau-${i}` as PileId];
    if (col.some((c) => !c.faceUp)) return false;
  }
  return true;
}

function autoFinish(s: GameState): GameState {
  if (s.phase !== 'playing') return s;
  if (!canAutoFinish(s)) return s;
  let cur = s;
  let safety = 200;
  while (safety-- > 0) {
    let moved = false;
    for (let i = 0; i < 7; i++) {
      const pile = `tableau-${i}` as PileId;
      const next = autoMoveToFoundation(cur, pile);
      if (next !== cur) { cur = next; moved = true; break; }
    }
    if (!moved) break;
  }
  return checkWin(cur);
}
```

Update reducer switch — and wrap every mutating return through `checkWin`:
```ts
function applied(s: GameState): GameState { return checkWin(s); }

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'drawFromStock': return applied(drawFromStock(s));
    case 'tryMove': return applied(tryMove(s, a.from, a.fromIdx, a.to));
    case 'autoMoveToFoundation': return applied(autoMoveToFoundation(s, a.from));
    case 'autoFinish': return autoFinish(s);
    default: return s;
  }
}
```

- [ ] **Step 4: Run to pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): auto-move + auto-finish + win detection"
```

---

### Task 7: Engine — undo + deal action + setOptions + drag actions + tick

Round out the reducer.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append:
```ts
describe('reducer/undo', () => {
  it('undo restores piles + score + recyclesUsed', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    expect(s1.prev).not.toBeNull();
    const s2 = reducer(s1, { type: 'undo' });
    expect(s2.piles.stock).toEqual(s0.piles.stock);
    expect(s2.piles.waste).toEqual(s0.piles.waste);
    expect(s2.prev).toBeNull();
  });
  it('undo with no prev no-ops', () => {
    const s0 = deal(makeRng(1));
    expect(reducer(s0, { type: 'undo' })).toBe(s0);
  });
  it('cannot undo twice in a row', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    const s2 = reducer(s1, { type: 'undo' });
    expect(reducer(s2, { type: 'undo' })).toBe(s2);
  });
});

describe('reducer/deal action', () => {
  it('deal action wipes prev and starts fresh', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'drawFromStock' });
    const s2 = reducer(s1, { type: 'deal', rng: makeRng(2) });
    expect(s2.phase).toBe('playing');
    expect(s2.prev).toBeNull();
    expect(s2.piles).not.toEqual(s0.piles);
    expect(s2.options).toEqual(s0.options);
  });
});

describe('reducer/setOptions', () => {
  it('updates options and persists current game piles', () => {
    const s0 = deal(makeRng(1));
    const s1 = reducer(s0, { type: 'setOptions', options: { draw: 3 } });
    expect(s1.options.draw).toBe(3);
    expect(s1.piles).toEqual(s0.piles);
  });
});

describe('reducer/tick', () => {
  it('updates elapsedMs based on startedAt', () => {
    const s0 = { ...deal(makeRng(1)), startedAt: 1000 };
    const s1 = reducer(s0, { type: 'tick', now: 5000 });
    expect(s1.elapsedMs).toBe(4000);
  });
  it('no-ops when not playing', () => {
    const s0 = { ...deal(makeRng(1)), phase: 'won' as Phase };
    const s1 = reducer(s0, { type: 'tick', now: 999999 });
    expect(s1.elapsedMs).toBe(0);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `engine.ts`:
```ts
function undo(s: GameState): GameState {
  if (!s.prev) return s;
  return {
    ...s,
    piles: clonePiles(s.prev.piles),
    score: s.prev.score,
    recyclesUsed: s.prev.recyclesUsed,
    prev: null,
  };
}

function setOptions(s: GameState, partial: Partial<Options>): GameState {
  return { ...s, options: { ...s.options, ...partial } };
}

function pickUpDrag(s: GameState, from: PileId, cards: Card[], pointerOffset: { x: number; y: number }): GameState {
  return { ...s, drag: { from, cards, pointerOffset } };
}

function cancelDrag(s: GameState): GameState {
  return s.drag ? { ...s, drag: null } : s;
}

function tick(s: GameState, now: number): GameState {
  if (s.phase !== 'playing' || s.startedAt === null) return s;
  return { ...s, elapsedMs: Math.max(0, now - s.startedAt) };
}
```

Replace reducer switch fully:
```ts
export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'drawFromStock': return applied(drawFromStock(s));
    case 'tryMove': return applied(tryMove(s, a.from, a.fromIdx, a.to));
    case 'autoMoveToFoundation': return applied(autoMoveToFoundation(s, a.from));
    case 'autoFinish': return autoFinish(s);
    case 'undo': return undo(s);
    case 'deal': return deal(a.rng, s.options);
    case 'setOptions': return setOptions(s, a.options);
    case 'pickUpDrag': return pickUpDrag(s, a.from, a.cards, a.pointerOffset);
    case 'cancelDrag': return cancelDrag(s);
    case 'tick': return tick(s, a.now);
    default: return s;
  }
}
```

- [ ] **Step 4: Run to pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): undo + deal + setOptions + drag actions + tick"
```

---

### Task 8: Engine — scoring (standard + vegas + time bonus)

Wire scoring into mutations. Recycle penalty was already done in Task 4.

**Files:**
- Modify: `src/apps/solitaire/engine.ts`
- Modify: `src/apps/solitaire/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Append:
```ts
describe('scoring/standard', () => {
  it('+5 waste→tableau', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }];
    piles['tableau-0'] = [{ id: '6S', suit: 'spades', rank: 6, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 0, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'waste', fromIdx: 0, to: 'tableau-0' });
    expect(r.score).toBe(5);
  });
  it('+10 waste→foundation', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 0, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'waste', fromIdx: 0, to: 'foundation-spades' });
    expect(r.score).toBe(10);
  });
  it('+10 tableau→foundation', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 0, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'foundation-spades' });
    expect(r.score).toBe(10);
  });
  it('+5 turning over face-down tableau card', () => {
    const piles = emptyPiles();
    piles['tableau-0'] = [
      { id: 'XX', suit: 'clubs', rank: 7, faceUp: false },
      { id: '5H', suit: 'hearts', rank: 5, faceUp: true },
    ];
    piles['tableau-1'] = [{ id: '6S', suit: 'spades', rank: 6, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 0, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 1, to: 'tableau-1' });
    expect(r.score).toBe(5 + 5); // tableau move + reveal
  });
  it('-15 foundation→tableau', () => {
    const piles = emptyPiles();
    piles['foundation-spades'] = [
      { id: 'AS', suit: 'spades', rank: 1, faceUp: true },
      { id: '2S', suit: 'spades', rank: 2, faceUp: true },
    ];
    piles['tableau-0'] = [{ id: '3H', suit: 'hearts', rank: 3, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 100, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'foundation-spades', fromIdx: 1, to: 'tableau-0' });
    expect(r.score).toBe(85);
  });
  it('score never goes below 0 in standard', () => {
    const piles = emptyPiles();
    piles['foundation-spades'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    piles['tableau-0'] = [{ id: '2H', suit: 'hearts', rank: 2, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'standard' },
      score: 5, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'foundation-spades', fromIdx: 0, to: 'tableau-0' });
    expect(r.score).toBe(0);
  });
});

describe('scoring/vegas', () => {
  it('starts at -52', () => {
    const s = deal(makeRng(1), { ...DEFAULT_OPTIONS, scoring: 'vegas' });
    expect(s.score).toBe(-52);
  });
  it('+5 to foundation, no other events', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    piles['tableau-0'] = [{ id: '5H', suit: 'hearts', rank: 5, faceUp: true }];
    piles['tableau-1'] = [{ id: '6S', suit: 'spades', rank: 6, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'vegas' },
      score: -52, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r1 = reducer(s, { type: 'tryMove', from: 'waste', fromIdx: 0, to: 'foundation-spades' });
    expect(r1.score).toBe(-47);
    const r2 = reducer(s, { type: 'tryMove', from: 'tableau-0', fromIdx: 0, to: 'tableau-1' });
    expect(r2.score).toBe(-52); // no points for tableau move in vegas
  });
});

describe('scoring/none', () => {
  it('score never changes in none mode', () => {
    const piles = emptyPiles();
    piles['waste'] = [{ id: 'AS', suit: 'spades', rank: 1, faceUp: true }];
    const s: GameState = {
      phase: 'playing', piles, options: { ...DEFAULT_OPTIONS, scoring: 'none' },
      score: 0, vegasBalance: 0, startedAt: null, elapsedMs: 0, recyclesUsed: 0, prev: null, drag: null,
    };
    const r = reducer(s, { type: 'tryMove', from: 'waste', fromIdx: 0, to: 'foundation-spades' });
    expect(r.score).toBe(0);
  });
});

describe('scoring/timeBonus', () => {
  it('returns 0 when not timed', () => {
    expect(timeBonus({ ...DEFAULT_OPTIONS, timed: false }, 60_000)).toBe(0);
  });
  it('returns 0 when elapsed < 30s', () => {
    expect(timeBonus({ ...DEFAULT_OPTIONS, timed: true }, 20_000)).toBe(0);
  });
  it('floor(700000 / elapsedSec) for elapsed >= 30s', () => {
    expect(timeBonus({ ...DEFAULT_OPTIONS, timed: true }, 60_000)).toBe(Math.floor(700_000 / 60));
  });
});

import { timeBonus } from './engine';
```

- [ ] **Step 2: Run to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL.

- [ ] **Step 3: Implement scoring**

Replace `tryMove` and `drawFromStock` to apply score deltas. Add an internal `scoreDelta` helper.

In `engine.ts`, replace `tryMove` with:
```ts
type MoveContext = {
  from: PileId;
  to: PileId;
  movedCount: number;
  revealed: boolean;
};

function scoreDelta(opts: Options, ctx: MoveContext): number {
  if (opts.scoring === 'none') return 0;
  if (opts.scoring === 'vegas') {
    return isFoundationPile(ctx.to) ? 5 * ctx.movedCount : 0;
  }
  // standard
  let d = 0;
  if (isFoundationPile(ctx.to)) {
    d += 10 * ctx.movedCount;
  } else if (isTableauPile(ctx.to)) {
    if (ctx.from === 'waste') d += 5;
    if (isFoundationPile(ctx.from)) d -= 15 * ctx.movedCount;
  }
  if (ctx.revealed) d += 5;
  return d;
}

function tryMove(s: GameState, from: PileId, fromIdx: number, to: PileId): GameState {
  if (s.phase !== 'playing') return s;
  if (from === to) return s;
  const src = s.piles[from];
  if (fromIdx < 0 || fromIdx >= src.length) return s;
  const moving = src.slice(fromIdx);
  if (!isValidRun(moving)) return s;

  if (isFoundationPile(to)) {
    if (moving.length !== 1) return s;
    if (!canStackOnFoundation(s.piles[to][s.piles[to].length - 1], moving[0])) return s;
  } else if (isTableauPile(to)) {
    const top = s.piles[to][s.piles[to].length - 1];
    if (!canStackOnTableau(top, moving[0])) return s;
  } else {
    return s;
  }

  const piles = clonePiles(s.piles);
  piles[from] = piles[from].slice(0, fromIdx);
  piles[to] = piles[to].concat(moving.map((c) => ({ ...c })));
  let revealed = false;
  if (isTableauPile(from)) {
    const newTop = piles[from][piles[from].length - 1];
    if (newTop && !newTop.faceUp) { newTop.faceUp = true; revealed = true; }
  }

  const delta = scoreDelta(s.options, { from, to, movedCount: moving.length, revealed });
  let score = s.score + delta;
  if (s.options.scoring === 'standard' && score < 0) score = 0;
  return { ...s, piles, score, prev: snapshotPrev(s) };
}

export function timeBonus(options: Options, elapsedMs: number): number {
  if (!options.timed) return 0;
  const secs = Math.floor(elapsedMs / 1000);
  if (secs < 30) return 0;
  return Math.floor(700_000 / secs);
}
```

- [ ] **Step 4: Run to pass**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): scoring (standard + vegas + time bonus)"
```

---

### Task 9: options.ts + bestTimes.ts (with tests)

Persistent settings + best times. Mirror `minesweeper/scores.ts` structure.

**Files:**
- Create: `src/apps/solitaire/options.ts`
- Create: `src/apps/solitaire/options.test.ts`
- Create: `src/apps/solitaire/bestTimes.ts`
- Create: `src/apps/solitaire/bestTimes.test.ts`

- [ ] **Step 1: Write failing tests for options**

`src/apps/solitaire/options.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadOptions, saveOptions, loadVegasBalance, saveVegasBalance } from './options';
import { DEFAULT_OPTIONS } from './engine';

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  });
});

describe('options', () => {
  it('returns defaults when nothing stored', () => {
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
  it('round trips full options', () => {
    const o = { ...DEFAULT_OPTIONS, draw: 3 as const, scoring: 'vegas' as const, timed: false };
    saveOptions(o);
    expect(loadOptions()).toEqual(o);
  });
  it('returns defaults for malformed JSON', () => {
    localStorage.setItem('win95.solitaire.options', '{not json');
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
  it('vegas balance round trip', () => {
    expect(loadVegasBalance()).toBe(0);
    saveVegasBalance(123);
    expect(loadVegasBalance()).toBe(123);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `npm test -- src/apps/solitaire --run`
Expected: FAIL.

- [ ] **Step 3: Implement options.ts**

`src/apps/solitaire/options.ts`:
```ts
import { DEFAULT_OPTIONS, type Options } from './engine';

const OPTIONS_KEY = 'win95.solitaire.options';
const VEGAS_KEY = 'win95.solitaire.vegasBalance';

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);
    return {
      draw: parsed.draw === 3 ? 3 : 1,
      scoring: parsed.scoring === 'vegas' || parsed.scoring === 'none' ? parsed.scoring : 'standard',
      timed: typeof parsed.timed === 'boolean' ? parsed.timed : DEFAULT_OPTIONS.timed,
      statusBar: typeof parsed.statusBar === 'boolean' ? parsed.statusBar : DEFAULT_OPTIONS.statusBar,
      outlineDragging: typeof parsed.outlineDragging === 'boolean' ? parsed.outlineDragging : DEFAULT_OPTIONS.outlineDragging,
      vegasKeepScore: typeof parsed.vegasKeepScore === 'boolean' ? parsed.vegasKeepScore : DEFAULT_OPTIONS.vegasKeepScore,
    };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function saveOptions(o: Options): void {
  try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(o)); } catch { /* quota: ignore */ }
}

export function loadVegasBalance(): number {
  try {
    const raw = localStorage.getItem(VEGAS_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function saveVegasBalance(n: number): void {
  try { localStorage.setItem(VEGAS_KEY, String(n)); } catch { /* ignore */ }
}
```

- [ ] **Step 4: Run options tests**

Run: `npm test -- src/apps/solitaire/options --run`
Expected: PASS.

- [ ] **Step 5: Write failing bestTimes tests**

`src/apps/solitaire/bestTimes.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBestTime, saveIfBest, resetBestTime } from './bestTimes';

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  });
});

describe('bestTimes', () => {
  it('returns null when none', () => {
    expect(loadBestTime()).toBeNull();
  });
  it('saveIfBest accepts first entry', () => {
    expect(saveIfBest(120, 'Alice')).toBe(true);
    expect(loadBestTime()).toEqual({ name: 'Alice', seconds: 120 });
  });
  it('rejects worse times', () => {
    saveIfBest(120, 'Alice');
    expect(saveIfBest(150, 'Bob')).toBe(false);
    expect(loadBestTime()?.name).toBe('Alice');
  });
  it('accepts better times', () => {
    saveIfBest(120, 'Alice');
    expect(saveIfBest(100, 'Bob')).toBe(true);
    expect(loadBestTime()?.name).toBe('Bob');
  });
  it('reset clears', () => {
    saveIfBest(120, 'Alice');
    resetBestTime();
    expect(loadBestTime()).toBeNull();
  });
  it('truncates long names', () => {
    const longName = 'A'.repeat(100);
    saveIfBest(50, longName);
    expect(loadBestTime()!.name.length).toBeLessThanOrEqual(25);
  });
});
```

- [ ] **Step 6: Run to fail**

Run: `npm test -- src/apps/solitaire/bestTimes --run`
Expected: FAIL.

- [ ] **Step 7: Implement bestTimes.ts**

`src/apps/solitaire/bestTimes.ts`:
```ts
const KEY = 'win95.solitaire.bestTimes';
const MAX_NAME = 25;

export type BestTime = { name: string; seconds: number };

export function loadBestTime(): BestTime | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BestTime;
    if (typeof parsed?.seconds !== 'number' || typeof parsed?.name !== 'string') return null;
    return parsed;
  } catch { return null; }
}

export function saveIfBest(seconds: number, name: string): boolean {
  const existing = loadBestTime();
  if (existing && seconds >= existing.seconds) return false;
  const trimmed = name.slice(0, MAX_NAME);
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: trimmed, seconds }));
    return true;
  } catch { return false; }
}

export function resetBestTime(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
```

- [ ] **Step 8: Run all solitaire tests**

Run: `npm test -- src/apps/solitaire --run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/apps/solitaire/options.ts src/apps/solitaire/options.test.ts src/apps/solitaire/bestTimes.ts src/apps/solitaire/bestTimes.test.ts
git commit -m "feat(solitaire): options + best-times persistence"
```

---

### Task 10: CardFaceSvg + CardBackSvg (presentational)

Parametric SVG renderers — one for any face, one for the back.

**Files:**
- Create: `src/apps/solitaire/cards/CardFaceSvg.tsx`
- Create: `src/apps/solitaire/cards/CardBackSvg.tsx`

- [ ] **Step 1: Implement CardFaceSvg**

`src/apps/solitaire/cards/CardFaceSvg.tsx`:
```tsx
import type { Suit, Rank } from '../engine';

const SUIT_PATHS: Record<Suit, string> = {
  spades:   'M50 10 C 30 35, 10 50, 25 65 C 35 75, 50 65, 50 60 L 50 60 C 50 65, 65 75, 75 65 C 90 50, 70 35, 50 10 Z M40 70 L 60 70 L 55 85 L 45 85 Z',
  hearts:   'M50 85 C 20 60, 10 35, 30 25 C 40 20, 48 25, 50 35 C 52 25, 60 20, 70 25 C 90 35, 80 60, 50 85 Z',
  clubs:    'M50 10 A 14 14 0 1 1 49 38 A 14 14 0 1 1 36 55 A 14 14 0 1 1 64 55 A 14 14 0 1 1 51 38 A 14 14 0 1 1 50 10 Z M40 70 L 60 70 L 55 85 L 45 85 Z',
  diamonds: 'M50 8 L 85 50 L 50 92 L 15 50 Z',
};

const SUIT_COLOR: Record<Suit, string> = {
  spades: '#000', clubs: '#000', hearts: '#c00', diamonds: '#c00',
};

const RANK_LABEL: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

const PIP_LAYOUTS: Partial<Record<Rank, [number, number][]>> = {
  2: [[50, 22], [50, 78]],
  3: [[50, 22], [50, 50], [50, 78]],
  4: [[30, 25], [70, 25], [30, 75], [70, 75]],
  5: [[30, 25], [70, 25], [50, 50], [30, 75], [70, 75]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
  7: [[30, 20], [70, 20], [50, 33], [30, 50], [70, 50], [30, 80], [70, 80]],
  8: [[30, 20], [70, 20], [50, 33], [30, 50], [70, 50], [50, 67], [30, 80], [70, 80]],
  9: [[30, 20], [70, 20], [30, 38], [70, 38], [50, 50], [30, 62], [70, 62], [30, 80], [70, 80]],
  10: [[30, 20], [70, 20], [30, 35], [70, 35], [30, 50], [70, 50], [30, 65], [70, 65], [30, 80], [70, 80]],
};

const COURT_LABEL: Partial<Record<Rank, string>> = { 11: 'J', 12: 'Q', 13: 'K' };

type Props = { suit: Suit; rank: Rank };

export default function CardFaceSvg({ suit, rank }: Props): React.ReactElement {
  const color = SUIT_COLOR[suit];
  const label = RANK_LABEL[rank];
  const isCourt = rank >= 11;
  const isAce = rank === 1;
  return (
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" className="card-face">
      <rect width="100" height="140" rx="6" ry="6" fill="#fff" stroke="#000" strokeWidth="1" />
      {/* Top-left corner */}
      <text x="6" y="20" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
      <svg x="4" y="22" width="14" height="14" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      {/* Bottom-right corner mirrored */}
      <g transform="translate(94 134) rotate(180)">
        <text x="0" y="14" fontFamily="Arial Black, Arial, sans-serif" fontSize="16" fontWeight="bold" fill={color}>{label}</text>
        <svg x="-2" y="16" width="14" height="14" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      </g>
      {/* Body */}
      {isAce && (
        <svg x="30" y="50" width="40" height="40" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      )}
      {!isAce && !isCourt && PIP_LAYOUTS[rank]?.map(([x, y], i) => (
        <svg key={i} x={x - 8} y={y * 1.4 - 10 + 10} width="16" height="16" viewBox="0 0 100 100"><path d={SUIT_PATHS[suit]} fill={color} /></svg>
      ))}
      {isCourt && (
        <g>
          <rect x="20" y="35" width="60" height="70" fill="#fff" stroke={color} strokeWidth="2" />
          <text x="50" y="80" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="40" fontWeight="bold" fill={color}>
            {COURT_LABEL[rank]}
          </text>
        </g>
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Implement CardBackSvg**

`src/apps/solitaire/cards/CardBackSvg.tsx`:
```tsx
export default function CardBackSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" className="card-back">
      <rect width="100" height="140" rx="6" ry="6" fill="#3a4ad6" stroke="#000" strokeWidth="1" />
      <rect x="4" y="4" width="92" height="132" rx="4" ry="4" fill="none" stroke="#fff" strokeWidth="1" />
      <g stroke="#fff" strokeWidth="0.6" opacity="0.6">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="6" y1={10 + i * 11} x2="94" y2={10 + i * 11} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v${i}`} x1={10 + i * 11} y1="6" x2={10 + i * 11} y2="134" />
        ))}
      </g>
    </svg>
  );
}
```

- [ ] **Step 3: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add src/apps/solitaire/cards
git commit -m "feat(solitaire): SVG card face + back renderers"
```

---

### Task 11: Card component (presentational, no drag yet)

A single card view that picks face or back based on `card.faceUp`.

**Files:**
- Create: `src/apps/solitaire/components/Card.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Implement Card**

`src/apps/solitaire/components/Card.tsx`:
```tsx
import type { Card as CardModel } from '../engine';
import CardFaceSvg from '../cards/CardFaceSvg';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  card: CardModel;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dimmed?: boolean;
  style?: React.CSSProperties;
};

export default function Card({ card, onPointerDown, onDoubleClick, onContextMenu, dimmed, style }: Props): React.ReactElement {
  return (
    <div
      className={`sol-card${dimmed ? ' sol-card-dimmed' : ''}`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      style={style}
      data-card-id={card.id}
    >
      {card.faceUp ? <CardFaceSvg suit={card.suit} rank={card.rank} /> : <CardBackSvg />}
    </div>
  );
}
```

- [ ] **Step 2: Add card CSS**

Append to `src/apps/solitaire/solitaire.css`:
```css
.sol-card {
  width: 71px;
  height: 96px;
  user-select: none;
  cursor: default;
}
.sol-card svg { width: 100%; height: 100%; display: block; }
.sol-card-dimmed { opacity: 0.55; }
```

- [ ] **Step 3: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "feat(solitaire): Card presentational component"
```

---

### Task 12: Pile components (Stock, Waste, Foundation, Tableau)

Each pile renders its slice of state and dispatches click actions.

**Files:**
- Create: `src/apps/solitaire/components/Pile.tsx`
- Create: `src/apps/solitaire/components/Stock.tsx`
- Create: `src/apps/solitaire/components/Waste.tsx`
- Create: `src/apps/solitaire/components/Foundation.tsx`
- Create: `src/apps/solitaire/components/Tableau.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Implement Pile (empty placeholder)**

`src/apps/solitaire/components/Pile.tsx`:
```tsx
type Props = {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
};

export default function Pile({ className, onClick, children }: Props): React.ReactElement {
  return (
    <div className={`sol-pile${className ? ' ' + className : ''}`} onClick={onClick}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Implement Stock**

`src/apps/solitaire/components/Stock.tsx`:
```tsx
import type { Card as CardModel, Options } from '../engine';
import Pile from './Pile';
import CardBackSvg from '../cards/CardBackSvg';

type Props = {
  cards: CardModel[];
  recyclesUsed: number;
  options: Options;
  onClick: () => void;
};

function recycleExhausted(options: Options, recyclesUsed: number): boolean {
  if (options.scoring !== 'vegas') return false;
  return options.draw === 1 ? recyclesUsed >= 1 : recyclesUsed >= 3;
}

export default function Stock({ cards, recyclesUsed, options, onClick }: Props): React.ReactElement {
  const empty = cards.length === 0;
  const exhausted = empty && recycleExhausted(options, recyclesUsed);
  return (
    <Pile className="sol-stock" onClick={onClick}>
      {!empty && <CardBackSvg />}
      {empty && !exhausted && <div className="sol-stock-recycle">↻</div>}
      {exhausted && <div className="sol-stock-no-recycle">⊘</div>}
    </Pile>
  );
}
```

- [ ] **Step 3: Implement Waste**

`src/apps/solitaire/components/Waste.tsx`:
```tsx
import type { Card as CardModel } from '../engine';
import Pile from './Pile';
import Card from './Card';

type Props = {
  cards: CardModel[];
  draw: 1 | 3;
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownTop: (e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Waste({ cards, draw, outlineDragging, isDragSource, onPointerDownTop, onDoubleClickTop }: Props): React.ReactElement {
  const visible = draw === 1 ? cards.slice(-1) : cards.slice(-3);
  return (
    <Pile className="sol-waste">
      {visible.map((c, i) => {
        const isTop = i === visible.length - 1;
        return (
          <Card
            key={c.id}
            card={c}
            style={{ position: 'absolute', left: i * 14, top: 0 }}
            onPointerDown={isTop ? onPointerDownTop : undefined}
            onDoubleClick={isTop ? onDoubleClickTop : undefined}
            dimmed={isDragSource(c.id) && outlineDragging}
          />
        );
      })}
    </Pile>
  );
}
```

- [ ] **Step 4: Implement Foundation**

`src/apps/solitaire/components/Foundation.tsx`:
```tsx
import type { Card as CardModel, Suit } from '../engine';
import Pile from './Pile';
import Card from './Card';

const SUIT_OUTLINE: Record<Suit, string> = {
  spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦',
};

type Props = {
  suit: Suit;
  cards: CardModel[];
  onPointerDownTop: (e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Foundation({ suit, cards, onPointerDownTop, onDoubleClickTop }: Props): React.ReactElement {
  const top = cards[cards.length - 1];
  return (
    <Pile className="sol-foundation">
      {!top && <div className={`sol-foundation-outline sol-foundation-${suit}`}>{SUIT_OUTLINE[suit]}</div>}
      {top && (
        <Card
          card={top}
          onPointerDown={onPointerDownTop}
          onDoubleClick={onDoubleClickTop}
          style={{ position: 'absolute', left: 0, top: 0 }}
        />
      )}
    </Pile>
  );
}
```

- [ ] **Step 5: Implement Tableau**

`src/apps/solitaire/components/Tableau.tsx`:
```tsx
import type { Card as CardModel } from '../engine';
import Card from './Card';

const FACE_DOWN_OFFSET = 4;
const FACE_UP_OFFSET = 22;

type Props = {
  cards: CardModel[];
  outlineDragging: boolean;
  isDragSource: (cardId: string) => boolean;
  onPointerDownAt: (idx: number, e: React.PointerEvent) => void;
  onDoubleClickTop: (e: React.MouseEvent) => void;
};

export default function Tableau({ cards, outlineDragging, isDragSource, onPointerDownAt, onDoubleClickTop }: Props): React.ReactElement {
  let y = 0;
  return (
    <div className="sol-tableau">
      {cards.map((c, i) => {
        const top = i === cards.length - 1;
        const offset = i === 0 ? 0 : (cards[i - 1].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET);
        y += offset;
        const dim = isDragSource(c.id) && outlineDragging;
        return (
          <Card
            key={c.id}
            card={c}
            style={{ position: 'absolute', top: y, left: 0 }}
            onPointerDown={c.faceUp ? (e) => onPointerDownAt(i, e) : undefined}
            onDoubleClick={top ? onDoubleClickTop : undefined}
            dimmed={dim}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Add pile CSS**

Append to `solitaire.css`:
```css
.sol-pile {
  width: 71px;
  height: 96px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 6px;
  box-sizing: border-box;
}
.sol-stock-recycle, .sol-stock-no-recycle {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 28px; opacity: 0.6;
}
.sol-stock-no-recycle { color: #f66; }
.sol-foundation-outline {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; opacity: 0.4;
}
.sol-foundation-hearts, .sol-foundation-diamonds { color: #c00; }
.sol-foundation-spades, .sol-foundation-clubs { color: #000; }
.sol-tableau {
  position: relative;
  width: 71px;
  min-height: 96px;
}
.sol-waste { position: relative; }
```

- [ ] **Step 7: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 8: Commit**

```bash
git add -u
git commit -m "feat(solitaire): pile components (stock/waste/foundation/tableau)"
```

---

### Task 13: Layout + StatusBar + menu bar — wire reducer into UI

Replace the stub component with the full layout. No drag yet — clicks only on stock + double-click for autoMoveToFoundation.

**Files:**
- Modify: `src/apps/solitaire/index.tsx`
- Create: `src/apps/solitaire/components/StatusBar.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Implement StatusBar**

`src/apps/solitaire/components/StatusBar.tsx`:
```tsx
type Props = { score: number; elapsedSec: number; showScore: boolean };

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function StatusBar({ score, elapsedSec, showScore }: Props): React.ReactElement {
  return (
    <div className="sol-status">
      {showScore && <span className="sol-status-score">Score: {score}</span>}
      <span className="sol-status-time">Time: {fmt(elapsedSec)}</span>
    </div>
  );
}
```

- [ ] **Step 2: Replace `index.tsx` with full wiring**

`src/apps/solitaire/index.tsx`:
```tsx
import { useEffect, useReducer, useState, useRef } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { reducer, deal, type Action, type GameState, type Suit } from './engine';
import { makeRng } from './rng';
import { loadOptions, saveOptions } from './options';
import Stock from './components/Stock';
import Waste from './components/Waste';
import Foundation from './components/Foundation';
import Tableau from './components/Tableau';
import StatusBar from './components/StatusBar';
import './solitaire.css';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

function init(): GameState {
  const opts = loadOptions();
  return deal(makeRng((Math.random() * 0x7fffffff) | 0), opts);
}

export default function Solitaire({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const isDragSource = (_cardId: string): boolean => false;

  useEffect(() => { saveOptions(state.options); }, [state.options]);

  // Timer.
  useEffect(() => {
    if (state.phase !== 'playing' || !state.options.timed) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, state.options.timed]);

  const elapsedSec = Math.floor(state.elapsedMs / 1000);

  return (
    <div className="sol-root" onClick={() => setOpenMenu(null)}>
      <div className="sol-menubar">
        <div className={`sol-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>Deal&nbsp;&nbsp;&nbsp;F2</div>
              <div className="sep" />
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
        <div className={`sol-menu${openMenu === 'help' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}>
          Help
          {openMenu === 'help' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item disabled">About Solitaire</div>
            </div>
          )}
        </div>
      </div>

      <div className="sol-felt">
        <div className="sol-top-row">
          <div className="sol-top-left">
            <Stock cards={state.piles.stock} recyclesUsed={state.recyclesUsed} options={state.options} onClick={() => dispatch({ type: 'drawFromStock' })} />
            <Waste
              cards={state.piles.waste}
              draw={state.options.draw}
              outlineDragging={state.options.outlineDragging}
              isDragSource={isDragSource}
              onPointerDownTop={() => { /* drag wired in next task */ }}
              onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: 'waste' })}
            />
          </div>
          <div className="sol-top-right">
            {SUITS.map((s) => (
              <Foundation
                key={s}
                suit={s}
                cards={state.piles[`foundation-${s}` as const]}
                onPointerDownTop={() => { /* drag wired in next task */ }}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `foundation-${s}` as const })}
              />
            ))}
          </div>
        </div>
        <div className="sol-tableau-row">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Tableau
              key={i}
              cards={state.piles[`tableau-${i}` as const]}
              outlineDragging={state.options.outlineDragging}
              isDragSource={isDragSource}
              onPointerDownAt={() => { /* drag wired in next task */ }}
              onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `tableau-${i}` as const })}
            />
          ))}
        </div>
      </div>

      {state.options.statusBar && (
        <StatusBar score={state.score} elapsedSec={elapsedSec} showScore={state.options.scoring !== 'none'} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add layout CSS**

Append to `solitaire.css`:
```css
.sol-menubar {
  display: flex;
  background: #c0c0c0;
  border-bottom: 1px solid #808080;
  font-size: 11px;
  padding: 2px 4px;
  user-select: none;
}
.sol-menu { padding: 2px 8px; cursor: default; position: relative; }
.sol-menu.open { background: #000080; color: #fff; }
.sol-menu-popup {
  position: absolute; top: 100%; left: 0;
  background: #c0c0c0; color: #000;
  border: 1px solid #fff;
  box-shadow: inset -1px -1px 0 #000, inset 1px 1px 0 #dfdfdf, 1px 1px 0 #000;
  padding: 2px 0;
  min-width: 140px;
  z-index: 10;
}
.sol-menu-popup .item { padding: 3px 18px; cursor: default; }
.sol-menu-popup .item:hover { background: #000080; color: #fff; }
.sol-menu-popup .item.disabled { color: #808080; }
.sol-menu-popup .item.disabled:hover { background: transparent; color: #808080; }
.sol-menu-popup .sep { height: 1px; background: #808080; margin: 2px 0; box-shadow: 0 1px 0 #fff; }

.sol-top-row {
  display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px;
}
.sol-top-left, .sol-top-right { display: flex; gap: 12px; }
.sol-tableau-row { display: flex; gap: 12px; }

.sol-status {
  display: flex; justify-content: space-between;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  box-shadow: inset 0 1px 0 #808080;
  padding: 2px 6px;
  font-size: 11px;
  color: #000;
}
```

- [ ] **Step 4: Manual smoke**

Run: `npm run dev` and open Solitaire.
Expected: see 7 tableau columns dealt, 24 stock cards, foundations and waste empty. Click stock to draw. Double-click an Ace on top of waste/tableau to send it to foundation.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): full layout + menu + status bar + reducer wiring"
```

---

### Task 14: Drag-and-drop with pointer events

Implement the heart of the UX. Pointer events because they unify mouse + touch + pen.

**Files:**
- Modify: `src/apps/solitaire/index.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Add drag state + handlers**

In `src/apps/solitaire/index.tsx`, replace the body of the component with full drag wiring:

```tsx
export default function Solitaire({ api }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragMetaRef = useRef<{ from: PileId; fromIdx: number } | null>(null);

  useEffect(() => { saveOptions(state.options); }, [state.options]);

  useEffect(() => {
    if (state.phase !== 'playing' || !state.options.timed) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, state.options.timed]);

  const isDragSource = (cardId: string): boolean => {
    if (!state.drag) return false;
    return state.drag.cards.some((c) => c.id === cardId);
  };

  const startDrag = (from: PileId, fromIdx: number, e: React.PointerEvent): void => {
    if (state.phase !== 'playing') return;
    const src = state.piles[from];
    const cards = src.slice(fromIdx);
    if (cards.length === 0 || !cards[0].faceUp) return;
    if (!isValidRunInline(cards)) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragMetaRef.current = { from, fromIdx };
    dispatch({ type: 'pickUpDrag', from, cards, pointerOffset: offset });
    setDragPos({ x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    if (!state.drag) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent): void => {
    if (!state.drag || !dragMetaRef.current) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const pileEl = target?.closest('[data-pile-id]') as HTMLElement | null;
    const dropPile = pileEl?.dataset.pileId as PileId | undefined;
    const meta = dragMetaRef.current;
    if (dropPile) {
      dispatch({ type: 'tryMove', from: meta.from, fromIdx: meta.fromIdx, to: dropPile });
    }
    dispatch({ type: 'cancelDrag' });
    dragMetaRef.current = null;
    setDragPos(null);
  };

  const elapsedSec = Math.floor(state.elapsedMs / 1000);

  return (
    <div
      className="sol-root"
      onClick={() => setOpenMenu(null)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="sol-menubar">
        <div className={`sol-menu${openMenu === 'game' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'game' ? null : 'game'); }}>
          Game
          {openMenu === 'game' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item" onClick={() => { dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>Deal&nbsp;&nbsp;&nbsp;F2</div>
              <div className="sep" />
              <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;&nbsp;Ctrl+Z</div>
              <div className="sep" />
              <div className="item" onClick={() => api.requestClose()}>Exit</div>
            </div>
          )}
        </div>
        <div className={`sol-menu${openMenu === 'help' ? ' open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}>
          Help
          {openMenu === 'help' && (
            <div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
              <div className="item disabled">About Solitaire</div>
            </div>
          )}
        </div>
      </div>

      <div className="sol-felt">
        <div className="sol-top-row">
          <div className="sol-top-left">
            <div data-pile-id="stock">
              <Stock cards={state.piles.stock} recyclesUsed={state.recyclesUsed} options={state.options} onClick={() => dispatch({ type: 'drawFromStock' })} />
            </div>
            <div data-pile-id="waste">
              <Waste
                cards={state.piles.waste}
                draw={state.options.draw}
                outlineDragging={state.options.outlineDragging}
                isDragSource={isDragSource}
                onPointerDownTop={(e) => startDrag('waste', state.piles.waste.length - 1, e)}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: 'waste' })}
              />
            </div>
          </div>
          <div className="sol-top-right">
            {SUITS.map((s) => (
              <div key={s} data-pile-id={`foundation-${s}`}>
                <Foundation
                  suit={s}
                  cards={state.piles[`foundation-${s}` as const]}
                  onPointerDownTop={(e) => startDrag(`foundation-${s}` as PileId, state.piles[`foundation-${s}` as const].length - 1, e)}
                  onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `foundation-${s}` as const })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="sol-tableau-row">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} data-pile-id={`tableau-${i}`}>
              <Tableau
                cards={state.piles[`tableau-${i}` as const]}
                outlineDragging={state.options.outlineDragging}
                isDragSource={isDragSource}
                onPointerDownAt={(idx, e) => startDrag(`tableau-${i}` as PileId, idx, e)}
                onDoubleClickTop={() => dispatch({ type: 'autoMoveToFoundation', from: `tableau-${i}` as const })}
              />
            </div>
          ))}
        </div>
      </div>

      {state.drag && dragPos && (
        <div
          ref={dragRef}
          className="sol-drag-layer"
          style={{ left: dragPos.x - state.drag.pointerOffset.x, top: dragPos.y - state.drag.pointerOffset.y }}
        >
          {state.drag.cards.map((c, i) => (
            <div key={c.id} className="sol-card" style={{ position: 'absolute', top: i * 22, left: 0 }}>
              <CardFaceSvg suit={c.suit} rank={c.rank} />
            </div>
          ))}
        </div>
      )}

      {state.options.statusBar && (
        <StatusBar score={state.score} elapsedSec={elapsedSec} showScore={state.options.scoring !== 'none'} />
      )}
    </div>
  );
}

function isValidRunInline(cards: import('./engine').Card[]): boolean {
  // Mirrors engine's isValidRun for early bail-out before dispatching pickUpDrag.
  if (cards.length === 0 || !cards.every((c) => c.faceUp)) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i], b = cards[i + 1];
    if (a.rank !== b.rank + 1) return false;
    const aRed = a.suit === 'hearts' || a.suit === 'diamonds';
    const bRed = b.suit === 'hearts' || b.suit === 'diamonds';
    if (aRed === bRed) return false;
  }
  return true;
}
```

Add the missing imports at the top of `index.tsx`:
```ts
import type { PileId } from './engine';
import CardFaceSvg from './cards/CardFaceSvg';
```

Keep the `import { reducer, deal, type Action, type GameState, type Suit } from './engine';` and merge the new types in.

- [ ] **Step 2: Add drag-layer CSS**

Append to `solitaire.css`:
```css
.sol-drag-layer {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  width: 71px;
  height: 96px;
}
.sol-pile, .sol-tableau { /* keep above */ }
```

- [ ] **Step 3: Manual test**

Run: `npm run dev`. Drag a single tableau card to another tableau column. Drag an Ace from waste to a foundation. Drag a multi-card run.
Expected: drag layer follows pointer; drop on legal target moves the card(s); illegal drop just clears the drag.

- [ ] **Step 4: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): pointer-based drag + drop"
```

---

### Task 15: Right-click auto-finish + Ctrl+Z + F2 hotkeys

Hook up the remaining input affordances.

**Files:**
- Modify: `src/apps/solitaire/index.tsx`

- [ ] **Step 1: Add hotkey + right-click wiring**

In `index.tsx`, import the hooks helper:
```ts
import { useHotkeys } from '@/lib/useHotkeys';
import { useWindowStore } from '@/stores/windowStore';
```

Inside the component, add:
```ts
const focused = useWindowStore((s) => s.focusedId === api.windowId);

useHotkeys(
  {
    'f2': () => dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }),
    'mod+z': () => dispatch({ type: 'undo' }),
  },
  { enabled: focused },
);
```

On the root div, add an `onContextMenu` handler:
```tsx
<div
  className="sol-root"
  onClick={() => setOpenMenu(null)}
  onPointerMove={onPointerMove}
  onPointerUp={onPointerUp}
  onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'autoFinish' }); }}
>
```

- [ ] **Step 2: Manual test**

Run: `npm run dev`. Press F2 → new deal. Press Ctrl+Z after a move → undo. Right-click anywhere on the felt with no face-down cards remaining → auto-finish runs to win.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat(solitaire): F2 deal + Ctrl+Z undo + right-click auto-finish"
```

---

### Task 16: OptionsDialog + Statistics dialog

Game → Options modal and Game → Statistics modal.

**Files:**
- Create: `src/apps/solitaire/components/OptionsDialog.tsx`
- Create: `src/apps/solitaire/components/StatisticsDialog.tsx`
- Modify: `src/apps/solitaire/index.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Implement OptionsDialog**

`src/apps/solitaire/components/OptionsDialog.tsx`:
```tsx
import { useState } from 'react';
import type { Options } from '../engine';

type Props = {
  initial: Options;
  onCancel: () => void;
  onOk: (next: Options) => void;
};

export default function OptionsDialog({ initial, onCancel, onOk }: Props): React.ReactElement {
  const [o, setO] = useState<Options>(initial);
  return (
    <div className="sol-dialog-overlay" onClick={onCancel}>
      <div className="sol-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Options</div></div>
        <div className="window-body sol-dialog-body">
          <fieldset>
            <legend>Draw</legend>
            <label><input type="radio" name="d" checked={o.draw === 1} onChange={() => setO({ ...o, draw: 1 })} /> Draw one</label>
            <label><input type="radio" name="d" checked={o.draw === 3} onChange={() => setO({ ...o, draw: 3 })} /> Draw three</label>
          </fieldset>
          <fieldset>
            <legend>Scoring</legend>
            <label><input type="radio" name="s" checked={o.scoring === 'standard'} onChange={() => setO({ ...o, scoring: 'standard' })} /> Standard</label>
            <label><input type="radio" name="s" checked={o.scoring === 'vegas'} onChange={() => setO({ ...o, scoring: 'vegas' })} /> Vegas</label>
            <label><input type="radio" name="s" checked={o.scoring === 'none'} onChange={() => setO({ ...o, scoring: 'none' })} /> None</label>
          </fieldset>
          <label><input type="checkbox" checked={o.timed} onChange={(e) => setO({ ...o, timed: e.target.checked })} /> Timed game</label>
          <label><input type="checkbox" checked={o.statusBar} onChange={(e) => setO({ ...o, statusBar: e.target.checked })} /> Status bar</label>
          <label><input type="checkbox" checked={o.outlineDragging} onChange={(e) => setO({ ...o, outlineDragging: e.target.checked })} /> Outline dragging</label>
          <label><input type="checkbox" checked={o.vegasKeepScore} onChange={(e) => setO({ ...o, vegasKeepScore: e.target.checked })} disabled={o.scoring !== 'vegas'} /> Keep score (Vegas)</label>
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={() => onOk(o)}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement StatisticsDialog**

`src/apps/solitaire/components/StatisticsDialog.tsx`:
```tsx
import { loadVegasBalance } from '../options';
import { loadBestTime } from '../bestTimes';

type Props = { onClose: () => void };

export default function StatisticsDialog({ onClose }: Props): React.ReactElement {
  const balance = loadVegasBalance();
  const best = loadBestTime();
  return (
    <div className="sol-dialog-overlay" onClick={onClose}>
      <div className="sol-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">Statistics</div></div>
        <div className="window-body sol-dialog-body">
          <p>Vegas running balance: ${balance}</p>
          <p>Best time (Standard, timed): {best ? `${best.seconds}s — ${best.name}` : 'None'}</p>
        </div>
        <div className="sol-dialog-buttons">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add menu items + state to index.tsx**

In `index.tsx`, add at the top of the component:
```ts
const [optionsOpen, setOptionsOpen] = useState(false);
const [statsOpen, setStatsOpen] = useState(false);
```

In the Game menu, replace the popup JSX with this fuller version:
```tsx
<div className="sol-menu-popup" onClick={(e) => e.stopPropagation()}>
  <div className="item" onClick={() => { dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) }); setOpenMenu(null); }}>Deal&nbsp;&nbsp;&nbsp;F2</div>
  <div className="item" onClick={() => { dispatch({ type: 'undo' }); setOpenMenu(null); }}>Undo&nbsp;&nbsp;&nbsp;Ctrl+Z</div>
  <div className="sep" />
  <div className="item" onClick={() => { setOptionsOpen(true); setOpenMenu(null); }}>Options...</div>
  <div className="item" onClick={() => { setStatsOpen(true); setOpenMenu(null); }}>Statistics...</div>
  <div className="sep" />
  <div className="item" onClick={() => api.requestClose()}>Exit</div>
</div>
```

At the end of the JSX (just before the closing `</div>` of the root), render the dialogs:
```tsx
{optionsOpen && (
  <OptionsDialog
    initial={state.options}
    onCancel={() => setOptionsOpen(false)}
    onOk={(next) => { dispatch({ type: 'setOptions', options: next }); setOptionsOpen(false); }}
  />
)}
{statsOpen && <StatisticsDialog onClose={() => setStatsOpen(false)} />}
```

Add the imports:
```ts
import OptionsDialog from './components/OptionsDialog';
import StatisticsDialog from './components/StatisticsDialog';
```

- [ ] **Step 4: Add dialog CSS**

Append to `solitaire.css`:
```css
.sol-dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
}
.sol-dialog { min-width: 280px; }
.sol-dialog-body {
  display: flex; flex-direction: column; gap: 6px; padding: 12px;
}
.sol-dialog-body fieldset { border: 1px solid #808080; box-shadow: 1px 1px 0 #fff inset; padding: 6px 10px; }
.sol-dialog-body legend { padding: 0 4px; }
.sol-dialog-body label { display: flex; align-items: center; gap: 6px; }
.sol-dialog-buttons {
  display: flex; justify-content: flex-end; gap: 6px; padding: 8px 12px; border-top: 1px solid #808080;
}
.sol-dialog-buttons button { min-width: 75px; }
```

- [ ] **Step 5: Type check + manual smoke**

Run: `npm run build` then `npm run dev`. Open Game → Options, change Draw to 3, hit OK, deal new game.
Expected: waste fans 3 cards on click. Game → Statistics shows Vegas balance + best time placeholders.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "feat(solitaire): Options + Statistics dialogs"
```

---

### Task 17: Win cascade animation

Canvas overlay scoped to the solitaire root. Bouncing cards from foundations leaving rainbow trails. Click anywhere skips.

**Files:**
- Create: `src/apps/solitaire/components/WinCascade.tsx`
- Modify: `src/apps/solitaire/index.tsx`
- Modify: `src/apps/solitaire/solitaire.css`

- [ ] **Step 1: Implement WinCascade**

`src/apps/solitaire/components/WinCascade.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import type { Suit } from '../engine';

type Props = { onSkip: () => void };

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
const COLORS: Record<Suit, string> = {
  spades: '#000', clubs: '#000', hearts: '#c00', diamonds: '#c00',
};

type Particle = {
  suit: Suit;
  rank: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number; hue: number }[];
};

export default function WinCascade({ onSkip }: Props): React.ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d')!;

    const particles: Particle[] = [];
    let rafId = 0;
    let stopped = false;
    let hue = 0;
    let nextSpawn = 0;
    let spawnIdx = 0;

    const spawn = (): void => {
      const suit = SUITS[spawnIdx % 4];
      const rank = (spawnIdx % 13) + 1;
      const startX = canvas.width - 60 - (spawnIdx % 4) * 80;
      particles.push({
        suit, rank,
        x: startX, y: 50,
        vx: -2 - Math.random() * 4,
        vy: 0,
        trail: [],
      });
      spawnIdx++;
    };

    const tick = (t: number): void => {
      if (stopped) return;
      ctx.fillStyle = 'rgba(0,128,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (t > nextSpawn && spawnIdx < 52) {
        spawn();
        nextSpawn = t + 250;
      }
      hue = (hue + 4) % 360;
      for (const p of particles) {
        p.vy += 0.4;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > canvas.height - 96) {
          p.y = canvas.height - 96;
          p.vy = -p.vy * 0.85;
        }
        p.trail.push({ x: p.x + 35, y: p.y + 48, hue });
        if (p.trail.length > 30) p.trail.shift();
        for (let i = 0; i < p.trail.length; i++) {
          const tr = p.trail[i];
          ctx.fillStyle = `hsla(${tr.hue}, 90%, 60%, ${i / p.trail.length})`;
          ctx.fillRect(tr.x, tr.y, 3, 3);
        }
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, 71, 96);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(p.x, p.y, 71, 96);
        ctx.fillStyle = COLORS[p.suit];
        ctx.font = 'bold 16px Arial';
        const label = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'][p.rank - 1];
        ctx.fillText(label, p.x + 6, p.y + 20);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onClick = (): void => { stopped = true; cancelAnimationFrame(rafId); onSkip(); };
    canvas.addEventListener('click', onClick);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onClick);
    };
  }, [onSkip]);

  return <canvas ref={ref} className="sol-cascade" />;
}
```

- [ ] **Step 2: Wire cascade into index.tsx**

In `index.tsx`, add:
```ts
import WinCascade from './components/WinCascade';
```

After the timer effect, add:
```ts
useEffect(() => {
  if (state.phase !== 'won') return;
  const id = window.setTimeout(() => {
    // Phase will only be 'won' here if user hasn't acknowledged.
    // We rely on a synthetic action to enter cascading phase via setOptions hack? No — add direct phase set.
  }, 500);
  return () => window.clearTimeout(id);
}, [state.phase]);
```

Wait — the engine doesn't expose a "set phase to cascading" action. Add one. In `engine.ts`:
```ts
// Add to Action type:
| { type: 'setPhase'; phase: Phase }

// And in reducer:
case 'setPhase': return { ...s, phase: a.phase };
```

Then the effect becomes:
```ts
useEffect(() => {
  if (state.phase !== 'won') return;
  const id = window.setTimeout(() => dispatch({ type: 'setPhase', phase: 'cascading' }), 500);
  return () => window.clearTimeout(id);
}, [state.phase]);
```

Render the cascade conditionally inside the felt:
```tsx
{state.phase === 'cascading' && (
  <WinCascade onSkip={() => dispatch({ type: 'deal', rng: makeRng((Math.random() * 0x7fffffff) | 0) })} />
)}
```

- [ ] **Step 3: Add cascade CSS**

Append to `solitaire.css`:
```css
.sol-cascade {
  position: absolute; inset: 0;
  z-index: 100;
  cursor: pointer;
}
.sol-felt { position: relative; }
```

- [ ] **Step 4: Manual test**

Hard to test naturally without winning, so add a temporary debug shortcut: in the Game menu, add a hidden "Win" item that synthesizes a pre-won state. Or just inspect by setting `phase` to `'cascading'` in the React DevTools.

For confidence, manually run in dev and verify the cascade renders for at least ~5s when triggered.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): win cascade canvas animation"
```

---

### Task 18: Best-time prompt on win

When the player wins a Standard timed game, prompt for their name if they beat the best time.

**Files:**
- Modify: `src/apps/solitaire/index.tsx`

- [ ] **Step 1: Add win-handler effect**

In `index.tsx`, import:
```ts
import { sysPrompt } from '@/lib/dialog';
import { saveIfBest, loadBestTime } from './bestTimes';
import { saveVegasBalance, loadVegasBalance } from './options';
import { timeBonus } from './engine';
```

Add a ref and effect:
```ts
const wonHandledRef = useRef(false);

useEffect(() => {
  if (state.phase !== 'won') {
    wonHandledRef.current = false;
    return;
  }
  if (wonHandledRef.current) return;
  wonHandledRef.current = true;

  // Vegas keep-score balance carry.
  if (state.options.scoring === 'vegas' && state.options.vegasKeepScore) {
    saveVegasBalance(loadVegasBalance() + state.score);
  }

  // Best time prompt for Standard timed wins only.
  if (state.options.scoring !== 'standard' || !state.options.timed) return;
  const seconds = Math.floor(state.elapsedMs / 1000);
  if (seconds < 30) return;
  const best = loadBestTime();
  if (best && seconds >= best.seconds) return;
  void sysPrompt('You have a new best time. Please enter your name.', 'Anonymous', { title: 'Solitaire Best Time' })
    .then((name) => {
      if (name === null) return;
      saveIfBest(seconds, name || 'Anonymous');
    });
}, [state.phase, state.elapsedMs, state.options, state.score]);
```

- [ ] **Step 2: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat(solitaire): best-time prompt + vegas balance carry on win"
```

---

### Task 19: Session persistence (registerSnapshot + restore)

Plug solitaire into the existing window-persistence API.

**Files:**
- Modify: `src/apps/solitaire/index.tsx`
- Modify: `src/apps/solitaire/engine.ts` (export type guard)

- [ ] **Step 1: Add type guard for restored snapshot**

Append to `engine.ts`:
```ts
export type SolitaireSnapshot = {
  piles: GameState['piles'];
  options: Options;
  score: number;
  vegasBalance: number;
  startedAt: null;
  elapsedMs: number;
  recyclesUsed: number;
  phase: 'idle' | 'playing';
};

export function isValidSolitaireSnapshot(v: unknown): v is SolitaireSnapshot {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  if (typeof s.score !== 'number' || typeof s.elapsedMs !== 'number' || typeof s.recyclesUsed !== 'number') return false;
  if (s.phase !== 'idle' && s.phase !== 'playing') return false;
  if (!s.piles || typeof s.piles !== 'object') return false;
  for (const p of ALL_PILES) {
    if (!Array.isArray((s.piles as Record<string, unknown>)[p])) return false;
  }
  return true;
}
```

- [ ] **Step 2: Update init() and registerSnapshot wiring in index.tsx**

Replace the `init()` function with one that takes restoreState:
```ts
function initFrom(restored: unknown, fallbackOptions: Options): GameState {
  if (isValidSolitaireSnapshot(restored)) {
    const opts = restored.options;
    const startedAt = restored.phase === 'playing' && opts.timed ? Date.now() - restored.elapsedMs : null;
    return {
      phase: restored.phase,
      piles: restored.piles,
      options: opts,
      score: restored.score,
      vegasBalance: restored.vegasBalance,
      startedAt,
      elapsedMs: restored.elapsedMs,
      recyclesUsed: restored.recyclesUsed,
      prev: null,
      drag: null,
    };
  }
  return deal(makeRng((Math.random() * 0x7fffffff) | 0), fallbackOptions);
}
```

Update component signature + reducer init:
```tsx
export default function Solitaire({ api, restoreState }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initFrom(restoreState, loadOptions()));
  // ...
```

After other effects, register the snapshot getter:
```ts
useEffect(() => {
  return api.registerSnapshot(() => ({
    piles: state.piles,
    options: state.options,
    score: state.score,
    vegasBalance: state.vegasBalance,
    startedAt: null,
    elapsedMs: state.elapsedMs,
    recyclesUsed: state.recyclesUsed,
    phase: state.phase === 'won' || state.phase === 'cascading' ? 'idle' : state.phase,
  }));
}, [state, api]);
```

Add the import:
```ts
import { isValidSolitaireSnapshot } from './engine';
```

- [ ] **Step 3: Manual test**

Run: `npm run dev`. Open Solitaire, make several moves, refresh the page.
Expected: window reopens with the same piles/score/elapsed time, timer continues running.

- [ ] **Step 4: Type check**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(solitaire): session persistence via registerSnapshot"
```

---

### Task 20: Final polish + integration QA

Pass over the app for sharp edges and verify all spec requirements.

**Files:**
- Modify: any of the above as needed.

- [ ] **Step 1: Run full test suite**

Run: `npm test --run`
Expected: all tests pass (existing minesweeper, session, etc., plus new solitaire tests).

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: builds clean, no TS errors.

- [ ] **Step 3: Manual QA checklist**

Open dev server. Verify:
- [ ] Solitaire icon appears under Start → Programs → Games.
- [ ] Window opens at 700×600, has menu bar (Game | Help) and status bar.
- [ ] Initial deal: 7 columns of 1..7 cards, last card face-up; 24 cards in stock.
- [ ] Click stock → draw 1 card (or 3 in draw-3 mode).
- [ ] Drag tableau card to another tableau (legal red-on-black descending).
- [ ] Drag multi-card run.
- [ ] Drag card to foundation (Ace, then 2, etc).
- [ ] Double-click waste/tableau Ace → moves to foundation.
- [ ] Right-click empty area → auto-finish triggers when no face-down + stock/waste empty.
- [ ] F2 deals new game; Ctrl+Z undoes last move.
- [ ] Game → Options changes draw mode; new deal uses it.
- [ ] Status bar shows score and timer; toggleable from Options.
- [ ] Empty stock + standard mode: clicking shows recycle, score deducts (-100 or -20).
- [ ] Empty stock + Vegas + draw-1: after 1 recycle, "no recycle" icon shows; click does nothing.
- [ ] Refresh mid-game restores piles + timer continues.
- [ ] Reset Computer wipes everything including options + best time.

- [ ] **Step 4: Fix any issues found**

If anything fails the checklist, fix in the relevant file and recommit.

- [ ] **Step 5: Final commit (if needed)**

```bash
git add -u
git commit -m "fix(solitaire): polish from QA pass"
```

- [ ] **Step 6: Merge to master**

After QA passes:
```bash
git checkout master
git merge --no-ff feat/solitaire -m "Merge branch 'feat/solitaire'"
git push origin master
git branch -d feat/solitaire
```
