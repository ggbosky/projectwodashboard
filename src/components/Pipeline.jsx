import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, Hammer, Inbox, MessageSquare } from 'lucide-react';
import { STAGES } from '../data';
import { fromCZK, memberOf, money, shortDate, stageOf, toCZK } from '../lib';
import { Avatar, PkgPill, RegionPill, StagePill } from './ui';

function Owner({ id }) {
  const m = memberOf(id);
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <Avatar id={id} size={22} />
      {m ? <span className="font-medium text-zinc-200">{m.name}</span> : <span className="text-zinc-500">Volný lead</span>}
    </span>
  );
}

/* Ve fázi „Chtějí návrh“ si člen může návrh zabrat — karta pak zčervená, aby ho nedělali dva. */
export const BUILD_STAGE = 'proposal';
export const builderOf = (client) => (client.stage === BUILD_STAGE && client.building ? memberOf(client.building) || { id: client.building, name: '?' } : null);

export function BuildBadge({ client }) {
  const b = builderOf(client);
  if (!b) return null;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300 ring-1 ring-inset ring-red-400/40">
      <Hammer size={11} /> Dělá {b.name}
    </span>
  );
}

function BuildButton({ client, me, onBuild }) {
  const b = builderOf(client);
  const mine = b && b.id === me;
  return (
    <button
      type="button"
      draggable={false}
      onClick={(e) => { e.stopPropagation(); onBuild(client.id); }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
        b
          ? 'border-red-400/50 bg-red-500/20 text-red-200 hover:bg-red-500/30'
          : 'border-dashed border-white/15 text-zinc-400 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-200'
      }`}
    >
      <Hammer size={13} />
      {!b ? 'Zabrat — dělám návrh' : mine ? 'Děláte vy · uvolnit' : `Dělá ${b.name} · převzít`}
    </button>
  );
}

function ClientCard({ client, currency, dragging, me, onOpen, onBuild, onDragStart, onDragEnd }) {
  const stage = stageOf(client.stage);
  const taken = builderOf(client);
  return (
    <motion.div
      layout
      layoutId={client.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: dragging ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', client.id);
          onDragStart(client.id);
        }}
        onDragEnd={onDragEnd}
        onClick={() => onOpen(client.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(client.id))}
        role="button"
        tabIndex={0}
        className={`group relative cursor-grab rounded-xl border p-3.5 transition duration-200 hover:-translate-y-0.5 active:cursor-grabbing ${client.stage === 'lost' ? 'opacity-60 grayscale-[0.6] hover:opacity-100 hover:grayscale-0' : ''} ${
          taken
            ? 'border-red-500/60 bg-red-950/70 shadow-[0_0_30px_-10px_rgba(239,68,68,0.8)] hover:border-red-400/80 hover:bg-red-900/60'
            : 'border-white/[0.08] bg-ink-800/80 hover:border-white/20 hover:bg-ink-700/80'
        }`}
        style={{ '--glow': taken ? '#EF4444' : stage.color }}
        data-taken={taken ? 'true' : undefined}
      >
        <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 shadow-[0_8px_40px_-12px_var(--glow)] transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`truncate font-display text-[15px] font-semibold tracking-tight ${client.stage === 'lost' ? 'line-through decoration-red-400/60' : ''}`}>{client.name}</div>
            <div className="truncate text-xs text-zinc-500">{client.company}</div>
          </div>
          <div className="num shrink-0 font-display text-sm font-semibold">{money(fromCZK(toCZK(client), currency), currency)}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <PkgPill id={client.pkg} />
          <RegionPill region={client.region} country={client.country} />
          <BuildBadge client={client} />
        </div>
        <div className={`mt-3 flex items-center justify-between border-t pt-2.5 ${taken ? 'border-red-400/20' : 'border-white/[0.06]'}`}>
          <Owner id={client.owner} />
          <span className="flex items-center gap-2 text-[11px] text-zinc-500">
            {client.messages.length > 0 && (
              <span className="flex items-center gap-1"><MessageSquare size={11} />{client.messages.length}</span>
            )}
            <span className="num">{shortDate(client.updated)}</span>
          </span>
        </div>
        {client.stage === BUILD_STAGE && onBuild && <BuildButton client={client} me={me} onBuild={onBuild} />}
      </div>
    </motion.div>
  );
}

export function Kanban({ clients, currency, me, onOpen, onMove, onBuild }) {
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  return (
    <div className="scroll-thin -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(250px, 1fr))` }}>
        {STAGES.map((stage) => {
          const items = clients.filter((c) => c.stage === stage.id);
          const sum = items.reduce((s, c) => s + toCZK(c), 0);
          const isOver = over === stage.id && dragId;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (over !== stage.id) setOver(stage.id);
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                setOver(null);
                setDragId(null);
                if (id) onMove(id, stage.id);
              }}
              className="flex min-h-[420px] flex-col rounded-2xl border bg-white/[0.02] p-3 transition-all duration-200"
              style={{
                borderColor: isOver ? `${stage.color}AA` : 'rgba(255,255,255,0.08)',
                boxShadow: isOver ? `0 0 0 1px ${stage.color}55, 0 0 60px -20px ${stage.color}` : 'none',
                background: isOver ? `${stage.color}0D` : undefined,
              }}
            >
              <div className="mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: stage.color, boxShadow: `0 0 10px ${stage.color}` }} />
                  <h3 className="font-display text-sm font-semibold tracking-tight">{stage.name}</h3>
                  <span className="num ml-auto rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">{items.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate">{stage.hint}</span>
                  <span className="num shrink-0 pl-2 font-medium text-zinc-400">{money(fromCZK(sum, currency), currency)}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {items.map((c) => (
                    <ClientCard
                      key={c.id}
                      client={c}
                      currency={currency}
                      dragging={dragId === c.id}
                      me={me}
                      onOpen={onOpen}
                      onBuild={onBuild}
                      onDragStart={setDragId}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                    />
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] py-10 text-xs text-zinc-600">
                    <Inbox size={18} />
                    Žádní klienti v této fázi
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'name', label: 'Klient', get: (c) => c.name },
  { key: 'stage', label: 'Fáze', get: (c) => STAGES.findIndex((s) => s.id === c.stage) },
  { key: 'pkg', label: 'Balíček', get: (c) => c.pkg },
  { key: 'region', label: 'Region', get: (c) => c.region + c.country },
  { key: 'owner', label: 'Od koho je', get: (c) => c.owner || 'zzz' },
  { key: 'value', label: 'Hodnota', get: (c) => toCZK(c), right: true },
  { key: 'updated', label: 'Aktivita', get: (c) => c.updated, right: true },
];

export function ListView({ clients, currency, onOpen }) {
  const [sort, setSort] = useState({ key: 'stage', dir: -1 });
  const col = COLUMNS.find((c) => c.key === sort.key);
  const rows = [...clients].sort((a, b) => {
    const x = col.get(a), y = col.get(b);
    return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'cs')) * sort.dir;
  });

  return (
    <div className="glass scroll-thin overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            {COLUMNS.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-medium ${c.right ? 'text-right' : 'text-left'}`}>
                <button
                  onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? -s.dir : 1 }))}
                  className={`inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-white ${sort.key === c.key ? 'text-white' : ''}`}
                >
                  {c.label}
                  <ArrowUpDown size={11} className={sort.key === c.key ? 'text-brand' : 'opacity-40'} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((c) => (
              <motion.tr
                key={c.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onOpen(c.id)}
                onKeyDown={(e) => e.key === 'Enter' && onOpen(c.id)}
                tabIndex={0}
                className={`cursor-pointer border-b border-white/[0.05] transition-colors last:border-0 ${builderOf(c) ? 'bg-red-500/[0.08] hover:bg-red-500/[0.14]' : 'hover:bg-white/[0.04]'}`}
              >
                <td className="px-4 py-3">
                  <div className="font-display font-semibold tracking-tight">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.company}</div>
                </td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5"><StagePill id={c.stage} /><BuildBadge client={c} /></div></td>
                <td className="px-4 py-3"><PkgPill id={c.pkg} /></td>
                <td className="px-4 py-3"><RegionPill region={c.region} country={c.country} /></td>
                <td className="px-4 py-3"><Owner id={c.owner} /></td>
                <td className="num px-4 py-3 text-right font-display font-semibold">{money(fromCZK(toCZK(c), currency), currency)}</td>
                <td className="num px-4 py-3 text-right text-xs text-zinc-500">{shortDate(c.updated)}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {rows.length === 0 && <div className="py-14 text-center text-sm text-zinc-500">Žádný klient neodpovídá filtrům.</div>}
    </div>
  );
}
