// Text tools: exact counts, case changes, slugs, line tidying and find/replace.
'use strict';

const MAX = 500_000;
const STOP = new Set('the a an and or but of to in on at for with is are was were be been it this that as by from i you he she we they my your his her our their its not no so do does did have has had will would can could just than then there here what which who'.split(' '));

const text = (t) => {
  const s = String(t ?? '');
  if (s.length > MAX) throw new Error(`That's more than ${MAX.toLocaleString('en')} characters.`);
  return s;
};

/** Split into words for case changes: handles spaces, punctuation, camelCase and snake_case. */
const wordsOf = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean);

const SMALL = new Set('a an and as at but by for if in nor of on or per the to vs via'.split(' '));
const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w);

const minutes = (n) => {
  if (n < 1) return 'under a minute';
  const m = Math.round(n);
  return m < 60 ? `about ${m} minute${m === 1 ? '' : 's'}` : `about ${Math.floor(m / 60)} h ${m % 60} min`;
};

module.exports.tools = {
  text_stats({ text: t }) {
    const s = text(t);
    const words = s.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
    const sentences = (s.match(/[^.!?…]*[\p{L}\p{N}][^.!?…]*(?:[.!?…]+|$)/gu) ?? []).length;
    const paragraphs = s.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const lines = s ? s.split(/\r?\n/).length : 0;
    const chars = [...s].length;
    const noSpace = [...s.replace(/\s/g, '')].length;
    const freq = new Map();
    for (const w of words) {
      const k = w.toLowerCase();
      if (k.length > 2 && !STOP.has(k)) freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    const top = [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).filter(([, n]) => n > 1);
    const avg = words.length ? (words.reduce((n, w) => n + w.length, 0) / words.length).toFixed(1) : '0';
    const out = [
      `Words: **${words.length.toLocaleString('en')}**`,
      `Characters: ${chars.toLocaleString('en')} (${noSpace.toLocaleString('en')} without spaces)`,
      `Sentences: ${sentences}, paragraphs: ${paragraphs}, lines: ${lines}`,
      `Average word length: ${avg} letters`,
      `Reading time: ${minutes(words.length / 238)}; speaking time: ${minutes(words.length / 140)}`,
    ];
    if (top.length) out.push(`Most used: ${top.map(([w, n]) => `${w} (${n})`).join(', ')}`);
    return { content: out.join('\n'), note: `Counted ${words.length} words` };
  },

  change_case({ text: t, style }) {
    const s = text(t);
    const w = wordsOf(s);
    let out;
    switch (style) {
      case 'upper': out = s.toUpperCase(); break;
      case 'lower': out = s.toLowerCase(); break;
      case 'title':
        out = s.toLowerCase().replace(/[\p{L}\p{N}']+/gu, (word, i) => (i === 0 || !SMALL.has(word) ? cap(word) : word));
        out = out.replace(/([:.!?]\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase());
        break;
      case 'sentence': out = s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase()); break;
      case 'camel': out = w.map((x, i) => (i ? cap(x) : x.toLowerCase())).join(''); break;
      case 'pascal': out = w.map(cap).join(''); break;
      case 'snake': out = w.map((x) => x.toLowerCase()).join('_'); break;
      case 'kebab': out = w.map((x) => x.toLowerCase()).join('-'); break;
      case 'constant': out = w.map((x) => x.toUpperCase()).join('_'); break;
      case 'alternating': {
        let i = 0;
        out = [...s].map((c) => (/\p{L}/u.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c)).join('');
        break;
      }
      default: throw new Error('Unknown style.');
    }
    return { content: out, note: `Changed to ${style} case` };
  },

  make_slug({ text: t, max_length = 80 }) {
    let s = text(t).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
    s = s.replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const max = Math.max(10, Math.min(200, Math.floor(max_length)));
    if (s.length > max) s = s.slice(0, max).replace(/-[^-]*$/, '') || s.slice(0, max);
    if (!s) throw new Error('There are no letters or numbers to make a slug from.');
    return { content: s, note: 'Made a slug' };
  },

  tidy_lines({ text: t, sort = 'none', dedupe = false, ignore_case = false, remove_blank = false, reverse = false, number = false }) {
    let lines = text(t).split(/\r?\n/).map((l) => l.trim());
    const before = lines.length;
    if (remove_blank) lines = lines.filter(Boolean);
    if (dedupe) {
      const seen = new Set();
      lines = lines.filter((l) => {
        const k = ignore_case ? l.toLowerCase() : l;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    const coll = new Intl.Collator('en', { sensitivity: ignore_case ? 'base' : 'variant', numeric: true });
    if (sort === 'az') lines.sort(coll.compare);
    else if (sort === 'za') lines.sort((a, b) => coll.compare(b, a));
    else if (sort === 'length') lines.sort((a, b) => a.length - b.length || coll.compare(a, b));
    else if (sort === 'numeric') lines.sort((a, b) => (parseFloat(a.replace(/[^\d.-]/g, '')) || 0) - (parseFloat(b.replace(/[^\d.-]/g, '')) || 0));
    if (reverse) lines.reverse();
    if (number) lines = lines.map((l, i) => `${i + 1}. ${l}`);
    const removed = before - lines.length;
    return { content: lines.join('\n'), note: `${lines.length} lines${removed ? `, ${removed} removed` : ''}` };
  },

  find_replace({ text: t, find, replace, ignore_case = false, whole_word = false, regex = false }) {
    const s = text(t);
    if (!find) throw new Error('Tell me what to find.');
    let src = regex ? String(find) : String(find).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (whole_word) src = `(?<![\\p{L}\\p{N}_])(?:${src})(?![\\p{L}\\p{N}_])`;
    let re;
    try {
      re = new RegExp(src, `gu${ignore_case ? 'i' : ''}`);
    } catch (e) {
      throw new Error(`That pattern isn't valid: ${e.message}`);
    }
    let count = 0;
    const out = s.replace(re, (...m) => {
      count++;
      if (!regex) return String(replace);
      return String(replace).replace(/\$(\d)/g, (_, d) => m[+d] ?? '');
    });
    return { content: count ? out : `Nothing matched "${find}", so the text is unchanged.`, note: `Replaced ${count}` };
  },
};
