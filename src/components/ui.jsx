import { useEffect, useRef } from 'react';
import { animate, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { fromCZK, memberOf, money, pkgOf, stageOf } from '../lib';

/* Logo slot — vektorová značka Project Two.
   Pro výměnu za obrázek stačí nahradit <LogoMark /> za <img src="/logo-mark.png" className="h-7" />. */
export function LogoMark({ className = 'h-7 w-auto' }) {
  return (
    <svg viewBox="0 0 800 880" className={className} fill="#FF5A0F" aria-hidden="true">
      <polygon points="22,255 220,60 630,60 778,205 778,378 22,825 22,605 625,258" />
      <polygon points="82,825 400,632 778,632 778,825" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="https://projectwo.com/" target="_blank" rel="noreferrer" className="group flex items-center gap-2.5" aria-label="Project Two">
      <LogoMark className="h-7 w-auto transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
      <span className="font-display text-[19px] font-bold tracking-tight text-white">Project Two</span>
    </a>
  );
}

export function Avatar({ id, size = 28, ring = true }) {
  const m = memberOf(id);
  if (!m) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-white/25 text-zinc-500"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: m.color,
        background: `${m.color}22`,
        boxShadow: ring ? `inset 0 0 0 1px ${m.color}66` : undefined,
      }}
      title={m.name}
    >
      {m.ai ? <Sparkles size={size * 0.5} /> : m.emoji ? <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{m.emoji}</span> : m.name[0]}
    </span>
  );
}

export function Pill({ color, children, dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ color, background: `${color}1A`, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

export const StagePill = ({ id }) => {
  const s = stageOf(id);
  return <Pill color={s.color} dot>{s.short}</Pill>;
};
export const PkgPill = ({ id }) => {
  const p = pkgOf(id);
  return <Pill color={p.color}>{p.name}</Pill>;
};
export const RegionPill = ({ region, country }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
    {region === 'CZ' ? 'CZ' : `INTL · ${country}`}
  </span>
);

/* Animované počitadlo — hodnota se drží v CZK, zobrazuje se ve zvolené měně. */
export function Counter({ value, currency, className }) {
  const ref = useRef(null);
  const shown = useRef(0);
  useEffect(() => {
    const fmt = (v) => (currency ? money(fromCZK(v, currency), currency) : String(Math.round(v)));
    if (ref.current) ref.current.textContent = fmt(shown.current);
    const controls = animate(shown.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v;
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
  }, [value, currency]);
  return <span ref={ref} className={`num ${className || ''}`} />;
}

/* Segmentový přepínač s plynule klouzajícím zvýrazněním. */
export function Segmented({ id, options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div className="scroll-thin inline-flex max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1" role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors ${pad} ${active ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            {active && (
              <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-lg bg-white" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{o.icon}{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const LinkedInGlyph = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-1.9 3.76-1.9 4 0 4.38 2.5 4.38 5.9V21h-4v-5c0-1.3-.03-2.9-1.8-2.9s-2.1 1.36-2.1 2.8V21h-4V9.75Z" />
  </svg>
);
