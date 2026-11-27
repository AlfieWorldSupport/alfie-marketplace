// Colour tools: conversions, WCAG contrast and palettes.
'use strict';

// A useful subset of CSS named colours (for reading names and naming the nearest one).
const NAMES = {
  black: '000000', white: 'ffffff', red: 'ff0000', lime: '00ff00', blue: '0000ff', yellow: 'ffff00', cyan: '00ffff', aqua: '00ffff',
  magenta: 'ff00ff', fuchsia: 'ff00ff', silver: 'c0c0c0', gray: '808080', grey: '808080', maroon: '800000', olive: '808000',
  green: '008000', purple: '800080', teal: '008080', navy: '000080', orange: 'ffa500', pink: 'ffc0cb', hotpink: 'ff69b4',
  deeppink: 'ff1493', crimson: 'dc143c', tomato: 'ff6347', coral: 'ff7f50', salmon: 'fa8072', gold: 'ffd700', khaki: 'f0e68c',
  beige: 'f5f5dc', ivory: 'fffff0', lavender: 'e6e6fa', plum: 'dda0dd', violet: 'ee82ee', orchid: 'da70d6', indigo: '4b0082',
  slateblue: '6a5acd', royalblue: '4169e1', dodgerblue: '1e90ff', skyblue: '87ceeb', steelblue: '4682b4', turquoise: '40e0d0',
  aquamarine: '7fffd4', mintcream: 'f5fffa', seagreen: '2e8b57', forestgreen: '228b22', olivedrab: '6b8e23', chartreuse: '7fff00',
  limegreen: '32cd32', darkgreen: '006400', chocolate: 'd2691e', sienna: 'a0522d', brown: 'a52a2a', tan: 'd2b48c', wheat: 'f5deb3',
  peru: 'cd853f', firebrick: 'b22222', darkred: '8b0000', darkorange: 'ff8c00', goldenrod: 'daa520', lightgray: 'd3d3d3',
  darkgray: 'a9a9a9', dimgray: '696969', slategray: '708090', gainsboro: 'dcdcdc', whitesmoke: 'f5f5f5', midnightblue: '191970',
  cornflowerblue: '6495ed', cadetblue: '5f9ea0', rebeccapurple: '663399', mediumpurple: '9370db', thistle: 'd8bfd8', linen: 'faf0e6',
};

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
const toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

function fromHex(h) {
  let s = h.replace(/^#/, '');
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function parse(input) {
  const s = String(input ?? '').trim().toLowerCase();
  if (!s) throw new Error('Tell me a colour.');
  if (NAMES[s.replace(/\s+/g, '')]) return fromHex(NAMES[s.replace(/\s+/g, '')]);
  const hx = fromHex(s);
  if (hx && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/.test(s)) return hx;
  const nums = (s.match(/-?\d*\.?\d+%?/g) ?? []).map((x) => ({ v: parseFloat(x), p: x.endsWith('%') }));
  if (/^rgba?\(/.test(s) && nums.length >= 3) {
    const [r, g, b] = nums.map((n) => (n.p ? (n.v / 100) * 255 : n.v));
    return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) };
  }
  if (/^hsla?\(/.test(s) && nums.length >= 3) return hslToRgb(nums[0].v, clamp(nums[1].v, 0, 100), clamp(nums[2].v, 0, 100));
  throw new Error(`I can't read the colour "${input}". Try #1e90ff, rgb(30, 144, 255), hsl(210, 100%, 56%) or a name like teal.`);
}

const lum = ({ r, g, b }) => {
  const c = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

function nearestName(c) {
  let best = '';
  let dist = Infinity;
  for (const [n, h] of Object.entries(NAMES)) {
    const o = fromHex(h);
    const d = (c.r - o.r) ** 2 + (c.g - o.g) ** 2 + (c.b - o.b) ** 2;
    if (d < dist) [best, dist] = [n, d];
  }
  return { name: best, exact: dist === 0 };
}

const describe = (c) => {
  const h = rgbToHsl(c);
  return `${toHex(c)} · rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}) · hsl(${Math.round(h.h)}, ${Math.round(h.s)}%, ${Math.round(h.l)}%)`;
};

module.exports.tools = {
  convert_colour({ colour }) {
    const c = parse(colour);
    const n = nearestName(c);
    return { content: `${describe(c)}\n${n.exact ? `CSS name: ${n.name}` : `Nearest CSS name: ${n.name}`}\nBest text on it: ${lum(c) > 0.179 ? 'black' : 'white'}`, note: `Converted ${colour}` };
  },

  contrast_check({ text, background }) {
    const r = ratio(parse(text), parse(background));
    const v = Math.floor(r * 100) / 100;
    const mark = (ok) => (ok ? 'passes' : 'fails');
    return {
      content: [
        `Contrast ratio: **${v}:1**`,
        `Normal text: AA ${mark(r >= 4.5)} (needs 4.5), AAA ${mark(r >= 7)} (needs 7)`,
        `Large text (24px, or 19px bold): AA ${mark(r >= 3)} (needs 3), AAA ${mark(r >= 4.5)} (needs 4.5)`,
      ].join('\n'),
      note: `Contrast ${v}:1`,
    };
  },

  make_palette({ colour, kind }) {
    const c = parse(colour);
    const { h, s, l } = rgbToHsl(c);
    let list;
    if (kind === 'shades') list = [95, 85, 70, 55, l, 35, 25, 15].map((L, i) => ({ label: i === 4 ? 'base' : `${Math.round(L)}% light`, c: hslToRgb(h, s, L) }));
    else {
      const offsets = { complementary: [0, 180], triadic: [0, 120, 240], analogous: [-30, 0, 30], split: [0, 150, 210] }[kind];
      if (!offsets) throw new Error('Unknown kind.');
      list = offsets.map((o) => ({ label: o === 0 ? 'base' : `${o > 0 ? '+' : ''}${o}°`, c: o === 0 ? c : hslToRgb(h + o, s, l) }));
    }
    return { content: list.map((x) => `${x.label}: ${describe(x.c)}`).join('\n'), note: `Made a ${kind} palette` };
  },
};
