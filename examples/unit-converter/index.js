// Example Alfie skill. Alfie runs this file in its own process and calls the functions in `tools` with the
// arguments she chose (already shaped by the "parameters" in skill.json). Return a string, or
// { content, note }: `content` is what she reads, `note` the short line shown under her reply.
'use strict';

// Factor to a base unit per kind (m, g, l). Temperatures are handled separately.
const UNITS = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  mass: { mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237, st: 6350.29318 },
  volume: { ml: 0.001, l: 1, tsp: 0.00492892, tbsp: 0.0147868, cup: 0.236588, floz: 0.0295735, pt: 0.473176, qt: 0.946353, gal: 3.78541 },
};
const TEMPS = ['c', 'f', 'k'];

const toC = (v, u) => (u === 'c' ? v : u === 'f' ? ((v - 32) * 5) / 9 : v - 273.15);
const fromC = (v, u) => (u === 'c' ? v : u === 'f' ? (v * 9) / 5 + 32 : v + 273.15);
const round = (n) => Number(n.toPrecision(8));

module.exports.tools = {
  convert_units({ value, from, to }) {
    const f = String(from).trim().toLowerCase();
    const t = String(to).trim().toLowerCase();
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('value must be a number');
    if (TEMPS.includes(f) && TEMPS.includes(t)) {
      const r = round(fromC(toC(value, f), t));
      return { content: `${value} °${f.toUpperCase()} = ${r} °${t.toUpperCase()}`, note: `Converted ${value} ${from} to ${to}` };
    }
    for (const [kind, table] of Object.entries(UNITS)) {
      if (f in table && t in table) {
        const r = round((value * table[f]) / table[t]);
        return { content: `${value} ${f} = ${r} ${t} (${kind})`, note: `Converted ${value} ${from} to ${to}` };
      }
    }
    throw new Error(`Can't convert ${from} to ${to} (different kinds of unit, or a unit I don't know).`);
  },

  days_between({ start, end }) {
    const a = Date.parse(`${start}T00:00:00Z`);
    const b = Date.parse(`${end}T00:00:00Z`);
    if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('Dates must look like 2026-12-25.');
    const days = Math.round((b - a) / 86_400_000);
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ${days >= 0 ? 'from' : 'before'} ${start} to ${end}`;
  },
};
