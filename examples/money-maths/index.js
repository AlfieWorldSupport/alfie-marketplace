// Money maths: bill splitting, percentages, loans, savings and sales tax. Amounts are worked in cents where it matters.
'use strict';

const num = (v, name) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number.`);
  return n;
};

const money = (n, cur) => {
  const s = Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const c = String(cur ?? '').trim().slice(0, 5);
  const signed = n < 0 ? '-' : '';
  if (!c) return `${signed}${s}`;
  return /^[A-Za-z]{3}$/.test(c) ? `${signed}${s} ${c.toUpperCase()}` : `${signed}${c}${s}`;
};

const pct = (n) => `${Number(n.toFixed(2))}%`;

module.exports.tools = {
  split_bill({ total, people, tip_percent = 0, currency }) {
    const t = num(total, 'total');
    const p = Math.floor(num(people, 'people'));
    if (t < 0 || p < 1) throw new Error('The total can’t be negative and there must be at least one person.');
    const tip = Math.round(t * num(tip_percent, 'tip_percent')); // cents, since t*% /100*100
    const cents = Math.round(t * 100) + tip;
    const each = Math.floor(cents / p);
    const extra = cents - each * p; // a few people pay one cent more so it adds up exactly
    const lines = [
      `Bill: ${money(t, currency)}${tip ? ` + ${pct(tip_percent)} tip ${money(tip / 100, currency)} = ${money(cents / 100, currency)}` : ''}`,
      `Each of ${p}: **${money(each / 100, currency)}**`,
    ];
    if (extra) lines.push(`(${extra} ${extra === 1 ? 'person pays' : 'people pay'} ${money((each + 1) / 100, currency)} so it adds up exactly.)`);
    return { content: lines.join('\n'), note: `Split ${money(cents / 100, currency)} ${p} ways` };
  },

  percent({ mode, a, b }) {
    const x = num(a, 'a');
    const y = num(b, 'b');
    const r = (n) => Number(n.toFixed(6)).toLocaleString('en', { maximumFractionDigits: 4 });
    switch (mode) {
      case 'of':
        return `${pct(x)} of ${r(y)} = **${r((x / 100) * y)}**`;
      case 'discount': {
        const off = (x / 100) * y;
        return `${r(y)} with ${pct(x)} off = **${r(y - off)}** (you save ${r(off)})`;
      }
      case 'change':
        if (x === 0) throw new Error('Can’t work out a percentage change from zero.');
        return `From ${r(x)} to ${r(y)} is a **${(y >= x ? '+' : '') + Number((((y - x) / Math.abs(x)) * 100).toFixed(2))}%** change`;
      case 'is_what_percent':
        if (y === 0) throw new Error('The whole can’t be zero.');
        return `${r(x)} is **${pct((x / y) * 100)}** of ${r(y)}`;
      default:
        throw new Error('Unknown mode.');
    }
  },

  loan_payment({ amount, annual_rate_percent, years, currency }) {
    const P = num(amount, 'amount');
    const n = Math.round(num(years, 'years') * 12);
    if (n < 1) throw new Error('The loan must last at least a month.');
    const i = num(annual_rate_percent, 'annual_rate_percent') / 100 / 12;
    const m = i === 0 ? P / n : (P * i) / (1 - (1 + i) ** -n);
    const total = m * n;
    return {
      content: [
        `Borrowing ${money(P, currency)} over ${n} months at ${pct(annual_rate_percent)} a year:`,
        `Monthly payment: **${money(m, currency)}**`,
        `Total paid: ${money(total, currency)} (interest ${money(total - P, currency)})`,
        'A fixed-rate estimate; a lender’s fees and exact terms change the real figure.',
      ].join('\n'),
      note: `Repayment ${money(m, currency)}/month`,
    };
  },

  savings_growth({ start, monthly_deposit = 0, annual_rate_percent, years, currency }) {
    let bal = num(start, 'start');
    const dep = num(monthly_deposit, 'monthly_deposit');
    const n = Math.round(num(years, 'years') * 12);
    const i = num(annual_rate_percent, 'annual_rate_percent') / 100 / 12;
    const yearly = [];
    for (let k = 1; k <= n; k++) {
      bal = bal * (1 + i) + dep;
      if (k % 12 === 0 && yearly.length < 80) yearly.push(bal);
    }
    const paidIn = num(start, 'start') + dep * n;
    const milestones = yearly.length > 1 ? `\nAfter ${[1, 5, 10, 20, 30].filter((y) => y <= yearly.length).map((y) => `${y} yr: ${money(yearly[y - 1], currency)}`).join(' · ')}` : '';
    return {
      content: `After ${n} months: **${money(bal, currency)}**\nPaid in: ${money(paidIn, currency)}, growth: ${money(bal - paidIn, currency)}${milestones}\nAssumes the rate stays the same and is added monthly.`,
      note: `Grows to ${money(bal, currency)}`,
    };
  },

  sales_tax({ price, rate_percent, includes_tax = false, currency }) {
    const p = num(price, 'price');
    const r = num(rate_percent, 'rate_percent') / 100;
    const net = includes_tax ? p / (1 + r) : p;
    const gross = includes_tax ? p : p * (1 + r);
    return {
      content: `Before tax: **${money(net, currency)}**\nTax (${pct(r * 100)}): ${money(gross - net, currency)}\nWith tax: **${money(gross, currency)}**`,
      note: `Tax ${money(gross - net, currency)}`,
    };
  },
};
