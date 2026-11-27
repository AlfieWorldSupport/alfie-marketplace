// World clock: times around the world with Intl (the computer's own time zone data), no internet needed.
'use strict';

// Common places → IANA zones. Anything else is tried as an IANA zone, then matched against the zone list by city.
const PLACES = {
  london: 'Europe/London', uk: 'Europe/London', 'united kingdom': 'Europe/London', england: 'Europe/London', scotland: 'Europe/London', edinburgh: 'Europe/London', manchester: 'Europe/London',
  dublin: 'Europe/Dublin', ireland: 'Europe/Dublin', lisbon: 'Europe/Lisbon', portugal: 'Europe/Lisbon',
  paris: 'Europe/Paris', france: 'Europe/Paris', berlin: 'Europe/Berlin', germany: 'Europe/Berlin', munich: 'Europe/Berlin',
  madrid: 'Europe/Madrid', spain: 'Europe/Madrid', barcelona: 'Europe/Madrid', rome: 'Europe/Rome', italy: 'Europe/Rome', milan: 'Europe/Rome',
  amsterdam: 'Europe/Amsterdam', netherlands: 'Europe/Amsterdam', brussels: 'Europe/Brussels', belgium: 'Europe/Brussels',
  zurich: 'Europe/Zurich', geneva: 'Europe/Zurich', switzerland: 'Europe/Zurich', vienna: 'Europe/Vienna', austria: 'Europe/Vienna',
  stockholm: 'Europe/Stockholm', sweden: 'Europe/Stockholm', oslo: 'Europe/Oslo', norway: 'Europe/Oslo', copenhagen: 'Europe/Copenhagen', denmark: 'Europe/Copenhagen',
  helsinki: 'Europe/Helsinki', finland: 'Europe/Helsinki', warsaw: 'Europe/Warsaw', poland: 'Europe/Warsaw', prague: 'Europe/Prague',
  athens: 'Europe/Athens', greece: 'Europe/Athens', istanbul: 'Europe/Istanbul', turkey: 'Europe/Istanbul', kyiv: 'Europe/Kyiv', kiev: 'Europe/Kyiv', ukraine: 'Europe/Kyiv',
  moscow: 'Europe/Moscow', cairo: 'Africa/Cairo', egypt: 'Africa/Cairo', lagos: 'Africa/Lagos', nigeria: 'Africa/Lagos', nairobi: 'Africa/Nairobi', kenya: 'Africa/Nairobi',
  johannesburg: 'Africa/Johannesburg', 'cape town': 'Africa/Johannesburg', 'south africa': 'Africa/Johannesburg',
  dubai: 'Asia/Dubai', uae: 'Asia/Dubai', 'abu dhabi': 'Asia/Dubai', riyadh: 'Asia/Riyadh', 'saudi arabia': 'Asia/Riyadh', tehran: 'Asia/Tehran', 'tel aviv': 'Asia/Jerusalem', jerusalem: 'Asia/Jerusalem', israel: 'Asia/Jerusalem',
  karachi: 'Asia/Karachi', pakistan: 'Asia/Karachi', delhi: 'Asia/Kolkata', 'new delhi': 'Asia/Kolkata', mumbai: 'Asia/Kolkata', bangalore: 'Asia/Kolkata', bengaluru: 'Asia/Kolkata', india: 'Asia/Kolkata', kolkata: 'Asia/Kolkata',
  dhaka: 'Asia/Dhaka', bangladesh: 'Asia/Dhaka', kathmandu: 'Asia/Kathmandu', nepal: 'Asia/Kathmandu', bangkok: 'Asia/Bangkok', thailand: 'Asia/Bangkok',
  jakarta: 'Asia/Jakarta', hanoi: 'Asia/Bangkok', 'ho chi minh city': 'Asia/Ho_Chi_Minh', vietnam: 'Asia/Ho_Chi_Minh', singapore: 'Asia/Singapore', 'kuala lumpur': 'Asia/Kuala_Lumpur', malaysia: 'Asia/Kuala_Lumpur',
  manila: 'Asia/Manila', philippines: 'Asia/Manila', 'hong kong': 'Asia/Hong_Kong', beijing: 'Asia/Shanghai', shanghai: 'Asia/Shanghai', china: 'Asia/Shanghai', shenzhen: 'Asia/Shanghai',
  taipei: 'Asia/Taipei', taiwan: 'Asia/Taipei', seoul: 'Asia/Seoul', 'south korea': 'Asia/Seoul', korea: 'Asia/Seoul', tokyo: 'Asia/Tokyo', japan: 'Asia/Tokyo', osaka: 'Asia/Tokyo',
  perth: 'Australia/Perth', adelaide: 'Australia/Adelaide', darwin: 'Australia/Darwin', brisbane: 'Australia/Brisbane', sydney: 'Australia/Sydney', melbourne: 'Australia/Melbourne', canberra: 'Australia/Sydney', hobart: 'Australia/Hobart',
  auckland: 'Pacific/Auckland', wellington: 'Pacific/Auckland', 'new zealand': 'Pacific/Auckland', honolulu: 'Pacific/Honolulu', hawaii: 'Pacific/Honolulu',
  anchorage: 'America/Anchorage', alaska: 'America/Anchorage', 'los angeles': 'America/Los_Angeles', la: 'America/Los_Angeles', 'san francisco': 'America/Los_Angeles', seattle: 'America/Los_Angeles', vancouver: 'America/Vancouver', portland: 'America/Los_Angeles', 'las vegas': 'America/Los_Angeles',
  phoenix: 'America/Phoenix', arizona: 'America/Phoenix', denver: 'America/Denver', calgary: 'America/Edmonton', 'salt lake city': 'America/Denver',
  chicago: 'America/Chicago', houston: 'America/Chicago', dallas: 'America/Chicago', austin: 'America/Chicago', 'mexico city': 'America/Mexico_City', mexico: 'America/Mexico_City', winnipeg: 'America/Winnipeg',
  'new york': 'America/New_York', nyc: 'America/New_York', boston: 'America/New_York', washington: 'America/New_York', 'washington dc': 'America/New_York', miami: 'America/New_York', atlanta: 'America/New_York', toronto: 'America/Toronto', montreal: 'America/Toronto', ottawa: 'America/Toronto',
  halifax: 'America/Halifax', "st john's": 'America/St_Johns', bogota: 'America/Bogota', colombia: 'America/Bogota', lima: 'America/Lima', peru: 'America/Lima',
  santiago: 'America/Santiago', chile: 'America/Santiago', 'buenos aires': 'America/Argentina/Buenos_Aires', argentina: 'America/Argentina/Buenos_Aires', 'sao paulo': 'America/Sao_Paulo', 'são paulo': 'America/Sao_Paulo', rio: 'America/Sao_Paulo', 'rio de janeiro': 'America/Sao_Paulo', brazil: 'America/Sao_Paulo',
  reykjavik: 'Atlantic/Reykjavik', iceland: 'Atlantic/Reykjavik', utc: 'UTC', gmt: 'UTC',
};

function validZone(z) {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: z });
    return true;
  } catch {
    return false;
  }
}

function zoneFor(place) {
  const raw = String(place ?? '').trim();
  const key = raw.toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
  if (!key) throw new Error('Tell me a place.');
  if (PLACES[key]) return { zone: PLACES[key], label: raw };
  if (validZone(raw)) return { zone: raw, label: raw };
  const city = key.replace(/ /g, '_');
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  const hit = all.find((z) => z.toLowerCase().split('/').pop() === city);
  if (hit) return { zone: hit, label: raw };
  throw new Error(`I don't know the time zone for "${raw}". Try a nearby big city, or a zone like Europe/Paris.`);
}

/** Wall-clock parts of an instant in a zone. */
function partsIn(date, zone) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** The instant when the wall clock in `zone` reads y-mo-d h:mi (two passes handle DST). */
function instantFor(y, mo, d, h, mi, zone) {
  const want = Date.UTC(y, mo - 1, d, h, mi);
  let t = want;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(new Date(t), zone);
    t += want - Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
  }
  return new Date(t);
}

function offsetText(date, zone) {
  const p = partsIn(date, zone);
  const mins = Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  const sign = mins >= 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? `:${String(a % 60).padStart(2, '0')}` : ''}`;
}

const show = (date, zone) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);

function parseTime(s) {
  const m = String(s ?? '').trim().toLowerCase().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/);
  if (!m) throw new Error(`I can't read the time "${s}". Use 15:30 or 3:30pm.`);
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  if (m[3]) {
    if (h < 1 || h > 12) throw new Error(`"${s}" isn't a valid time.`);
    h = (h % 12) + (m[3] === 'pm' ? 12 : 0);
  }
  if (h > 23 || mi > 59) throw new Error(`"${s}" isn't a valid time.`);
  return { h, mi };
}

function parseDate(s, zone) {
  if (!s) {
    const p = partsIn(new Date(), zone);
    return { y: p.y, mo: p.mo, d: p.d };
  }
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Dates look like 2026-12-25.');
  return { y: +m[1], mo: +m[2], d: +m[3] };
}

module.exports.tools = {
  time_in({ places }) {
    const now = new Date();
    const lines = (places ?? []).map((pl) => {
      const { zone, label } = zoneFor(pl);
      return `${label}: **${show(now, zone)}** (${offsetText(now, zone)}, ${zone})`;
    });
    if (!lines.length) throw new Error('Tell me at least one place.');
    return { content: lines.join('\n'), note: `Checked the time in ${lines.length} place${lines.length === 1 ? '' : 's'}` };
  },

  convert_time({ time, date, from, to }) {
    const src = zoneFor(from);
    const { h, mi } = parseTime(time);
    const { y, mo, d } = parseDate(date, src.zone);
    const at = instantFor(y, mo, d, h, mi, src.zone);
    const back = partsIn(at, src.zone);
    const gap = back.h !== h || back.mi !== mi ? ' (that time is skipped by a daylight-saving change there; shown as the moment after)' : '';
    const lines = [`${src.label}: **${show(at, src.zone)}** (${offsetText(at, src.zone)})${gap}`];
    for (const t of to ?? []) {
      const z = zoneFor(t);
      lines.push(`${z.label}: **${show(at, z.zone)}** (${offsetText(at, z.zone)})`);
    }
    return { content: lines.join('\n'), note: `Converted ${time} ${src.label}` };
  },

  meeting_times({ places, date, start_hour = 9, end_hour = 18 }) {
    const zones = (places ?? []).map(zoneFor);
    if (zones.length < 2) throw new Error('Give me at least two places.');
    const s = Math.max(0, Math.min(23, Math.floor(start_hour)));
    const e = Math.max(s + 1, Math.min(24, Math.floor(end_hour)));
    const { y, mo, d } = parseDate(date, zones[0].zone);
    const dayStart = instantFor(y, mo, d, 0, 0, zones[0].zone).getTime();
    const good = [];
    for (let i = 0; i < 48; i++) {
      const at = new Date(dayStart + i * 30 * 60000);
      if (zones.every((z) => {
        const p = partsIn(at, z.zone);
        const h = p.h + p.mi / 60;
        return h >= s && h + 0.5 <= e;
      })) good.push(at);
    }
    if (!good.length) return { content: `No half hour on that day is between ${s}:00 and ${e}:00 in all of ${zones.map((z) => z.label).join(', ')}. Try widening the hours.`, note: 'No shared working hours' };
    const fmt = (at, z) => new Intl.DateTimeFormat('en-GB', { timeZone: z, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
    const first = good[0];
    const last = new Date(good[good.length - 1].getTime() + 30 * 60000);
    const lines = zones.map((z) => `${z.label}: ${fmt(first, z.zone)}–${fmt(last, z.zone)}`);
    return { content: `Times that are within ${s}:00–${e}:00 everywhere (${good.length / 2} hour${good.length === 2 ? '' : 's'}):\n${lines.join('\n')}`, note: 'Found shared hours' };
  },
};
