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

// Stubs to be filled in by Tasks 11/12.
function mediumPass(hand: Card[]): Card[] { return easyPass(hand); }
function mediumPlay(legal: Card[], _hand: Card[], _trick: Trick, _isFirstTrick: boolean): Card {
  return legal[Math.floor(Math.random() * legal.length)];
}
function hardPass(hand: Card[], _direction: PassDirection): Card[] { return mediumPass(hand); }
function hardPlay(legal: Card[], hand: Card[], trick: Trick, _history: Card[], _heartsBroken: boolean, isFirstTrick: boolean): Card {
  return mediumPlay(legal, hand, trick, isFirstTrick);
}
