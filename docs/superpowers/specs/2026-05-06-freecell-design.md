# FreeCell Design

**Goal:** Authentic Win95 FreeCell — 4 free cells, 4 foundations, 8 tableau columns, all cards face-up, deterministic deals matching Microsoft's exact RNG so deal #11982 lines up with the legendary unsolvable layout.

**Architecture:** Pure `engine.ts` (state, reducer, deal, legality, supermove math, win/loss) consumed by a React component using `useReducer`. Auto-cascade is a 100ms-tick effect once the engine declares the position trivially winnable. Persistence reuses `registerSnapshot`. Card components (CardFaceSvg, suitGlyphs) imported from solitaire (no premature extraction).

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (windowStore only). vitest with jsdom. 98.css for chrome only.

---

## 1. Scope

- **Game**: Microsoft FreeCell, classic rules.
- **Layout**: 4 free cells (top-left), 4 foundations (top-right), 8 tableau columns.
- **Deal**: 52 cards face-up. Deterministic by **game number** using Microsoft's exact 16-bit LCG so well-known deals (e.g., #11982 unsolvable) reproduce.
- **Game numbering**: 1 to 32000 inclusive. Selectable via Game → Select Game dialog. F2 starts a new game asking for a number; default = a random number.
- **Move rules**:
  - Single card to free cell, foundation, or tableau (down by alternating color).
  - **Supermove**: dragging a valid descending alternating-color run is allowed when `(freeCells + 1) × 2^emptyTableauCols` ≥ run length. If destination is itself an empty tableau, the empty-tableau count in that formula excludes the destination column.
  - Foundation: by suit, ascending from Ace.
  - Empty tableau column: any single card or supermove sequence may be placed.
- **Auto-cascade**: when the engine determines no card needs to be uncovered to reach the foundation finish (i.e., for every card not yet on a foundation, every card above it on its column / cell can be placed on a foundation in some order), phase becomes `cascading`. The reducer steps once per ~100ms moving the lowest-needed card to its foundation. Click anywhere or hit any key to skip — the rest cascade synchronously.
- **Win**: all 52 cards on foundations → phase `won` → Statistics dialog updates.
- **Loss**: no legal moves remain → phase `lost`. User can undo to recover or start a new game.
- **Stats**: wins / losses / current streak / best streak — Game → Statistics dialog. Persisted in `localStorage`.
- **Window**: fixed 720 × 600, non-resizable.
- **Persistence**: full mid-game state via `registerSnapshot`.

## 2. Microsoft RNG (deal generation)

```
state = (state * 214013 + 2531011) & 0x7FFFFFFF
rand = state >> 16          // bits 16–30 of the new state
```

Initial state = `gameNumber` (the seed; user-supplied).

**Deal procedure** (matches Microsoft's documented FreeCell algorithm):
1. Start with deck in fixed order: Ac, Ad, Ah, As, 2c, 2d, 2h, 2s, ..., Kc, Kd, Kh, Ks. (52 cards.)
2. For `i = 51` down to `1`:
   - `j = nextRand() % (i + 1)`
   - swap deck[i] and deck[j]
3. Place cards into 8 columns row-by-row: column 0 gets index 0, column 1 gets index 1, ..., column 7 gets index 7, column 0 gets index 8, etc., until 52 placed. Result: columns 0–3 hold 7 cards each (28 total), columns 4–7 hold 6 cards each (24 total).

Reference implementations and known deals:
- Deal #1 column 0 (top to bottom): JD, 2D, 9H, JC, 5D, 7H, 7C
- Deal #11982 is one of a small number of layouts proven mathematically unsolvable (per public Solver databases).

`msrng.test.ts` will hard-code Deal #1's column 0 as a regression test; if our RNG diverges by even one swap, that test fails.

## 3. State model

```ts
type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
type Card = { id: string; suit: Suit; rank: Rank };

type CellId = 'cell-0' | 'cell-1' | 'cell-2' | 'cell-3';
type FoundationId =
  | 'foundation-spades' | 'foundation-hearts'
  | 'foundation-clubs' | 'foundation-diamonds';
type TableauId =
  | 'tableau-0' | 'tableau-1' | 'tableau-2' | 'tableau-3'
  | 'tableau-4' | 'tableau-5' | 'tableau-6' | 'tableau-7';
type PileId = CellId | FoundationId | TableauId;

type Phase = 'playing' | 'cascading' | 'won' | 'lost';

type GameState = {
  phase: Phase;
  piles: Record<PileId, Card[]>;
  gameNumber: number;
  startedAt: number | null;
  elapsedMs: number;
  moveCount: number;
  prev: { piles: Record<PileId, Card[]>; moveCount: number } | null;
};
```

State lives in a `useReducer`. Cells max out at 1 card each. Foundations grow Ace→King in their suit. Tableaus fan downward.

**Phase transitions:**
- `playing` → `cascading` when `isAutoCascadable(state)` returns true.
- `cascading` → `won` when foundations total 52.
- `playing` → `lost` when `legalMoves(state)` is empty AND foundations < 52.
- any → `playing` on `newGame`.

**Reducer actions:**
- `tryMove({from, fromIdx, to})` — validates run, supermove capacity; commits if legal.
- `autoMoveToFoundation(from)` — for double-clicks; tries to place top of `from` on its suit foundation.
- `cascadeStep()` — one auto-finish move (called from interval).
- `cascadeSkip()` — apply all remaining cascade moves immediately.
- `undo()` — 1-step.
- `newGame({number})` — re-deal with the given game number.
- `tick({now})` — update `elapsedMs`.

**Helpers (pure, exported from engine):**
- `dealForGameNumber(n: number): GameState` — wraps `msrng.ts` and seat into 8 columns.
- `canStackOnTableau(top, candidate)`, `canStackOnFoundation(top, candidate)`.
- `isValidRun(cards)` — descending alternating colors.
- `supermoveCapacity(state, destIsEmptyCol: boolean)` — `(freeCells + 1) * 2^(emptyTableaus - (destIsEmptyCol ? 1 : 0))`.
- `legalMoves(state)` — enumerates every legal `tryMove`; used for loss detection and AI-level hints.
- `isAutoCascadable(state)` — true when all cards remaining-not-on-foundation can be played to foundations in *some* order without obstruction. Computed by simulation: greedy-foundation-step until either all on foundation (true) or no progress possible (false).

## 4. File layout

**New files:**
```
src/apps/freecell/
  meta.ts                       app registration
  index.tsx                     React component, reducer, persistence, dialogs
  engine.ts                     pure: state, reducer, deal, legality, supermove, win/loss
  engine.test.ts                vitest
  msrng.ts                      Microsoft 16-bit LCG + deck-deal
  msrng.test.ts                 vitest — verify deal #1 layout matches reference
  scores.ts                     wins/losses/streak/best-streak persistence
  scores.test.ts                vitest
  components/
    FreeCellSlot.tsx            single-card free-cell drop target
    Foundation.tsx              4 of these (one per suit) — same UX as Solitaire's
    Tableau.tsx                 fanned column with drag/drop
    SelectGameDialog.tsx        prompt for game number
    StatisticsDialog.tsx        wins/losses/streak/best
    Cascade.tsx                 status-line label "Auto-finishing..." with click-to-skip
  freecell.css
```

**Modified files:**
- `src/core/boot.ts` — register `freecellMeta` after solitaire / hearts.

**App registration:**
```ts
{
  id: 'freecell',
  displayName: 'FreeCell',
  icon: '/assets/win98/png/game_freecell-0.png',
  defaultSize: { width: 720, height: 600 },
  minSize: { width: 720, height: 600 },
  resizable: false,
  singleInstance: true,
  menuPath: ['Programs', 'Games'],
}
```

**Engine isolation:** `engine.ts` and `msrng.ts` are pure. `scores.ts` is the only module touching `localStorage`. Card components are imported from `@/apps/solitaire/cards/`.

## 5. UI / Layout

```
+------------------------------------------------+
|  Game     Help                                 |
+------------------------------------------------+
|  [c0] [c1] [c2] [c3]    [♠] [♥] [♣] [♦]      |  ← top row (4 cells + 4 foundations)
|                                                |
|  [t0] [t1] [t2] [t3] [t4] [t5] [t6] [t7]      |  ← 8 tableau columns (fanned)
|   7    7    7    7    6    6    6    6        |
|                                                |
|                                                |
|                                                |
+------------------------------------------------+
|  Game 11982  Moves: 47  Time: 2:31  [Skip]     |  ← status bar; Skip appears during cascade
+------------------------------------------------+
```

- **Top row**: 4 free-cell slots on the left, gap, 4 foundation slots on the right.
- **Tableau row**: 8 columns at ~80px each (with 2-3px gaps). Fan stride ~22px. Cards always face-up.
- **Drag UX**: identical to Solitaire — pointer-down on a card or run starts drag, drag layer follows pointer (portal to body), drop on a `data-pile-id` target dispatches `tryMove`. Use window-level pointer listeners (lesson learned in Solitaire).
- **Multi-card drag**: when user clicks a non-top tableau card, engine validates the run from that index downward AND the supermove capacity. If both ok, drag picks up the run; if not, drag is single-card only.
- **Right-click anywhere on the felt**: undo last move (Win95-faithful). Differs from Solitaire's right-click auto-finish.
- **Status bar**: game number + move count + timer. During `cascading`, replace right side with a "[Skip]" button.
- **Empty tableau placeholder**: a faint dashed border outline.
- **Empty free-cell placeholder**: same.
- **Empty foundation placeholder**: faint suit glyph (same as Solitaire).

## 6. Animations & timing

- **Card play**: instant (no fly animation; Solitaire pattern).
- **Drag-back-on-illegal**: brief 120ms ease-out from drop position back to source.
- **Auto-cascade**: phase flips to `cascading`. Effect runs `cascadeStep` every 100ms. Each step animates a single card moving to its foundation (~120ms slide). Click anywhere → dispatch `cascadeSkip` → all remaining moves apply synchronously, phase → `won`.
- **Win dialog**: appears after `phase === 'won'` for ~300ms (let last cascade animation finish), then ScoreSheet/GameOver-style dialog with stats update + "New Game" / "Close".
- **Loss dialog**: immediate when `phase === 'lost'`. "No moves remaining. Undo or start new game?" with Undo / New Game / Close.

## 7. Persistence

```ts
type FreeCellSnapshot = {
  phase: 'playing' | 'won' | 'lost';   // 'cascading' clamped to 'playing'
  piles: Record<PileId, Card[]>;
  gameNumber: number;
  startedAt: null;
  elapsedMs: number;
  moveCount: number;
};
```

- Snapshot getter clamps `'cascading'` → `'playing'` (cascade re-triggers on restore if conditions hold).
- Stats live in `localStorage` (`win95.freecell.stats`), separate from snapshot.
- Game-number RNG is replayable from `gameNumber`, no need to persist random state.
- Reset Computer wipes everything (existing prefix-wipe).

## 8. Edge cases

- **Deal numbers ≤ 0 or > 32000**: clamp to 1–32000 in SelectGameDialog.
- **Supermove capacity = 0**: shouldn't happen (always ≥ 1). Defensive: if computed capacity is 0, fall back to 1.
- **Drag from foundation**: allowed (rare but legal in Win95 FreeCell). Counts as one move.
- **Tied / repeated state**: doesn't matter — each move counts even if reversible.
- **Auto-cascade blocked mid-stream**: shouldn't happen — `isAutoCascadable` is sound; if the engine somehow stalls (e.g. due to a bug), safety counter (52) breaks the loop and reverts to `playing`.
- **No legal moves**: detected lazily after each move (cheap: scan top-of-each-pile against legal destinations). Sets `phase: 'lost'`.
- **Mid-cascade refresh**: snapshot says `'playing'` (clamped). On restore, `isAutoCascadable` re-evaluates and re-triggers if true.
- **Reset Computer**: wipes `win95.freecell.stats` + the session snapshot. Defaults restored.

## 9. Testing strategy

- **engine.test.ts**: deal correctness (52 unique, 4×7 + 4×6); legality (all permutations of suit/rank stack rules); supermove math under various free-cell + empty-col combos; undo round-trip; win-on-52 detection; lost-detection with constructed dead-end states; auto-cascadable detection on positions where it should and shouldn't fire.
- **msrng.test.ts**: hard-code Deal #1 column 0 sequence (`['JD', '2D', '9H', 'JC', '5D', '7H', '7C']`). Also test that two calls with the same seed produce identical deals; different seeds produce different deals.
- **scores.test.ts**: round-trip wins/losses, streak resets on loss, streak grows on consecutive wins, best-streak monotonic.
- **Manual QA**: full game playthrough on Deal #1 (a known winnable layout), supermove drag at varying capacities, auto-cascade triggers correctly, Select Game dialog accepts numbers, refresh mid-game, Reset Computer wipes everything.

## 10. Risks

- **Microsoft RNG fidelity** is the highest-stakes single requirement. Mitigation: pin known Deal #1 outputs in tests; fail loud if even one card mismatches. Also pin Deal #2 and Deal #11982 if reference data is publicly verifiable.
- **isAutoCascadable correctness**: getting it wrong either fires too early (engine tries an invalid move) or too late (game stops auto-finishing when it should). Mitigation: simulation-based check (greedy foundation step until stuck) is provably correct because FreeCell's "uncoverable" condition is just "no card you need is buried under one you don't yet need."
- **Supermove drag UX**: dragging an in-the-middle card and showing the right run highlight is the trickiest UX. Mitigation: at drag start, validate the run + capacity → if invalid, only the top card moves, not the whole intended sequence.
- **Layout at 720×600**: 8 tableau columns × 80px = 640px + 7 gaps × 3px = 661px. Fits with margins. Card stride 71px is the limit; if it's too tight, reduce to 65px or 60px in CSS.
- **Lost-detection performance**: cheap (scan ≤ 16 piles × ≤ 13 cards). No perf concern.
