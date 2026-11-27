// Dice and chance: dice notation, coins, random picks and cards. Uses crypto.randomInt for fair results.
'use strict';
const { randomInt } = require('node:crypto');

const MAX_DICE = 200;
const MAX_SIDES = 1000;

/** Fisher-Yates shuffle (copy). */
function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One expression like 4d6k3+2, d%, 2d20kl1 or 3d6-1+d4. */
function rollOne(expr) {
  const src = expr.replace(/\s+/g, '').toLowerCase();
  if (!src) throw new Error('Empty roll.');
  const parts = src.match(/[+-]?[^+-]+/g);
  if (!parts || parts.join('') !== src) throw new Error(`I can't read "${expr}". Try something like 2d6+3.`);
  let total = 0;
  const shown = [];
  for (const raw of parts) {
    const sign = raw[0] === '-' ? -1 : 1;
    const term = raw.replace(/^[+-]/, '');
    const m = term.match(/^(\d*)d(\d+|%)(?:(kh|kl|k|dh|dl|d)(\d+))?$/);
    if (!m) {
      if (!/^\d+$/.test(term)) throw new Error(`I can't read "${term}" in "${expr}".`);
      total += sign * Number(term);
      shown.push(`${sign < 0 ? '-' : '+'} ${term}`);
      continue;
    }
    const n = m[1] === '' ? 1 : Number(m[1]);
    const sides = m[2] === '%' ? 100 : Number(m[2]);
    if (n < 1 || n > MAX_DICE) throw new Error(`Between 1 and ${MAX_DICE} dice, please.`);
    if (sides < 2 || sides > MAX_SIDES) throw new Error(`Dice need 2 to ${MAX_SIDES} sides.`);
    const rolls = Array.from({ length: n }, () => randomInt(1, sides + 1));
    let kept = rolls.map((v, i) => ({ v, i, keep: true }));
    if (m[3]) {
      const k = Number(m[4]);
      const byHigh = kept.slice().sort((a, b) => b.v - a.v);
      const keepSet = new Set(
        (m[3] === 'k' || m[3] === 'kh' ? byHigh.slice(0, k)
          : m[3] === 'kl' ? byHigh.slice().reverse().slice(0, k)
          : m[3] === 'd' || m[3] === 'dl' ? byHigh.slice(0, Math.max(0, n - k))
          : byHigh.slice().reverse().slice(0, Math.max(0, n - k))).map((x) => x.i),
      );
      kept = kept.map((x) => ({ ...x, keep: keepSet.has(x.i) }));
    }
    const sum = kept.filter((x) => x.keep).reduce((s, x) => s + x.v, 0);
    total += sign * sum;
    const list = kept.map((x) => (x.keep ? String(x.v) : `~~${x.v}~~`)).join(', ');
    shown.push(`${sign < 0 ? '-' : '+'} ${term} [${list}]`);
  }
  const text = shown.join(' ').replace(/^\+ /, '');
  return { total, text };
}

module.exports.tools = {
  roll_dice({ dice }) {
    const exprs = String(dice ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!exprs.length) throw new Error('Tell me what to roll, e.g. 2d6+3.');
    if (exprs.length > 20) throw new Error('Up to 20 rolls at a time.');
    const results = exprs.map((e) => ({ e, ...rollOne(e) }));
    const content = results.map((r) => `${r.e}: **${r.total}** (${r.text})`).join('\n');
    const note = results.length === 1 ? `Rolled ${results[0].e}: ${results[0].total}` : `Rolled ${results.length} times`;
    return { content: `${content}\n(Struck-through dice weren't kept.)`, note };
  },

  flip_coin({ count = 1 } = {}) {
    const n = Math.min(100, Math.max(1, Math.floor(Number(count) || 1)));
    const flips = Array.from({ length: n }, () => (randomInt(2) ? 'heads' : 'tails'));
    if (n === 1) return { content: `It's **${flips[0]}**.`, note: `Flipped a coin: ${flips[0]}` };
    const heads = flips.filter((f) => f === 'heads').length;
    return { content: `${flips.join(', ')}\nHeads: ${heads}, tails: ${n - heads}`, note: `Flipped ${n} coins` };
  },

  pick_random({ options, count = 1, shuffle = false }) {
    const list = (Array.isArray(options) ? options : []).map((o) => String(o).trim()).filter(Boolean);
    if (!list.length) throw new Error('Give me a list to pick from.');
    const mixed = shuffled(list);
    if (shuffle) return { content: mixed.map((o, i) => `${i + 1}. ${o}`).join('\n'), note: `Shuffled ${list.length} things` };
    const n = Math.min(list.length, Math.max(1, Math.floor(Number(count) || 1)));
    const picked = mixed.slice(0, n);
    return { content: n === 1 ? `Picked: **${picked[0]}**` : `Picked: ${picked.join(', ')}`, note: n === 1 ? `Picked ${picked[0]}` : `Picked ${n}` };
  },

  random_number({ min, max }) {
    let a = Math.ceil(Number(min));
    let b = Math.floor(Number(max));
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('min and max must be numbers.');
    if (a > b) [a, b] = [b, a];
    if (b - a >= 2 ** 48 - 1) throw new Error('That range is too big.');
    const n = randomInt(a, b + 1);
    return { content: `**${n}** (between ${a} and ${b})`, note: `Random number: ${n}` };
  },

  draw_cards({ count = 1, jokers = false } = {}) {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = suits.flatMap((s) => ranks.map((r) => `${r}${s}`));
    if (jokers) deck.push('Joker', 'Joker');
    const n = Math.min(deck.length, Math.max(1, Math.floor(Number(count) || 1)));
    const hand = shuffled(deck).slice(0, n);
    return { content: hand.join('  '), note: `Drew ${n} card${n === 1 ? '' : 's'}` };
  },
};
