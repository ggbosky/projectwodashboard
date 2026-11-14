import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Send, Trash2, X } from 'lucide-react';
import { PACKAGES, STAGES } from '../data';
import { getTeam, fromCZK, memberOf, money, shortDate, today, toCZK } from '../lib';
import { Avatar, LinkedInGlyph, RegionPill, Segmented } from './ui';

const OTHER = { CZK: ['EUR', 'USD'], EUR: ['CZK', 'USD'], USD: ['CZK', 'EUR'] };

function Section({ title, children, aside }) {
  return (
    <section className="border-t border-white/[0.06] px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function Drawer({ client, onUpdate, onStage, onAssign, onDelete, onClose }) {
  const [draft, setDraft] = useState('');
  const [from, setFrom] = useState('us');
  const owner = memberOf(client.owner);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onUpdate({ messages: [...client.messages, { from, text: draft.trim(), date: today() }] });
    setDraft('');
  };

  const czk = toCZK(client);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-label={`Detail klienta ${client.name}`}
        className="scroll-thin fixed inset-y-0 right-0 z-50 flex w-full max-w-[500px] flex-col overflow-y-auto border-l border-white/[0.08] bg-ink-900/95 shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        {/* Hlavička */}
        <div className="relative px-6 pb-5 pt-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-25" style={{ background: `radial-gradient(60% 100% at 80% 0%, ${owner?.color || '#71717A'}, transparent)` }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RegionPill region={client.region} country={client.country} />
                <span className="text-[11px] text-zinc-500">{client.industry}</span>
              </div>
              <h2 className="mt-3 font-display text-[28px] font-semibold leading-[1.05] tracking-tight">{client.name}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {client.title} · <span className="font-serif text-base italic text-zinc-200">{client.company}</span>
              </p>
              <a
                href={`https://${client.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300"
              >
                <LinkedInGlyph size={13} /> {client.linkedin} <ExternalLink size={11} />
              </a>
            </div>
            <button onClick={onClose} className="btn-ghost !p-2" aria-label="Zavřít"><X size={16} /></button>
          </div>
        </div>

        <Section title="Zakázka">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="label" htmlFor="d-value">Cena zakázky</label>
              <input
                id="d-value"
                type="number"
                min="0"
                step="500"
                className="field num font-display text-lg font-semibold"
                value={client.value}
                onChange={(e) => onUpdate({ value: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div>
              <span className="label">Měna</span>
              <Segmented
                id="d-cur"
                value={client.currency}
                onChange={(v) => onUpdate({ currency: v })}
                options={[{ value: 'CZK', label: 'Kč' }, { value: 'EUR', label: 'EUR' }]}
              />
            </div>
          </div>
          <p className="num mt-2 text-xs text-zinc-500">
            ≈ {OTHER[client.currency].map((cur) => money(fromCZK(czk, cur), cur)).join('  ·  ')}
          </p>
          <span className="label mt-4">Typ webu</span>
          <div className="flex flex-wrap gap-2">
            {PACKAGES.map((p) => {
              const active = client.pkg === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onUpdate({ pkg: p.id })}
                  aria-pressed={active}
                  className="rounded-xl border px-3 py-1.5 text-left text-sm transition hover:bg-white/[0.06]"
                  style={active ? { borderColor: `${p.color}AA`, background: `${p.color}1A`, color: p.color } : { borderColor: 'rgba(255,255,255,0.08)', color: '#A1A1AA' }}
                >
                  <span className="font-medium">{p.name}</span>
                  {p.from > 0 && <span className="num ml-1.5 text-[11px] opacity-70">od {p.from / 1000} tis.</span>}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Fáze v pipeline">
          <div className="flex flex-col gap-1.5">
            {STAGES.map((s, i) => {
              const active = client.stage === s.id;
              const done = STAGES.findIndex((x) => x.id === client.stage) > i;
              return (
                <button
                  key={s.id}
                  onClick={() => !active && onStage(s.id)}
                  aria-pressed={active}
                  className="relative flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition hover:bg-white/[0.05]"
                  style={{ borderColor: active ? `${s.color}99` : 'rgba(255,255,255,0.06)' }}
                >
                  {active && <motion.span layoutId="stage-active" className="absolute inset-0 rounded-xl" style={{ background: `${s.color}14` }} />}
                  <span
                    className="relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ background: active || done ? s.color : 'rgba(255,255,255,0.06)', color: active || done ? '#09090B' : '#71717A' }}
                  >
                    {i + 1}
                  </span>
                  <span className={`relative font-medium ${active ? 'text-white' : 'text-zinc-400'}`}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Od koho klient je">
          <div className="flex flex-wrap gap-2">
            {[...getTeam(), null].map((m) => {
              const id = m?.id ?? null;
              const active = client.owner === id;
              const color = m?.color || '#A1A1AA';
              return (
                <button
                  key={id || 'none'}
                  onClick={() => !active && onAssign(id)}
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
        </Section>

        <Section title="Historie z LinkedInu" aside={<span className="num text-[11px] text-zinc-600">{client.messages.length} zpráv</span>}>
          <div className="flex flex-col gap-2.5">
            {client.messages.length === 0 && <p className="text-sm text-zinc-600">Zatím žádná zpráva. První oslovení zapište níže.</p>}
            {client.messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.from === 'us' ? 'self-end rounded-br-md bg-brand/15 text-orange-50' : 'self-start rounded-bl-md bg-white/[0.06] text-zinc-200'
                }`}
              >
                {m.text}
                <div className="num mt-1 text-[10px] text-zinc-500">
                  {m.from === 'us' ? 'Project Two' : client.name.split(' ')[0]} · {shortDate(m.date)}
                </div>
              </motion.div>
            ))}
          </div>
          <form onSubmit={send} className="mt-4">
            <div className="mb-2">
              <Segmented
                id="d-from"
                size="sm"
                value={from}
                onChange={setFrom}
                options={[{ value: 'us', label: 'Naše zpráva' }, { value: 'them', label: 'Odpověď klienta' }]}
              />
            </div>
            <div className="flex gap-2">
              <input className="field" placeholder="Zapsat zprávu z LinkedInu…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Nová zpráva" />
              <button className="btn-primary !px-3" aria-label="Přidat zprávu" disabled={!draft.trim()}><Send size={15} /></button>
            </div>
          </form>
        </Section>

        <Section title="Interní poznámky ke schůzce">
          <textarea
            className="field min-h-[110px] resize-y leading-relaxed"
            placeholder="Co zaznělo na callu, rozpočet, termíny, další kroky…"
            value={client.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            aria-label="Interní poznámky"
          />
        </Section>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] px-6 py-4 text-xs text-zinc-500">
          <span>Poslední aktivita <span className="num">{shortDate(client.updated)}</span> · změny se ukládají automaticky</span>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-zinc-500 transition hover:text-red-400">
            <Trash2 size={13} /> Smazat
          </button>
        </div>
      </motion.aside>
    </>
  );
}
