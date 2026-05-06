# Hearts Design

**Goal:** Authentic Win95 Hearts ("Black Lady" rules) as a desktop app — single human player vs 3 AI, full passing cycle, Shoot the Moon, three AI difficulty levels.

**Architecture:** Pure `engine.ts` (state, reducer, deal, legality, scoring) + pure `ai.ts` (per-difficulty pass + play decisions) consumed by a React component using `useReducer`. AI plays are dispatched from a `useEffect` with a ~600ms artificial delay so the human can follow each move. Persistence reuses the existing `registerSnapshot` API.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand (windowStore only). vitest with jsdom + fake-indexeddb. 98.css for window chrome only. Reuses `CardFaceSvg` / `CardBackSvg` / `suitGlyphs` from solitaire (no premature extraction — if a third card game lands, those move to `src/lib/cards/`).

---

## 1. Scope

- **Game**: Hearts ("Black Lady" variant — the Win95 rules).
- **Players**: 1 human (you, bottom of screen) + 3 AI (Jared / Meatball / John, positioned left / top / right).
- **Rules**:
  - 4 hands of 13 cards each. 52-card deck, no jokers.
  - Q♠ = 13 points, each ♥ = 1 point. 26 points per hand total.
  - **Shoot the Moon**: if one player takes all 26 points, they get 0 and the other 3 get 26 each.
  - **Hearts can't lead** until someone plays a heart off-suit (or the leader has only hearts).
  - **2♣ leads** the first trick of every hand. Whoever holds 2♣ must play it first.
  - **Must follow suit** if possible.
  - **No points on first trick** — players cannot play any heart or Q♠ on the first trick of a hand (unless that's all they have in the led suit).
  - **Win condition**: first to 100 points loses; lowest score at that moment wins. Ties continue play until broken.
- **Passing**: each hand begins with 3 cards passed in a rotating direction:
  - Hand 1: pass left
  - Hand 2: pass right
  - Hand 3: pass across
  - Hand 4: keep (no passing)
  - Cycle repeats.
- **AI difficulty**: Easy / Medium / Hard, selectable from Game → Options.
- **Window**: fixed 700 × 600, non-resizable.
- **Animations**: Win95-minimal — instant card placement; ~1s pause + 200ms fade at end of trick; ~600ms AI think delay; brief border-glow when AI receives passed cards.
- **Persistence**: full mid-hand state restored across refresh — hand, trick, scoreboard, pass selections.

## 2. Player names

- AI 1 (left): **Jared**
- AI 2 (top): **Meatball**
- AI 3 (right): **John**
- Human (bottom): **You** (default; not user-configurable in v1).

## 3. State model

```ts
type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;  // 14 = Ace high
type Card = { id: string; suit: Suit; rank: Rank };

type PlayerId = 0 | 1 | 2 | 3;       // 0 = human, 1 = left, 2 = top, 3 = right
type Phase = 'passing' | 'playing' | 'trick-resolved' | 'hand-over' | 'game-over';
type PassDirection = 'left' | 'right' | 'across' | 'keep';

type Trick = {
  leader: PlayerId;
  plays: { player: PlayerId; card: Card }[];   // length 0..4 in play order
  leadSuit: Suit | null;
};

type Difficulty = 'easy' | 'medium' | 'hard';

type Options = {
  difficulty: Difficulty;
  showAiHands: boolean;             // debug
};

export const DEFAULT_OPTIONS: Options = {
  difficulty: 'medium',
  showAiHands: false,
};

type GameState = {
  phase: Phase;
  hands: Record<PlayerId, Card[]>;        // each player's current hand (sorted)
  taken: Record<PlayerId, Card[]>;        // tricks-won this hand (for end-of-hand scoring)
  scores: Record<PlayerId, number>;       // running cumulative game scores
  handNumber: number;                     // 0-indexed; determines pass direction
  passDirection: PassDirection;
  passSelections: Card[] | null;          // human's pending pass selection (length 0..3)
  passReceived: Record<PlayerId, Card[]> | null;  // cards each player received this hand
  heartsBroken: boolean;
  trick: Trick | null;                    // current trick; null between tricks
  turn: PlayerId | null;                  // whose turn it is; null when not playing
  history: Card[];                        // every card played this hand (for AI counting + Hard difficulty)
  options: Options;
  prev: Pick<GameState, 'hands' | 'taken' | 'trick' | 'turn' | 'history' | 'heartsBroken'> | null;
};
```

State lives in a `useReducer` inside the Hearts component. `Options` persists separately via `options.ts` (mirrors Solitaire pattern). Game-completion stats persist via `scores.ts`.

**Phase transitions:**
- `passing` → (all 4 selected & exchanged) → `playing` (whoever has 2♣ leads).
- `playing` → `trick-resolved` (4 cards played) → `playing` (after 1s pause + clear).
- `playing` → `hand-over` (13 tricks played) → score sheet dialog → `passing` (next hand) or `game-over` (someone reached 100).
- `game-over` → `passing` on user-triggered "New Game".

**Reducer actions:**
- Pass phase: `selectPassCard(card)`, `deselectPassCard(card)`, `submitPass()`.
- Play phase: `playCard({player, card})`, `aiPlay({player, card})` — both go through the same internal handler; the type tag distinguishes for any logging/replay.
- Trick lifecycle: `resolveTrick()` (called from effect after 4 cards played + animation pause).
- Hand lifecycle: `nextHand({rng})` — clear hands, deal new round, set pass direction.
- Game lifecycle: `newGame({rng})`, `setOptions(partial)`.
- Undo: `undo()` — reverts the most recent human play action (mid-trick only; can't undo after trick resolves).

**Move legality** (pure helpers, all in `engine.ts`):
- `mustFollowSuit(hand, leadSuit)` — true if player holds any card of `leadSuit`.
- `legalCardsForFollow(hand, leadSuit, heartsBroken, isFirstTrick)` — subset of hand playable as a follower this trick.
- `legalCardsForLead(hand, heartsBroken, isFirstTrick)` — subset playable as a leader. First trick must lead 2♣.
- `trickWinner(trick)` — returns PlayerId of the winner (highest of leadSuit).
- `pointsInCards(cards)` — sums Q♠ (13) + each ♥ (1).
- `shotTheMoon(taken[player])` — true if player took all 26 points worth.

## 4. AI architecture

Pure functions in `ai.ts`:

```ts
function chooseAiPass(hand: Card[], direction: PassDirection, difficulty: Difficulty): Card[];
function chooseAiPlay(
  hand: Card[],
  trick: Trick,
  history: Card[],
  heartsBroken: boolean,
  isFirstTrick: boolean,
  difficulty: Difficulty,
): Card;
```

**Easy:**
- Pass: 3 random cards from hand.
- Play: random legal card.

**Medium:**
- Pass: prioritize dumping K♠, A♠, Q♠ (in that order); if none held, dump highest cards from shortest non-trump suits (favor creating voids).
- Play:
  - **Leading**: lowest non-heart while hearts unbroken; lowest of any suit otherwise.
  - **Following with no points in trick**: if can avoid winning → highest card under current winner; else lowest legal.
  - **Following with points in trick**: lowest legal that doesn't take.
  - **Q♠ avoidance**: don't lead a high spade unless A♠ or K♠ also held.

**Hard:** Medium plus:
- **Card counting** via `history` arg — knows which cards remain.
- **Shoot-the-Moon attempt**: if hand has ≥5 hearts AND Q♠ AND ≥2 high spades, play to take all points (lead Q♠ early, take hearts aggressively).
- **Shoot-the-Moon defense**: if any opponent has taken ≥10 points and trends suggest a moon attempt, intentionally take a heart to block (only if affordable).
- **Smarter pass**: in keep direction (no pass), N/A. Otherwise, considers what to give a particular opponent — never gives Q♠ to the player passing back to you (across direction).

**AI invocation flow** (in `index.tsx`):
```ts
useEffect(() => {
  if (state.phase !== 'playing') return;
  if (state.turn === null || state.turn === 0) return;
  const player = state.turn;
  const id = window.setTimeout(() => {
    const card = chooseAiPlay(
      state.hands[player],
      state.trick!,
      state.history,
      state.heartsBroken,
      state.history.length === 0,
      state.options.difficulty,
    );
    dispatch({ type: 'aiPlay', player, card });
  }, 600);
  return () => window.clearTimeout(id);
}, [state.turn, state.phase]);
```

When the human finishes pass selection (3 cards) and clicks Pass, all 3 AI passes are computed synchronously and dispatched as one `submitPass` action. The reducer exchanges all cards atomically.

## 5. File layout

**New files:**
```
src/apps/hearts/
  meta.ts                       app registration
  index.tsx                     React component, reducer, AI effect, persistence, dialogs
  engine.ts                     pure: state, reducer, deal, legality, scoring, win check
  engine.test.ts                vitest
  ai.ts                         chooseAiPass + chooseAiPlay (per difficulty)
  ai.test.ts                    vitest
  options.ts                    Options localStorage round-trip
  options.test.ts               vitest
  scores.ts                     wins/losses + best (lowest) finishing score
  scores.test.ts                vitest
  rng.ts                        re-export from solitaire/rng (or local copy)
  components/
    Hand.tsx                    human's 13 cards fanned at bottom; click to select / play
    AiHand.tsx                  fan of card-backs for one AI
    TrickArea.tsx               4-slot center area; cards land at their player slot
    PassPrompt.tsx              status bar during passing phase
    PlayPrompt.tsx              status bar during playing phase ("Your turn", "Jared's turn")
    ScoreSheet.tsx              between-hands modal: per-hand + cumulative scores
    OptionsDialog.tsx           difficulty radio + show-AI-hands checkbox
    GameOverDialog.tsx          winner + final scores + "New Game" / "Close"
  hearts.css                    layout, felt, hand fan, pass tray, status bar
public/assets/hearts/
  icon.png                      reuse `/assets/win98/png/game_hearts-0.png` if present
```

**Modified files:**
- `src/core/boot.ts` — register `heartsMeta` after the other game apps.

**App registration (`meta.ts`):**
```ts
{
  id: 'hearts',
  displayName: 'Hearts',
  icon: '/assets/win98/png/game_hearts-0.png',
  defaultSize: { width: 700, height: 600 },
  minSize: { width: 700, height: 600 },
  singleInstance: true,
  resizable: false,
  menuPath: ['Programs', 'Games'],
}
```

**Engine isolation:** `engine.ts` is pure. `ai.ts` is pure. `options.ts` and `scores.ts` are the only modules that touch `localStorage`. Card components are imported from `@/apps/solitaire/cards/` (no premature shared-lib extraction).

## 6. UI / Layout

```
+----------------------------------------------------+
|  Game     Help                                     |
+----------------------------------------------------+
|                                                    |
|              Meatball: 13                          |
|              [horizontal back-fan]                 |
|                                                    |
|  Jared            ┌───────────┐            John   |
|  [vertical fan]   │   trick   │   [vertical fan]  |
|  13               │  4 slots  │   13              |
|                   └───────────┘                    |
|                                                    |
|  ┌──────────────────────────────────────────────┐  |
|  │  Your hand: 13 cards fanned                  │  |
|  └──────────────────────────────────────────────┘  |
|  Status: Your turn — play a club    [Pass / Undo]  |
+----------------------------------------------------+
```

- **Human hand**: 13 cards fanned horizontally, sorted by suit (clubs, diamonds, spades, hearts) and rank within suit. Each card shows ~24px of width except the rightmost (full 71px). Hover lifts the card up 8px. Click during pass = select/deselect; click during your turn = play if legal (else flash red border).
- **AI hands**: card-back fans showing card count via fan width. Left/right are vertical (rotated 90°/270°). Top is horizontal flipped. AI name + remaining card count shown as label adjacent.
- **Trick area**: 4 fixed slots (N/E/S/W). Cards appear at their player's slot when played.
- **Status bar** (bottom strip): contextual text + buttons:
  - *Passing*: "Pass 3 cards to Jared" + Pass button (enabled when 3 selected).
  - *Playing — your turn*: "Your turn".
  - *Playing — AI turn*: "Jared's turn..." (with subtle dot animation).
  - *Hand-over*: button auto-fades; ScoreSheet dialog appears.
- **Card legality feedback**: when human clicks an illegal card, brief red flash on the card border + status text "Illegal — must follow suit" / "Hearts not broken" / "No points on first trick".

## 7. Animations & timing

| Event | Behavior |
| --- | --- |
| Card played | Instant (no fly animation). Card appears in trick slot. |
| End of trick (4 cards played) | 1000ms hold showing all 4 cards → 200ms fade-out → trick clears. |
| AI think delay | 600ms `setTimeout` between AI plays. |
| AI receives pass | 300ms border glow on receiving AI's fan. |
| Shoot the Moon | 1000ms yellow glow on shooter's name + ScoreSheet line "Jared shot the moon!". |
| Hand transition | No animation; ScoreSheet modal → click OK → fresh deal appears. |

## 8. Persistence integration

Reuse `registerSnapshot` from `WindowApi`. Pattern matches Solitaire:

- Snapshot getter clamps `phase: 'trick-resolved'` → preceding `'playing'`. Saves all in-flight state (hands, taken, trick, turn, scores, pass selections, history, heartsBroken).
- Restore: rebuild GameState from snapshot. AI effect resumes if `turn` was an AI's at save time.
- **Options** come from `localStorage` via `loadOptions()`, NOT from the snapshot — same lesson learned in Solitaire (snapshot must not freeze settings).
- Options key: `win95.hearts.options`.
- Scores key: `win95.hearts.scores`.

Reset Computer wipes all of these (already covered by existing localStorage prefix wipe).

## 9. Edge cases

- **2♣ leads first trick**: deal detects who has 2♣; that PlayerId leads first. They are forced (only legal card) to play 2♣.
- **First trick — no points**: legality helper rejects ♥ and Q♠ on the first trick of a hand, unless the player has only point cards in the led suit.
- **Hearts breaking**: a player who plays a ♥ off-suit (i.e., couldn't follow) sets `heartsBroken: true`. Lead legality checks this flag.
- **Q♠ played**: legal anytime (no restriction beyond follow-suit and first-trick rule).
- **Shoot the Moon**: at end-of-hand scoring, if any single player took 26 points → they score 0 and other 3 score 26.
- **Tied at 100**: `game-over` only when (a) someone reached 100 AND (b) there's a unique lowest scorer. If tied, continue another hand.
- **Mid-pass refresh**: snapshot preserves `passSelections`. Restore puts the user back in passing phase with their existing selections highlighted.
- **AI turn at refresh**: AI effect re-fires with the 600ms delay; play continues seamlessly.
- **All-card hand fan overflow**: 13 cards × ~24px stride = 312px occupied; window is 700px, fits comfortably.
- **Reset Computer**: wipes all `win95.hearts.*` keys. Next open starts at fresh defaults.

## 10. Testing strategy

- **engine.test.ts**: deterministic deal correctness (52 unique cards across 4 hands of 13 each), legality permutations (must-follow-suit, can't-lead-hearts unless broken, no-points-on-first-trick, 2♣ forced first), trick winner correctness for each suit/rank combo, scoring (Q♠ = 13, ♥ = 1 each, shoot-the-moon detection), pass cycle direction over 4+ hands, end-of-hand transition, win-condition detection (with tie-break case).
- **ai.test.ts**: each difficulty plays only legal cards (fuzz with 1000 random hands), Easy passes 3 unique cards from hand, Medium dumps Q♠/K♠/A♠ when held, Hard tracks `history` correctly (e.g., refuses to lead a card it knows is dominated by remaining cards in opponents' hands).
- **options.test.ts**: round-trip, defaults when key missing, malformed JSON ignored.
- **scores.test.ts**: tally wins/losses, store best (lowest) score on game-over.
- **Manual QA**: play full game at each difficulty; refresh mid-pass + mid-hand + mid-trick; trigger shoot-the-moon; verify game-over at 100; reset wipes correctly.

## 11. Risks

- **AI reasonableness, especially Hard.** Card counting + shoot-the-moon prediction is the trickiest single component. Mitigation: implementation plan splits Hard into a follow-up task; ship Easy + Medium first, validate, then add Hard. Spec covers Hard so the architecture supports it.
- **Layout at 700×600.** 4 player areas + trick + 13-card hand fan + status bar is tight. Mitigation: card faces in the human fan show ~24px stride; verify legibility during impl. Falls back gracefully if a card is unreadable — top card hover lifts it to full visibility.
- **Pass UX clarity.** Users unfamiliar with Hearts may not know how to pass. Mitigation: status bar shows explicit "Click 3 cards to pass to Jared" prompt; selected cards get a 4px border highlight; Pass button only enabled when exactly 3 selected.
- **Performance on every dispatch.** Reducer copies all 4 hands on each play (immutability). 52 cards is trivially cheap. Worth `React.memo` on the hand fan only if profiling shows hot spots.
- **Test coverage on AI.** AI strategy heuristics are easy to write but hard to assert directly. Mitigation: test legality rigorously (always plays a legal card) + smoke-test specific scenarios per difficulty (e.g., "Medium dumps Q♠ when held in pass").
