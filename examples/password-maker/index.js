// Password maker: random passwords, passphrases and PINs (crypto.randomInt), plus an offline strength estimate.
'use strict';
const { randomInt } = require('node:crypto');

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!#$%&*+-=?@^_~';
const LOOKALIKES = /[0Oo1lI]/g;

// 256 short, common, easy-to-spell words: 8 bits each.
const WORDS = (
  'acorn amber anchor apple apron arrow atlas autumn bacon badge bakery bamboo banana banjo barn basil beach beacon ' +
  'beaver berry bicycle biscuit blanket blossom bramble breeze brick bridge brook bubble bucket bumble butter button ' +
  'cabin cactus camel candle canoe canyon carrot castle cedar cello cherry chess chimney cinema circus citrus cloud ' +
  'clover cobalt cocoa comet compass copper coral cotton cousin cradle crayon cricket crystal cupcake daisy dancer ' +
  'dawn desert diamond dinner dolphin donkey dragon drizzle drum eagle echo elbow ember engine falcon feather fern ' +
  'fiddle fig firefly flame flint forest fossil fountain fox garden garlic gentle giant ginger glacier globe goose ' +
  'grape gravel guitar hammer harbor harvest hazel hedgehog helmet hero honey horizon hornet iceberg igloo island ' +
  'ivory jacket jasmine jelly jigsaw jungle kayak kettle kitten koala ladder lagoon lantern lemon library lily lion ' +
  'llama lobster locket lunar magnet mango maple marble meadow melon meteor mint mitten monkey moose mosaic muffin ' +
  'nectar needle noodle nutmeg oasis ocean olive onion orbit orchid otter owl paddle panda paper parrot peach pebble ' +
  'pepper piano pickle pigeon pillow pirate planet plum pocket pony poppy potato prairie pretzel puffin pumpkin puzzle ' +
  'quartz quill rabbit radar rainbow raven ribbon river robin rocket rose saddle saffron sailor salmon sandal ' +
  'saturn scarf shadow shell silver sketch sled slipper snail sparrow spider spoon spruce squash squid star ' +
  'storm sugar summit sunny swan tango teapot thistle thunder tiger toast tomato topaz tractor trumpet tulip turtle ' +
  'umbrella valley velvet violet volcano waffle walnut walrus wander whale whisker willow window winter wizard yacht'
).split(' ');

const pick = (s) => s[randomInt(s.length)];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function onePassword(length, symbols, avoid) {
  const sets = [LOWER, UPPER, DIGITS, ...(symbols ? [SYMBOLS] : [])].map((s) => (avoid ? s.replace(LOOKALIKES, '') : s));
  const all = sets.join('');
  // One from each set, so every kind is there, then the rest from all of them.
  const chars = sets.map(pick);
  while (chars.length < length) chars.push(pick(all));
  return { pw: shuffle(chars).join(''), bits: Math.floor(length * Math.log2(all.length)) };
}

function strengthWord(bits) {
  if (bits < 28) return 'very weak';
  if (bits < 40) return 'weak';
  if (bits < 60) return 'fair';
  if (bits < 80) return 'strong';
  return 'very strong';
}

const COMMON = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'iloveyou', 'admin', 'monkey', 'dragon', 'football', 'baseball', 'abc123', 'sunshine', 'princess', 'master', 'shadow'];

module.exports.tools = {
  make_password({ length = 20, symbols = true, avoid_lookalikes = true, count = 1 } = {}) {
    const len = Math.min(128, Math.max(8, Math.floor(Number(length) || 20)));
    const n = Math.min(10, Math.max(1, Math.floor(Number(count) || 1)));
    const made = Array.from({ length: n }, () => onePassword(len, symbols !== false, avoid_lookalikes !== false));
    const lines = made.map((m) => `\`${m.pw}\``).join('\n');
    return { content: `${lines}\nAbout ${made[0].bits} bits of randomness each (${strengthWord(made[0].bits)}).`, note: `Made ${n} password${n === 1 ? '' : 's'}` };
  },

  make_passphrase({ words = 5, separator = '-', add_number = true, capitalise = false } = {}) {
    const n = Math.min(12, Math.max(3, Math.floor(Number(words) || 5)));
    const sep = typeof separator === 'string' ? separator.slice(0, 3) : '-';
    let list = Array.from({ length: n }, () => pick(WORDS));
    if (capitalise) list = list.map((w) => w[0].toUpperCase() + w.slice(1));
    if (add_number !== false) list.push(String(randomInt(10, 100)));
    const bits = Math.floor(n * Math.log2(WORDS.length) + (add_number !== false ? Math.log2(90) : 0));
    return { content: `\`${list.join(sep)}\`\nAbout ${bits} bits of randomness (${strengthWord(bits)}).`, note: 'Made a passphrase' };
  },

  make_pin({ digits = 6 } = {}) {
    const n = Math.min(12, Math.max(4, Math.floor(Number(digits) || 6)));
    let pin;
    do pin = Array.from({ length: n }, () => pick(DIGITS)).join('');
    while (/^(\d)\1+$/.test(pin) || '01234567890123'.includes(pin) || '98765432109876'.includes(pin));
    return { content: `\`${pin}\``, note: `Made a ${n}-digit PIN` };
  },

  check_strength({ password }) {
    const pw = String(password ?? '');
    if (!pw) throw new Error('Give me a password to check.');
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
    let bits = pw.length * Math.log2(Math.max(pool, 2));
    const tips = [];
    const lower = pw.toLowerCase().replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!]/g, 'i').replace(/0/g, 'o').replace(/[$5]/g, 's');
    if (COMMON.some((c) => lower.includes(c))) { bits = Math.min(bits, 20); tips.push('it contains a very common password'); }
    if (/(.)\1{2,}/.test(pw)) { bits -= 10; tips.push('it repeats the same character'); }
    if (/(?:abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer|asd|zxc)/i.test(pw)) { bits -= 10; tips.push('it has an easy sequence like 123 or qwe'); }
    if (/(19|20)\d\d/.test(pw)) { bits -= 6; tips.push('it looks like it has a year in it'); }
    if (pw.length < 12) tips.push('it is shorter than 12 characters');
    if (pool <= 26) tips.push('it uses only one kind of character');
    bits = Math.max(0, Math.round(bits));
    const word = strengthWord(bits);
    const why = tips.length ? ` Weaker because ${tips.join('; ')}.` : '';
    return { content: `That password looks **${word}** (roughly ${bits} bits).${why} This is an estimate made on this computer; nothing was sent or saved.`, note: `Strength: ${word}` };
  },
};
