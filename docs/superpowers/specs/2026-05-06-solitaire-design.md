# Solitaire (Klondike) Design

**Goal:** Authentic Win95 Klondike Solitaire as a desktop app — full Microsoft scoring rules, draw 1/3 toggle, Vegas mode, win cascade, persistent options + best times.

**Architecture:** Pure `engine.ts` (state, reducer, deal, move-legality, scoring) consumed by a React component using `useReducer`. Components render piles + cards from state, dispatch actions on input. Options + Vegas balance + Best Times persist to their own `localStorage` keys; per-window session state plugs into the existing `registerSnapshot` API. SVG card faces rendered parametrically. Win cascade is a 60fps `<canvas>` overlay scoped to the window root.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (windowStore only). No new deps. 98.css for chrome only — game surface is custom-styled.

---

## 1. Scope

- **Game:** Klondike Solitaire only.
- **Draw modes:** Draw 1 / Draw 3 (Game → Options).
- **Scoring modes:** Standard / Vegas / None (Win95 rules verbatim).
- **Options dialog:** Draw, Scoring, Timed game, Status bar, Outline dragging, Keep score (Vegas).
- **Win cascade:** rainbow-trail bouncing-cards animation, click anywhere to skip.
- **Undo:** 1 step (Ctrl+Z and Game → Undo). Cleared by new deal.
- **Input:** drag-and-drop, double-click → foundation, right-click → auto-finish (when valid).
- **Stock recycle:** Standard unlimited (with score penalty), Vegas single pass (red-circle "no recycle" icon when exhausted), None unlimited free.
- **Cards:** inline SVG, parametric.
- **Persistence:** Options + Vegas balance + Best Times in dedicated `localStorage` keys; current game in session snapshot via `registerSnapshot`.
- **Status bar:** score + timer (toggleable).

## 2. Window layout

- **Window chrome:** 98.css title bar with menu bar (Game | Help). `singleInstance: true`.
- **Default size:** 700 × 600. **Min size:** 580 × 480 (fits 7 tableau columns at default card width without scrolling). Resizable.
- **Layout (top to bottom inside window):**
  - Menu bar (`Game`, `Help`).
  - Top row: stock + waste on the left, gap, four foundations on the right.
  - Tableau row: 7 columns underneath. Face-down cards offset ~3px; face-up cards fan ~22px.
  - Status bar (toggleable): score on left, timer on right.
- **Felt background:** `#008000` (classic green).
- **Card size:** fixed 71×96 pixels (matches Win95 source). Page scrolls inside window if cramped.

## 3. Game state model

```ts
type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

type Card = {
  id: string;       // 'AS', 'KH', '7C' — stable React key + drag id
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

type PileId =
  | 'stock' | 'waste'
  | 'foundation-spades' | 'foundation-hearts' | 'foundation-clubs' | 'foundation-diamonds'
  | 'tableau-0' | 'tableau-1' | 'tableau-2' | 'tableau-3' | 'tableau-4' | 'tableau-5' | 'tableau-6';

type Phase = 'idle' | 'playing' | 'won' | 'cascading';

type Options = {
  draw: 1 | 3;
  scoring: 'standard' | 'vegas' | 'none';
  timed: boolean;
  statusBar: boolean;
  outlineDragging: boolean;
  vegasKeepScore: boolean;
};

type GameState = {
  phase: Phase;
  piles: Record<PileId, Card[]>;       // bottom of pile at index 0, top at end
  options: Options;
  score: number;                        // current hand
  vegasBalance: number;                 // running across hands when keepScore
  startedAt: number | null;
  elapsedMs: number;
  recyclesUsed: number;                 // standard penalty math + vegas single-pass enforcement
  prev: Pick<GameState, 'piles' | 'score' | 'recyclesUsed'> | null;  // 1-step undo
  drag: { from: PileId; cards: Card[]; pointerOffset: { x: number; y: number } } | null;
};
```

State lives in a `useReducer` inside the Solitaire component. `Options` and `vegasBalance` ALSO persist to their own `localStorage` key (separate from session snapshot) so they survive across deals and window closes within a session. Reset Computer wipes everything including these keys.

**Phase transitions:**
- `idle` → `playing` on first deal (deal happens immediately when window opens).
- `playing` → `won` when all 52 cards are on foundations.
- `won` → `cascading` if user doesn't acknowledge within ~500ms (auto-trigger).
- `cascading` → `idle` on click anywhere (then deal a fresh game).
- any → `idle` on Game → Deal (F2).

**Reducer actions:**
- Input: `drawFromStock`, `recycleStock`, `revealTableauTop(idx)`, `tryMove({from, fromIdx, to})`, `autoMoveToFoundation(card)`, `autoFinish`, `undo`, `deal`.
- UI: `pickUpDrag(...)`, `dropDrag(...)`, `cancelDrag`.
- Settings: `setOptions(partial)`.
- Time: `tick(now)`.

**Move legality** (pure helpers):
- `canStackOnTableau(top, candidate)`: candidate is one rank lower & opposite color, OR top is empty and candidate is a King.
- `canStackOnFoundation(top, candidate)`: same suit AND one rank higher, OR top is empty and candidate is an Ace.
- Multi-card tableau→tableau: moving stack must be a valid run (alternating colors descending) and destination accepts the bottom card.

**Undo policy:** every move that mutates piles snapshots into `prev` (overwriting any older snapshot). `undo` swaps state.piles ← prev.piles and clears `prev`. After undo, no further undo until next move.

## 4. Scoring rules (Win95 verbatim)

**Standard:**
- Waste → Tableau: +5
- Waste → Foundation: +10
- Tableau → Foundation: +10
- Turn over tableau card (reveal face-down): +5
- Foundation → Tableau: −15
- Recycle stock (draw 1): −100 after first pass
- Recycle stock (draw 3): −20 after first pass (per pass)
- Time bonus on win (timed mode): `bonus = floor(700000 / elapsedSec)` when elapsed ≥ 30s, else 0.

**Vegas:**
- Buy-in: −52 at deal.
- Each card to foundation: +5.
- No other point events.
- Single pass through stock (draw 1) or 3 passes (draw 3).
- If `vegasKeepScore`, `vegasBalance` carries across deals.

**None:** No score tracking; status bar shows timer only (if enabled), score column hidden.

## 5. File layout

**New files:**
```
src/apps/solitaire/
  meta.ts                       app registration
  index.tsx                     React component, reducer wiring, snapshot/best-times wiring
  engine.ts                     pure: state, reducer, deal, move-legality, scoring, win detection
  engine.test.ts                vitest
  options.ts                    load/save Options + vegasBalance from localStorage
  options.test.ts               vitest
  bestTimes.ts                  load/save best times for Standard timed mode
  bestTimes.test.ts             vitest
  rng.ts                        seeded mulberry32 (deterministic dealing for tests)
  components/
    Card.tsx                    one card; CardFaceSvg or CardBackSvg; drag handlers
    Pile.tsx                    base pile + empty placeholder
    Stock.tsx                   click-to-draw; "no recycle" icon when exhausted
    Waste.tsx                   draw-1/draw-3 fan logic
    Foundation.tsx              suit-outline empty state
    Tableau.tsx                 face-down stack offset + face-up fan
    StatusBar.tsx               score + timer
    OptionsDialog.tsx           Game → Options modal
    StatisticsDialog.tsx        Game → Statistics (Vegas keep-score totals)
    WinCascade.tsx              canvas overlay running the bouncing-cards animation
  cards/
    CardFaceSvg.tsx             parametric face renderer (suit + rank)
    CardBackSvg.tsx             back renderer
  solitaire.css                 felt, card geometry, dialogs, status bar
public/assets/solitaire/
  icon.png                      (reuse `game_solitaire-0.png` from /win98/png/)
```

**Modified files:**
- `src/core/boot.ts` — register solitaire app under menuPath `['Programs', 'Games']`.

**App registration (`meta.ts`):**
```ts
{
  id: 'solitaire',
  title: 'Solitaire',
  icon: '/assets/solitaire/icon.png',
  singleInstance: true,
  defaultSize: { width: 700, height: 600 },
  minSize: { width: 580, height: 480 },
  resizable: true,
  menuPath: ['Programs', 'Games'],
}
```

**Engine isolation:** `engine.ts` is pure — no React, no DOM, no `localStorage`. It accepts an `RNG` argument for `deal` so tests are deterministic. `options.ts` and `bestTimes.ts` are the only modules that touch `localStorage`. Card components are presentational.

**Tests:**
- `engine.test.ts` — seeded deal correctness, legal/illegal moves per type, scoring per mode, undo round-trip, win detection, auto-finish gating.
- `options.test.ts` — round-trip, defaults when key missing, malformed JSON ignored.
- `bestTimes.test.ts` — qualify only standard-timed wins, replace when better, reset clears.

## 6. Persistence integration

The window-persistence APIs (`registerSnapshot` / `restoreState`) already exist and are used by minesweeper, calculator, etc. Solitaire plugs in the same way:

- **Snapshot getter** in `index.tsx`:
  ```ts
  api.registerSnapshot(() => ({
    piles: state.piles,
    options: state.options,
    score: state.score,
    vegasBalance: state.vegasBalance,
    startedAt: null,
    elapsedMs: state.elapsedMs,
    recyclesUsed: state.recyclesUsed,
    phase: state.phase === 'cascading' || state.phase === 'won' ? 'idle' : state.phase,
  }));
  ```
  `prev` (undo) and `drag` are intentionally dropped on save.
- **Restore on mount:** if `restoreState` validates against `isValidSolitaireSnapshot`, rebuild `GameState`. If `phase === 'playing'`, clamp `startedAt = Date.now() - elapsedMs` (same trick minesweeper uses) so the timer continues correctly.
- **Options + Vegas balance** ALSO write to a dedicated key `win95.solitaire.options` (via `options.ts`). This duplicates what's in the session snapshot but is deliberate — it's so opening Solitaire fresh after closing it (with no session) still starts with the user's last-chosen options. Reset Computer wipes both.
- **Best Times:** dedicated key `win95.solitaire.bestTimes` via `bestTimes.ts`. Format mirrors minesweeper's bestTimes.

## 7. Edge cases

- **Win cascade trigger window:** phase becomes `won`, then `cascading` ~500ms later. If user closes window, hits Deal, or clicks during that 500ms → treat as acknowledged, skip to `idle` (no cascade).
- **Auto-finish (right-click):** only valid when (a) no face-down tableau cards remain and (b) stock + waste are empty. Otherwise no-op.
- **Mid-deal close:** session snapshot has `phase: 'playing'`, current piles → restore picks up exactly where left off, timer resumes.
- **Vegas single-pass exhausted:** when stock is empty and `recyclesUsed === 1` (or 3 for draw-3) in Vegas mode, stock pile shows red-circle "no recycle" icon. Click does nothing.
- **Drag drop on illegal target:** card animates back to source pile (~120ms ease-out). No score change.
- **Window resize below content:** root div is `overflow: auto`. Below `minSize` shouldn't happen, but if it does, scroll.
- **Undo across deal:** `Game → Deal` clears `prev`. New deal cannot be undone.
- **Double-click to foundation when ineligible:** no-op, no error tone.
- **Drag while win cascade active:** drag input ignored.

## 8. Testing strategy

- **Engine** (`engine.test.ts`): seeded deal produces a known layout; every move-legality permutation; scoring math per mode; undo restores prior piles + score + recyclesUsed; auto-finish only fires when valid; win detection on all 52 cards on foundations.
- **Options** (`options.test.ts`): load/save round-trip, default fallback when key missing, ignore malformed JSON, version bump migration.
- **Best times** (`bestTimes.test.ts`): only standard-timed wins qualify; better time replaces older; reset clears all.
- **Manual:** drag UX, double-click auto-foundation, right-click auto-finish, win cascade visual + click-to-skip, status bar updates live, options dialog round-trip, Vegas single-pass UI, refresh-as-sleep restoration.

## 9. Risks

- **SVG card art volume:** 52 faces × pip layouts + 4 court figures = a lot. Mitigation: `CardFaceSvg` is parametric — pip layouts driven by a per-rank coordinate table; J/Q/K use simplified Win95-style monogram figures, not detailed illustrations.
- **Drag perf on slow devices:** "Outline dragging" option exists exactly for this. Default off; mention in any user-visible help.
- **Win cascade clipping:** canvas must clip to window root, not page. WinCascade renders inside `.solitaire-root` with `overflow: hidden`.
- **Card-back picker scope creep:** out of scope for v1. Single back design.
- **Right-click menu suppression:** must `preventDefault()` on right-click for auto-finish trigger.
