# Chess Design

## Goal

Add a Win95-faithful Chess app to the desktop. Player vs Computer, three difficulty levels, full chess rules, click-to-move + drag, promotion dialog, session persistence. No timer, no PGN export, no online play.

## Win95 reference

Microsoft Entertainment Pack chess and the various 1995-era Windows chess shareware all share a common look: 2D top-down 8×8 board, alternating cream/dark-brown squares (or light-grey/teal), simple flat 2D piece glyphs centered on each square, fixed-size window with a menu bar (Game / Options) and a status bar at the bottom. Pieces are rendered as solid silhouettes — outlined for white, filled for black — typically using the system chess font or bitmap sprites.

Our implementation matches that aesthetic: Unicode chess glyphs rendered at a large pixel size on the squares.

## Scope

**In scope:**
- Full chess rules: standard piece movement, captures, castling (kingside + queenside), en passant, promotion, check, checkmate, stalemate, fifty-move rule, threefold repetition.
- Player vs Computer only. Player picks color (white / black / random) at new-game time.
- Three AI difficulty levels: Beginner, Intermediate, Advanced.
- Click-to-move primary; drag supported as secondary.
- Promotion dialog (Queen/Rook/Bishop/Knight, default Queen).
- New game, undo, resign.
- Status bar: whose turn, move count, captured material.
- Session persistence via `registerSnapshot`.

**Out of scope:**
- Timer / chess clock.
- PGN export/import.
- Opening book.
- Online or LAN play.
- Move animations beyond the natural state-update.
- Coordinate notation overlay (a–h / 1–8 labels — *included*, not omitted; see Layout).
- Position editor.

## Architecture

```
src/apps/chess/
  meta.ts                  AppDef registration
  index.tsx                Main component, useReducer wiring, drag, dialogs
  engine.ts                Pure: types, board, move-gen, legality, make-move
  ai.ts                    Pure: evaluation, minimax + alpha-beta, move ordering
  scores.ts                localStorage wins/losses/draws
  components/
    Board.tsx              8×8 grid, square highlighting, piece rendering
    Square.tsx             One square (background, optional piece, highlight class)
    NewGameDialog.tsx      Color + difficulty selector
    PromotionDialog.tsx    Q/R/B/N picker
    OutcomeDialog.tsx      Win/loss/draw + new game button
    StatisticsDialog.tsx   Wins/losses/draws
  chess.css
  engine.test.ts
  ai.test.ts
  scores.test.ts
```

Pure engine + reducer pattern, mirroring FreeCell and Hearts. Component holds zero game logic.

## State

```ts
type Color = 'white' | 'black';
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type Piece = { color: Color; type: PieceType };

// Square index 0..63. file = idx % 8 (0=a, 7=h). rank = Math.floor(idx / 8) (0=rank 1, 7=rank 8).
// White starts on ranks 0–1; black on ranks 6–7.
type Square = number;

type CastlingRights = {
  whiteKingside: boolean; whiteQueenside: boolean;
  blackKingside: boolean; blackQueenside: boolean;
};

type Move = {
  from: Square; to: Square;
  promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
  // Derived flags filled in by engine for the history record:
  capture?: PieceType;
  castle?: 'kingside' | 'queenside';
  enPassant?: boolean;
};

type Position = {
  board: (Piece | null)[];        // length 64
  toMove: Color;
  castling: CastlingRights;
  enPassantTarget: Square | null; // square the capturing pawn moves TO
  halfmoveClock: number;          // since last pawn move or capture
  fullmoveNumber: number;
};

type Phase = 'playing' | 'thinking' | 'promoting' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';

type GameState = {
  phase: Phase;
  position: Position;
  history: { move: Move; positionBefore: Position }[];
  positionsSeen: Map<string, number>;   // FEN-like hash → count, for threefold detection
  playerColor: Color;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  selectedSquare: Square | null;        // for click-to-move highlight
  legalDestinations: Square[];          // computed when selectedSquare set
  pendingPromotion: { from: Square; to: Square } | null;
  drawReason: 'fifty-move' | 'threefold' | 'stalemate' | 'insufficient-material' | null;
};
```

## Engine (`engine.ts`)

Pure functions, no React, no state. Public API:

```ts
export function initialPosition(): Position;
export function generateLegalMoves(pos: Position, square?: Square): Move[];
export function makeMove(pos: Position, move: Move): Position;
export function isCheck(pos: Position, color: Color): boolean;
export function isCheckmate(pos: Position): boolean;
export function isStalemate(pos: Position): boolean;
export function isInsufficientMaterial(pos: Position): boolean;
export function positionHash(pos: Position): string;  // FEN-style key for repetition map
export type { Position, Move, Piece, Color, PieceType, Square };
```

**Move generation:** For each piece, generate pseudo-legal moves (raw piece-movement squares, including captures), then filter by "does this leave my own king in check?" via `makeMove` + `isCheck`. Special cases: castling requires no pieces between, king not in check, king does not pass through or land on attacked square; en passant requires the prior move to have been the opponent's two-square pawn advance to the adjacent file (encoded in `enPassantTarget`); promotion expands a pawn-to-last-rank move into four moves (one per promotion type).

**`makeMove`:** Returns a new `Position`. Updates board, swaps `toMove`, decrements/resets `halfmoveClock`, increments `fullmoveNumber` (after black's move), updates castling rights when king or rook moves or is captured, sets `enPassantTarget` only when a pawn just made a two-square advance, and handles the rook-displacement that accompanies castling.

**Phase derivation:** A computed-by-reducer phase. After each move the reducer calls `deriveOutcome(pos, history, positionsSeen)`:
- If `legalMoves(pos).length === 0` and `isCheck(pos, pos.toMove)` → `checkmate`.
- Else if `legalMoves(pos).length === 0` → `stalemate`.
- Else if `pos.halfmoveClock >= 100` → `draw` (`fifty-move`).
- Else if `positionsSeen.get(positionHash(pos)) >= 3` → `draw` (`threefold`).
- Else if `isInsufficientMaterial(pos)` → `draw` (`insufficient-material`).
- Else if AI to move → `thinking`.
- Else → `playing`.

## AI (`ai.ts`)

```ts
export function chooseAiMove(
  pos: Position,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
): Move;
```

**Algorithm:** Minimax with alpha-beta pruning. Move ordering puts captures first to maximize cutoffs.

**Depth by level:**
- Beginner: depth 1. Picks the move that maximizes immediate evaluation; if multiple are tied, pick a random one (varies play and avoids feeling robotic).
- Intermediate: depth 3.
- Advanced: depth 4 with quiescence search on captures only (extends search until a quiet position is reached).

**Evaluation function:**
- Material (centipawns): pawn=100, knight=320, bishop=330, rook=500, queen=900, king=20000.
- Piece-square tables for each piece type (small positional bonuses encouraging knights toward the center, pawns to advance, king to corner in opening/middlegame).
- Mobility bonus (small): number of pseudo-legal moves available.
- Sign convention: positive = good for white. Search returns the value from the side-to-move perspective via negamax.

**Determinism:** AI is deterministic given (position, difficulty, seed). For Beginner's random tiebreak, seed off `position.fullmoveNumber * 31 + halfmoveClock` so a save/restore reproduces the same choice (and replay debugging works).

## Move input

**Click-to-move (primary):**
- Click a square containing a piece of your color → set `selectedSquare`, populate `legalDestinations`. Highlight the selected square (cyan tint) and dot the legal destinations (small dot center, or full square highlight if it's a capture).
- Click a legal destination → dispatch `playerMove`. Resets selection.
- Click an illegal square or your own piece → re-selects (or deselects if same square).

**Drag (secondary):**
- PointerDown on your piece → start drag (set selection too, so drop = move).
- Pointer drop on a legal square → make move.
- Drop elsewhere → cancel drag, retain selection.

**Promotion:**
- When a player move would promote, the reducer enters `promoting` phase and stores `pendingPromotion`. The component renders a modal dialog with four buttons (Queen / Rook / Bishop / Knight). Clicking commits the move with the chosen piece type. Default focus is Queen; Enter commits Queen.
- AI promotions never enter `promoting`; the AI always promotes to Queen.

**AI move flow:**
- After `playerMove` resolves to phase = `playing` and it's now AI's turn, the reducer sets phase = `thinking`. A `useEffect` watching `phase === 'thinking'` calls `chooseAiMove` (synchronous; bounded by alpha-beta depth) inside `setTimeout(..., 200)` so the player sees the position update before the AI replies. The result is dispatched as `aiMove`.

## Layout

Window: 480×560 fixed (resizable: false). Layout:

```
┌──────────────────────────────────────────────────┐
│ Game   Options   Help                            │   ← menu bar (98.css)
├──────────────────────────────────────────────────┤
│   ┌──┬──┬──┬──┬──┬──┬──┬──┐                       │
│ 8 │  │  │  │  │  │  │  │  │                       │   ← rank labels left
│   ├──┼──┼──┼──┼──┼──┼──┼──┤                       │     (cream background)
│ 7 │  │  │  │  │  │  │  │  │                       │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤                       │     squares 56×56 px
│   │ … 8 ranks …                                   │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤                       │
│ 1 │  │  │  │  │  │  │  │  │                       │
│   └──┴──┴──┴──┴──┴──┴──┴──┘                       │
│     a   b   c   d   e   f   g   h                 │   ← file labels bottom
├──────────────────────────────────────────────────┤
│ White's turn      Move 1      Captured: …        │   ← status bar
└──────────────────────────────────────────────────┘
```

When the player chose black, the board is flipped (black at bottom, white at top; rank labels and file labels reverse).

**Square colors:** light = `#f0d9b5` (cream); dark = `#b58863` (brown). Border between squares: 0px (squares abut). Outer border: 2px ridge using 98.css palette colors.

**Piece glyphs:** Unicode characters at 44px (white = `♔♕♖♗♘♙`, black = `♚♛♜♝♞♟`). White pieces use a 1px black text-shadow ring for legibility against light squares; black pieces use a 1px white text-shadow ring against dark squares (each ring is uniform regardless of square color, matching Win95 chess fonts).

**Selection highlights:**
- Selected square: cyan inset (`box-shadow: inset 0 0 0 3px #4488ff`).
- Legal-destination square: small filled circle (12px diameter, 30% black) centered.
- Legal-destination square that contains a capture: red ring (`box-shadow: inset 0 0 0 3px #c44`).
- Last-move squares (from + to): yellow tint (`background-color: rgba(255,255,128,0.4)`).
- King in check: red flashing tint on the king's square.

## Menus

**Game**
- New Game…           (F2) — opens NewGameDialog
- Undo                (Ctrl+Z) — reverts last move pair (player + AI). If only player moved, undo just that.
- Resign — sets phase = `resigned` (loss recorded). Confirmation dialog ("Are you sure?") on click.
- ───
- Statistics…
- ───
- Exit

**Options** — none for v1. Reserved.

**Help**
- About Chess… — small dialog: "Win95 Chess. Built for jaredraiola.com." (Mirror Solitaire's About.)

## Dialogs

### NewGameDialog
- Title: "New Game"
- Body: Color radio (Random / White / Black, default Random) and Difficulty radio (Beginner / Intermediate / Advanced, default Intermediate).
- Buttons: OK / Cancel.
- OK dispatches `newGame` with chosen options. If color is Random, the engine flips a coin internally (seeded from `Date.now()`).

### PromotionDialog
- Title: "Promote pawn"
- Body: Four big square buttons showing ♕ ♖ ♗ ♘ glyphs (matching player's color).
- Default focus: Queen. Enter = commit Queen. Esc = cancel (returns to playing without the move).

### OutcomeDialog
- Title: "Checkmate" / "Stalemate" / "Draw" / "Resigned" / "Victory"
- Body: One-sentence description. For checkmate, names the winner.
- Buttons: New Game / Close.
- Close calls `api.requestClose()`.

### StatisticsDialog
- Title: "Statistics"
- Body: Wins / Losses / Draws and Win % (excludes draws from the denominator).
- Button: OK.

### Resign confirmation
- Title: "Resign"
- Body: "Resign this game?"
- Buttons: Yes / No.

## Persistence

`registerSnapshot` + `restoreState` pattern, identical shape to FreeCell:

```ts
type ChessSnapshot = {
  position: Position;
  history: { move: Move; positionBefore: Position }[];
  playerColor: Color;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  phase: 'playing' | 'thinking' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  // Note: `promoting` collapses to `playing` in snapshots; if interrupted mid-promotion,
  // the player just re-clicks the destination square and the promotion dialog re-appears.
  drawReason: GameState['drawReason'];
};
```

`positionsSeen` is rebuilt from `history` on restore (replay each move's `positionBefore` and apply each move). `selectedSquare`/`legalDestinations` reset to null/[] on restore.

`isValidChessSnapshot(v: unknown): v is ChessSnapshot` — light shape check; mismatch falls back to a fresh game.

## Stats (`scores.ts`)

```ts
type Stats = { wins: number; losses: number; draws: number };
```

`recordOutcome('win' | 'loss' | 'draw')` increments the appropriate counter. Persisted under `win95.chess.stats`. Resigning counts as a loss. Mirror of FreeCell scores file structure.

## Component file responsibilities

- **Board.tsx**: 8×8 CSS grid. Renders 64 `<Square>`s. Receives the full `position`, `selectedSquare`, `legalDestinations`, last-move squares, player color (for orientation). Click on a square fires up to parent.
- **Square.tsx**: Background color (light/dark), highlight classes, optional piece glyph. PointerDown to support drag-start hand-off to parent.
- **NewGameDialog / PromotionDialog / OutcomeDialog / StatisticsDialog**: stateless dialogs, props in / callback out.
- **index.tsx**: useReducer + drag listeners + AI effect + persistence wiring + menu state. Renders Board and dialogs.

Each file under 200 lines.

## Testing

**`engine.test.ts`** — TDD-driven, ~30 tests:
- Initial position correctness (pieces in standard starting squares).
- Pawn moves: single push, double push from start, capture, blocked.
- Knight moves (L-shape, jump over pieces).
- Bishop / rook / queen / king basic moves.
- Castling: kingside legal both colors, queenside legal both colors, blocked by piece, blocked by check, blocked by passing through attacked square, lost when rook moves, lost when king moves.
- En passant: legal capture, only available immediately after the two-square advance.
- Promotion: pawn to last rank generates 4 moves.
- Check: detect direct check, detect check after a discovered attack.
- Checkmate: scholar's mate position resolves to checkmate.
- Stalemate: classic king + pawn stalemate position.
- Insufficient material: K vs K, K+B vs K, K+N vs K, K+B vs K+B same-color squares.
- Fifty-move rule: half-move clock increments correctly.
- Repetition hash: identical positions hash equal; different en-passant rights hash differently.

**`ai.test.ts`** — ~6 tests:
- Beginner picks a legal move.
- Intermediate captures a hanging queen at depth 3.
- Intermediate avoids losing its own queen to a one-move threat.
- Advanced finds mate-in-2 in a known puzzle.
- Move ordering: captures considered before quiet moves (verify via spy or by ordering function output).
- Determinism: same (position, difficulty) returns the same move on repeated calls.

**`scores.test.ts`** — 5 tests mirroring FreeCell's: empty load, win, loss, draw, win/loss interleaving doesn't reset.

UI: no automated tests. Manual QA in Task N.

## Edge cases

- **Player resigns mid-AI-thinking:** AI is synchronous (alpha-beta), so this can't happen. We could not enable Resign while phase = `thinking`, but the AI move arrives in 200ms anyway. Disable Resign during thinking phase as a small polish.
- **Player tries to move during AI's turn:** Squares are unresponsive when phase ≠ `playing`. The Board component disables click handlers when `state.phase !== 'playing'`.
- **Snapshot during `thinking` phase:** Restored state collapses `thinking` → `playing` and re-fires the AI effect. Equivalent behavior, no data loss.
- **Snapshot during `promoting` phase:** Collapses to `playing` (player re-makes the move).
- **Insufficient-material draw mid-position:** Triggered immediately, not on next move.
- **Threefold repetition:** Triggered after the third occurrence is reached, not after a player claims it. (Win95 chess auto-claims.)
- **Three difficulty levels with different evaluation:** All three use the same eval function; only depth and (for Beginner) randomness differ. Eval is well-defined and tested.
- **Castling annotation in history:** Recorded with `castle: 'kingside' | 'queenside'`. Used to reverse on undo.

## Risks

- **Move generation correctness:** Chess has many edge cases. Test coverage is the firewall — every special rule (castling, en passant, promotion, threefold, fifty-move, insufficient material) gets at least two tests. If a test is missing, the rule isn't actually verified. The plan must include these tests.
- **Performance at depth 4 on the main thread:** Alpha-beta on a 56-byte position with bounded branching factor of ~30 should fit well under 100ms at depth 4 in the early game. If late-game searches exceed 500ms, we cap Advanced at depth 3 and lean on quiescence search. Acceptance threshold: 95th percentile AI move time < 1500ms across a self-play game.
- **`positionsSeen` map size:** Grows monotonically. A 1000-move game (extreme) yields a 1000-entry Map of short strings — trivial. No bound needed.
- **Unicode glyph rendering:** Differs across OSes. Acceptable risk — we use the system chess font (`serif` fallback) and accept platform variation. (Win95-era chess fonts also varied.)
- **State shape change between releases:** Snapshot validator rejects malformed snapshots and falls back to a fresh game. Same pattern as the other apps.

## Win condition / acceptance

- All 30+ engine tests pass.
- All 6 AI tests pass (including mate-in-2).
- Manual QA: scholar's mate against Beginner ends in checkmate dialog; refresh mid-game restores; promotion dialog appears and commits selected piece; castling works both sides; en passant works; fifty-move and threefold draws fire when expected.
- Build clean, no `any`, no comments unless WHY is non-obvious.
