import { motion } from 'framer-motion';
import { XCircle, Banknote, CalendarClock, CircleCheckBig, Gauge, TrendingUp, Users } from 'lucide-react';
import { PACKAGES, STAGES } from '../data';
import { getTeam, fromCZK, money, stats, toCZK } from '../lib';
import { Avatar, Counter } from './ui';

const OTHER = { CZK: ['EUR', 'USD'], EUR: ['CZK', 'USD'], USD: ['CZK', 'EUR'] };

function KpiCard({ icon, label, children, sub, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="glass group relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: accent, background: `${accent}1A` }}>{icon}</span>
      </div>
      <div className="mt-4 font-display text-[30px] font-semibold leading-none tracking-tight sm:text-[34px]">{children}</div>
      <div className="mt-3 min-h-[18px] text-xs text-zinc-500">{sub}</div>
    </motion.div>
  );
}

export function Kpis({ clients, currency }) {
  const s = stats(clients);
  const alt = (czk) => OTHER[currency].map((cur) => money(fromCZK(czk, cur), cur)).join('  ·  ');
  const total = clients.length || 1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={<Banknote size={16} />} label="Obrat studia" accent="#FF5A0F" delay={0} sub={<span className="num">{alt(s.revenue)}</span>}>
        <Counter value={s.revenue} currency={currency} />
      </KpiCard>
      <KpiCard
        icon={<TrendingUp size={16} />}
        label="Rozjednaná pipeline"
        accent="#38BDF8"
        delay={0.06}
        sub={
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              {STAGES.map((st) => (
                <motion.span
                  key={st.id}
                  animate={{ width: `${(clients.filter((c) => c.stage === st.id).length / total) * 100}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ background: st.color }}
                  title={st.name}
                />
              ))}
            </div>
            <span className="num shrink-0">{s.openCount} rozjednaných</span>
          </div>
        }
      >
        <Counter value={s.pipeline} currency={currency} />
      </KpiCard>
      <KpiCard
        icon={<CircleCheckBig size={16} />}
        label="Uzavřené weby"
        accent="#34D399"
        delay={0.12}
        sub={(() => { const lost = clients.filter((c) => c.stage === 'lost').length; const done = s.wonCount + lost; return done ? `úspěšnost ${Math.round((s.wonCount / done) * 100)} % · ${lost} nevyšlo` : 'zatím nic uzavřeno'; })()}
      >
        <Counter value={s.wonCount} />
      </KpiCard>
      <KpiCard
        icon={<Gauge size={16} />}
        label="Průměrná zakázka"
        accent="#A78BFA"
        delay={0.18}
        sub={PACKAGES.slice(0, 3).map((p) => `${p.name} od ${p.from / 1000} tis.`).join('  ·  ')}
      >
        <Counter value={s.avg} currency={currency} />
      </KpiCard>
    </div>
  );
}

export function TeamCards({ clients, currency, ownerFilter, onOwnerFilter }) {
  const max = Math.max(1, ...getTeam().map((m) => clients.filter((c) => c.owner === m.id && c.stage === 'won').reduce((s, c) => s + toCZK(c), 0)));

  return (
    <div className={`grid grid-cols-1 gap-4 ${getTeam().length >= 4 ? 'md:grid-cols-2 2xl:grid-cols-4' : 'md:grid-cols-3'}`}>
      {getTeam().map((m, i) => {
        const mine = clients.filter((c) => c.owner === m.id);
        const revenue = mine.filter((c) => c.stage === 'won').reduce((s, c) => s + toCZK(c), 0);
        const meetings = mine.filter((c) => c.stage === 'meeting').length;
        const active = ownerFilter === m.id;
        return (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => onOwnerFilter(active ? null : m.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.985 }}
            aria-pressed={active}
            className="glass relative overflow-hidden p-5 text-left transition-colors"
            style={active ? { borderColor: `${m.color}99`, boxShadow: `0 0 40px -12px ${m.color}` } : undefined}
          >
            <div className="flex items-center gap-3">
              <Avatar id={m.id} size={42} />
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold leading-tight tracking-tight">{m.name}</div>
                <div className="truncate text-xs text-zinc-500">{m.role}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-display text-xl font-semibold tracking-tight">
                  <Counter value={revenue} currency={currency} />
                </div>
                <div className="text-[11px] text-zinc-500">vygenerováno</div>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: m.color }}
                animate={{ width: `${(revenue / max) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5"><Users size={13} className="text-zinc-500" /><b className="num font-semibold text-white">{mine.filter((c) => c.stage !== 'lost').length}</b> klientů</span>
              <span className="flex items-center gap-1.5"><CalendarClock size={13} className="text-zinc-500" /><b className="num font-semibold text-white">{meetings}</b> aktivní schůzky</span>
              <span className="flex items-center gap-1.5"><CircleCheckBig size={13} className="text-zinc-500" /><b className="num font-semibold text-white">{mine.filter((c) => c.stage === 'won').length}</b> uzavřeno</span>
              {mine.some((c) => c.stage === 'lost') && <span className="flex items-center gap-1.5 text-red-300/80"><XCircle size={13} /><b className="num font-semibold">{mine.filter((c) => c.stage === 'lost').length}</b> nevyšlo</span>}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
