import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleCheck, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { PACKAGES, STAGES } from '../data';
import { getTeam, findDuplicates, memberOf } from '../lib';
import { Avatar, LinkedInGlyph, Segmented, StagePill } from './ui';

export function Shell({ children, onClose, label, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* min-h-full: okno vyšší než obrazovka (mobil) se dá celé proscrollovat odshora */}
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full ${wide ? 'max-w-[560px]' : 'max-w-[440px]'} overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-2xl`}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        {children}
      </motion.div>
      </div>
    </motion.div>
  );
}

/* Varování anti-duplicity: klient už patří někomu jinému z týmu. */
export function CollisionModal({ collision, onClose }) {
  const { client, title, body, reasons, primary, secondary } = collision;
  const owner = memberOf(client.owner);
  return (
    <Shell onClose={onClose} label="Varování: kolize vlastnictví klienta">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(251,191,36,0.28),transparent)]" />
      <div className="relative p-6">
        <motion.div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/40"
          initial={{ rotate: -12, scale: 0.6 }}
          animate={{ rotate: [-12, 10, -6, 0], scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ShieldAlert size={26} />
        </motion.div>
        <h3 className="mt-4 text-center font-display text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-400">{body}</p>

        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <Avatar id={client.owner} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display font-semibold tracking-tight">{client.name}</div>
              <div className="truncate text-xs text-zinc-500">{client.company}</div>
            </div>
            <StagePill id={client.stage} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-xs">
            <div>
              <dt className="text-zinc-500">Klient patří</dt>
              <dd className="mt-0.5 font-medium" style={{ color: owner?.color }}>{owner ? owner.name : 'Zatím nikomu'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{reasons ? 'Shoda v údajích' : 'Fáze'}</dt>
              <dd className="mt-0.5 font-medium text-zinc-200">{reasons ? reasons.join(', ') : STAGES.find((s) => s.id === client.stage).name}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button className="btn-primary w-full" onClick={primary.run} autoFocus>{primary.label}</button>
          {secondary && <button className="btn-ghost w-full !text-zinc-400" onClick={secondary.run}>{secondary.label}</button>}
        </div>
      </div>
    </Shell>
  );
}

export function NewClientModal({ clients, me, onClose, onSubmit }) {
  const [f, setF] = useState({
    name: '', title: '', company: '', linkedin: '', region: 'CZ', country: '', pkg: 'business', value: 20000, currency: 'CZK', owner: me, stage: 'lead',
  });
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const dupes = useMemo(() => findDuplicates(clients, f), [clients, f.name, f.company, f.linkedin]);
  const valid = f.name.trim().length > 1;

  const setRegion = (region) => {
    const pkg = PACKAGES.find((p) => p.id === f.pkg);
    set(region === 'CZ' ? { region, currency: 'CZK', value: pkg.from || f.value } : { region, currency: 'EUR', value: Math.round((pkg.from || 20000) / 24.5 / 100) * 100 });
  };
  const setPkg = (id) => {
    const pkg = PACKAGES.find((p) => p.id === id);
    set({ pkg: id, ...(pkg.from ? { value: f.currency === 'CZK' ? pkg.from : Math.round(pkg.from / 24.5 / 100) * 100 } : {}) });
  };

  return (
    <Shell onClose={onClose} label="Nový klient" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(f, dupes);
        }}
        className="p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-400"><LinkedInGlyph size={13} /> Import z LinkedInu</div>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              Nový <span className="font-serif text-[1.15em] font-normal italic text-brand">klient</span>
            </h3>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="Zavřít"><X size={16} /></button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="n-name">Jméno *</label>
            <input id="n-name" className="field" autoFocus placeholder="Jan Novák" value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="n-company">Firma / značka <span className="normal-case tracking-normal text-zinc-600">(nepovinné)</span></label>
            <input id="n-company" className="field" placeholder="Novák Interiéry s.r.o." value={f.company} onChange={(e) => set({ company: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="n-title">Pozice</label>
            <input id="n-title" className="field" placeholder="Majitel" value={f.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="n-li">LinkedIn profil</label>
            <input id="n-li" className="field" placeholder="linkedin.com/in/jan-novak" value={f.linkedin} onChange={(e) => set({ linkedin: e.target.value })} />
          </div>
        </div>

        {/* Živá kontrola duplicit */}
        <motion.div layout className="mt-4">
          {dupes.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-amber-200"><ShieldAlert size={15} /> Možná duplicita v databázi</div>
              <ul className="mt-2 space-y-1.5">
                {dupes.map(({ client, reasons }) => (
                  <li key={client.id} className="flex items-center gap-2 text-xs text-zinc-300">
                    <Avatar id={client.owner} size={20} />
                    <span className="truncate">
                      <b className="font-semibold text-white">{client.name}</b>{client.company && ` · ${client.company}`} — {memberOf(client.owner)?.name || 'volný lead'}
                    </span>
                    <span className="ml-auto shrink-0 text-amber-200/80">{reasons.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <div className={`flex items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2 text-xs ${valid ? 'text-emerald-300' : 'text-zinc-500'}`}>
              {valid ? <CircleCheck size={14} /> : <ShieldCheck size={14} />}
              {valid ? 'Žádná shoda — klienta zatím nikdo z týmu neřeší.' : 'Anti-duplicita kontroluje jméno, firmu i LinkedIn profil během psaní.'}
            </div>
          )}
        </motion.div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Region</span>
            <div className="flex items-center gap-2">
              <Segmented id="n-region" value={f.region} onChange={setRegion} options={[{ value: 'CZ', label: 'CZ' }, { value: 'INTL', label: 'International' }]} />
              {f.region === 'INTL' && (
                <input className="field !w-16 text-center uppercase" maxLength={2} placeholder="DE" aria-label="Kód země" value={f.country} onChange={(e) => set({ country: e.target.value.toUpperCase() })} />
              )}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="n-value">Odhad zakázky ({f.currency === 'CZK' ? 'Kč' : 'EUR'})</label>
            <input id="n-value" type="number" min="0" step="100" className="field num" value={f.value} onChange={(e) => set({ value: Math.max(0, Number(e.target.value)) })} />
          </div>
          <div>
            <label className="label" htmlFor="n-pkg">Balíček</label>
            <select id="n-pkg" className="field" value={f.pkg} onChange={(e) => setPkg(e.target.value)}>
              {PACKAGES.map((p) => <option key={p.id} value={p.id} className="bg-ink-900">{p.name}{p.from ? ` — od ${p.from.toLocaleString('cs-CZ')} Kč` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="n-stage">Fáze</label>
            <select id="n-stage" className="field" value={f.stage} onChange={(e) => set({ stage: e.target.value })}>
              {STAGES.map((s) => <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>)}
            </select>
          </div>
        </div>

        <span className="label mt-4">Od koho klient je</span>
        <div className="flex flex-wrap gap-2">
          {[...getTeam(), null].map((m) => {
            const id = m?.id ?? null;
            const active = f.owner === id;
            const color = m?.color || '#A1A1AA';
            return (
              <button
                type="button"
                key={id || 'none'}
                onClick={() => set({ owner: id })}
                aria-pressed={active}
                className="flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-sm font-medium transition hover:bg-white/[0.06]"
                style={active ? { borderColor: `${color}AA`, background: `${color}1A`, color: '#fff' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#A1A1AA' }}
              >
                <Avatar id={id} size={24} />
                {m ? m.name : 'Volný lead'}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Zrušit</button>
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!valid}>
            {dupes.length ? 'Zkontrolovat a přidat' : 'Přidat klienta'}
          </button>
        </div>
      </form>
    </Shell>
  );
}

export function Toast({ toast }) {
  return (
    <motion.div
      role="status"
      className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-ink-800/95 px-4 py-2 text-sm shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 12, x: '-50%' }}
    >
      {toast.warn ? <ShieldAlert size={15} className="text-amber-300" /> : <CircleCheck size={15} className="text-emerald-400" />}
      {toast.text}
    </motion.div>
  );
}
