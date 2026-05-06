import {
  legalCardsForLead,
  legalCardsForFollow,
  type Card,
  type Difficulty,
  type PassDirection,
  type Trick,
} from './engine';

export function chooseAiPass(hand: Card[], direction: PassDirection, difficulty: Difficulty): Card[] {
  if (direction === 'keep') return [];
  if (difficulty === 'easy') return easyPass(hand);
  if (difficulty === 'medium') return mediumPass(hand);
  return hardPass(hand, direction);
}

export function chooseAiPlay(
  hand: Card[],
  trick: Trick,
  history: Card[],
  heartsBroken: boolean,
  isFirstTrick: boolean,
  difficulty: Difficulty,
): Card {
  const legal = trick.plays.length === 0
    ? legalCardsForLead(hand, heartsBroken, isFirstTrick)
    : legalCardsForFollow(hand, trick, heartsBroken, isFirstTrick);
  if (legal.length === 0) throw new Error('no legal cards');
  if (difficulty === 'easy') return legal[Math.floor(Math.random() * legal.length)];
  if (difficulty === 'medium') return mediumPlay(legal, hand, trick, isFirstTrick);
  return hardPlay(legal, hand, trick, history, heartsBroken, isFirstTrick);
}

function easyPass(hand: Card[]): Card[] {
  const shuffled = hand.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function mediumPass(hand: Card[]): Card[] {
  const targets = hand.filter((c) => c.suit === 'spades' && c.rank >= 12);
  if (targets.length >= 3) return targets.slice(0, 3);
  const remaining = hand.filter((c) => !targets.some((t) => t.id === c.id));
  const bySuit: Record<string, Card[]> = {};
  for (const c of remaining) {
    bySuit[c.suit] = bySuit[c.suit] ?? [];
    bySuit[c.suit].push(c);
  }
  const suitsAsc = Object.values(bySuit).sort((a, b) => a.length - b.length);
  const filler: Card[] = [];
  for (const suit of suitsAsc) {
    suit.sort((a, b) => b.rank - a.rank);
    for (const card of suit) {
      if (targets.length + filler.length >= 3) break;
      filler.push(card);
    }
  }
  return [...targets, ...filler].slice(0, 3);
}

function mediumPlay(legal: Card[], _hand: Card[], trick: Trick, _isFirstTrick: boolean): Card {
  if (trick.plays.length === 0) {
    const nonHearts = legal.filter((c) => c.suit !== 'hearts');
    const pool = nonHearts.length > 0 ? nonHearts : legal;
    return pool.slice().sort((a, b) => a.rank - b.rank)[0];
  }
  const lead = trick.leadSuit!;
  const inSuit = trick.plays.filter((p) => p.card.suit === lead);
  const currentBest = inSuit.reduce((best, p) => p.card.rank > best.card.rank ? p : best, inSuit[0]).card;
  const myInSuit = legal.filter((c) => c.suit === lead);
  if (myInSuit.length === 0) {
    const qs = legal.find((c) => c.id === 'QS');
    if (qs) return qs;
    const highSpade = legal.filter((c) => c.suit === 'spades').sort((a, b) => b.rank - a.rank)[0];
    if (highSpade && highSpade.rank >= 12) return highSpade;
    return legal.slice().sort((a, b) => b.rank - a.rank)[0];
  }
  const under = myInSuit.filter((c) => c.rank < currentBest.rank);
  if (under.length > 0) {
    return under.slice().sort((a, b) => b.rank - a.rank)[0];
  }
  return myInSuit.slice().sort((a, b) => a.rank - b.rank)[0];
}
function hasMoonPotential(hand: Card[]): boolean {
  const hearts = hand.filter((c) => c.suit === 'hearts');
  const hasQS = hand.some((c) => c.id === 'QS');
  const highSpades = hand.filter((c) => c.suit === 'spades' && c.rank >= 12);
  return hearts.length >= 5 && hasQS && highSpades.length >= 2;
}

function hardPass(hand: Card[], _direction: PassDirection): Card[] {
  if (hasMoonPotential(hand)) {
    const lowNonPoints = hand
      .filter((c) => !(c.suit === 'spades' && c.rank === 12) && c.suit !== 'hearts')
      .sort((a, b) => a.rank - b.rank);
    if (lowNonPoints.length >= 3) return lowNonPoints.slice(0, 3);
  }
  return mediumPass(hand);
}

function hardPlay(
  legal: Card[],
  hand: Card[],
  trick: Trick,
  _history: Card[],
  _heartsBroken: boolean,
  isFirstTrick: boolean,
): Card {
  if (hasMoonPotential(hand)) {
    if (trick.plays.length === 0) {
      const highSpades = legal.filter((c) => c.suit === 'spades').sort((a, b) => b.rank - a.rank);
      if (highSpades.length > 0) return highSpades[0];
    } else {
      const lead = trick.leadSuit!;
      const inSuit = legal.filter((c) => c.suit === lead);
      if (inSuit.length > 0) return inSuit.slice().sort((a, b) => b.rank - a.rank)[0];
    }
  }
  return mediumPlay(legal, hand, trick, isFirstTrick);
}
