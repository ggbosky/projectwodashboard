import { RATES, STAGES, PACKAGES } from './data';

// Tým je dynamický (v ostrém režimu se načítá z databáze), proto ho držíme v registru.
let team = [];
export const setTeam = (t) => { team = t; };
export const getTeam = () => team;

export const toCZK = (c) => (Number(c.value) || 0) * RATES[c.currency];
export const fromCZK = (czk, currency) => czk / RATES[currency];

const formatters = {};
export function money(amount, currency) {
  formatters[currency] ??= new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 });
  return formatters[currency].format(Math.round(amount));
}

export const stageOf = (id) => STAGES.find((s) => s.id === id);
export const memberOf = (id) => team.find((m) => m.id === id) || null;
export const pkgOf = (id) => PACKAGES.find((p) => p.id === id);

export const shortDate = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
export const today = () => new Date().toISOString().slice(0, 10);

// Normalizace pro porovnání: bez diakritiky, právních forem a interpunkce.
export function norm(s = '') {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?\s?r\.?\s?o\.?|a\.?\s?s\.?|ltd\.?|gmbh|inc\.?|llc|mgr\.?|ing\.?|judr\.?|dr\.?)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const slug = (url = '') => norm(url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^linkedin\.com\/(in|company)\//, '').replace(/\/+$/, ''));

// Vrátí existující klienty, kteří se shodují jménem, firmou nebo LinkedIn profilem.
export function findDuplicates(clients, { name, company, linkedin }, excludeId) {
  const n = norm(name), co = norm(company), li = slug(linkedin);
  return clients
    .filter((c) => c.id !== excludeId)
    .map((c) => {
      const reasons = [];
      if (n.length >= 4 && norm(c.name) === n) reasons.push('jméno');
      if (co.length >= 3 && norm(c.company) === co) reasons.push('firma');
      if (li.length >= 3 && slug(c.linkedin) === li) reasons.push('LinkedIn profil');
      return reasons.length ? { client: c, reasons } : null;
    })
    .filter(Boolean);
}

export function stats(clients) {
  const won = clients.filter((c) => c.stage === 'won');
  const open = clients.filter((c) => ['messaged', 'proposal', 'meeting'].includes(c.stage));
  const revenue = won.reduce((s, c) => s + toCZK(c), 0);
  return {
    revenue,
    pipeline: open.reduce((s, c) => s + toCZK(c), 0),
    openCount: open.length,
    wonCount: won.length,
    avg: won.length ? revenue / won.length : 0,
  };
}
