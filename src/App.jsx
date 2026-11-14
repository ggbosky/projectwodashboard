import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Columns3, Globe, List, LoaderCircle, LogOut, MapPin, Plus, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import { RATES } from './data';
import { getTeam, memberOf, norm, setTeam, stageOf, today } from './lib';
import { remote, useCrm, useSession } from './store';
import { Avatar, LinkedInGlyph, Logo, LogoMark, Segmented } from './components/ui';
import { Kpis, TeamCards } from './components/Dashboard';
import { Kanban, ListView } from './components/Pipeline';
import Drawer from './components/Drawer';
import Auth from './components/Auth';
import { CollisionModal, NewClientModal, Toast } from './components/Modals';

const PREFS = 'projectwo-crm.prefs';
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREFS)) || {}; } catch { return {}; }
};

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-500">
      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <LogoMark className="h-12 w-auto" />
      </motion.div>
      <span className="flex items-center gap-2 text-sm"><LoaderCircle size={14} className="animate-spin" /> Načítám pipeline…</span>
    </div>
  );
}

export default function App() {
  const { session, ready, signIn, signOut } = useSession();
  if (!ready) return <Splash />;
  if (remote && !session) return <Auth signIn={signIn} />;
  return <Crm key={session?.user?.id || 'local'} session={session} signOut={signOut} />;
}

function Crm({ session, signOut }) {
  const prefs = useMemo(loadPrefs, []);
  const uid = session?.user?.id;
  const [me, setMe] = useState(remote ? uid : prefs.me ?? 'marek');
  const [currency, setCurrency] = useState(prefs.currency ?? 'CZK');
  const [region, setRegion] = useState('ALL');
  const [view, setView] = useState('kanban');
  const [ownerFilter, setOwnerFilter] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [collision, setCollision] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const notify = useCallback((text, warn = false) => {
    clearTimeout(toastTimer.current);
    setToast({ text, warn, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const store = useCrm(session, (text) => notify(text, true));
  const { clients, patch } = store;
  setTeam(store.team); // registr pro memberOf() v celé aplikaci
  const team = getTeam();
  // V ostrém režimu vystupuje každý za sebe; přepnout se lze jen na AI agenta bez vlastního účtu.
  const actAs = remote ? team.filter((m) => m.id === uid || m.ai) : team;
  const meName = memberOf(me)?.name ?? 'Vy';

  useEffect(() => {
    try { localStorage.setItem(PREFS, JSON.stringify(remote ? { currency } : { currency, me })); } catch { /* bez persistence */ }
  }, [me, currency]);

  /* ——— Anti-duplicita: každá změna fáze / vlastníka u cizího klienta projde přes varování ——— */
  const guard = (client, action, apply) => {
    const owner = memberOf(client.owner);
    if (!owner || owner.id === me) return apply();
    setCollision({
      client,
      title: `Tohoto klienta už řeší ${owner.name}`,
      body: `${meName} se pokouší ${action}, ale klient je v databázi zabraný. Aby ho neoslovili dva lidé z Project Two, domluvte se nejdřív s kolegou.`,
      primary: { label: `Ponechat u: ${owner.name}`, run: () => setCollision(null) },
      secondary: { label: 'Jsme domluveni — přesto provést', run: () => { apply(); setCollision(null); } },
    });
  };

  const moveStage = (id, stage) => {
    const c = clients.find((x) => x.id === id);
    if (!c || c.stage === stage) return;
    guard(c, `přesunout klienta do fáze „${stageOf(stage).name}“`, () => {
      const claim = !c.owner && stage !== 'lead';
      patch(id, { stage, ...(claim ? { owner: me } : {}) });
      notify(claim ? `${c.name} → ${stageOf(stage).short} · přiřazeno: ${meName}` : `${c.name} → ${stageOf(stage).short}`);
    });
  };

  const assign = (id, owner) => {
    const c = clients.find((x) => x.id === id);
    if (!c || c.owner === owner) return;
    const target = memberOf(owner);
    guard(c, target ? `převést klienta na: ${target.name}` : 'uvolnit klienta jako volný lead', () => {
      patch(id, { owner });
      notify(target ? `${c.name} nově patří: ${target.name}` : `${c.name} je volný lead`);
    });
  };

  const createClient = (f, dupes) => {
    const create = () => {
      const client = {
        id: crypto.randomUUID(),
        name: f.name.trim(),
        title: f.title.trim() || 'Kontakt',
        company: f.company.trim(),
        industry: 'LinkedIn lead',
        region: f.region,
        country: f.region === 'CZ' ? 'CZ' : f.country || 'EU',
        owner: f.owner,
        stage: f.stage,
        pkg: f.pkg,
        value: f.value,
        currency: f.currency,
        updated: today(),
        messages: [],
        notes: '',
        linkedin: f.linkedin.trim().replace(/^https?:\/\//, '') || 'linkedin.com',
      };
      store.add(client);
      setAdding(false);
      setCollision(null);
      notify(`${client.name} přidán do pipeline`);
    };
    if (!dupes.length) return create();
    const { client: existing, reasons } = dupes.find((d) => d.client.owner && d.client.owner !== f.owner) || dupes[0];
    const owner = memberOf(existing.owner);
    setCollision({
      client: existing,
      reasons,
      title: owner ? `Pozor, klienta už má ${owner.name}` : 'Tento klient už v databázi je',
      body: owner
        ? `Záznam se shoduje s klientem, kterého má rozpracovaného ${owner.name}. Nový záznam by vedl k dvojímu oslovení.`
        : 'Shodný záznam už existuje jako volný lead. Místo duplicity si ho raději převezměte.',
      primary: { label: 'Otevřít existující záznam', run: () => { setCollision(null); setAdding(false); setOpenId(existing.id); } },
      secondary: { label: 'Je to jiný klient — přesto vytvořit', run: create },
    });
  };

  const removeClient = (id) => {
    const c = clients.find((x) => x.id === id);
    if (!window.confirm(`Opravdu smazat klienta ${c.name}?`)) return;
    setOpenId(null);
    store.remove(id);
    notify(`${c.name} smazán`, true);
  };

  /* ——— Filtry ——— */
  const byRegion = useMemo(() => clients.filter((c) => region === 'ALL' || c.region === region), [clients, region]);
  const forKpis = useMemo(() => byRegion.filter((c) => !ownerFilter || c.owner === ownerFilter), [byRegion, ownerFilter]);
  const visible = useMemo(() => {
    const q = norm(query);
    return forKpis.filter((c) => (!onlyFree || !c.owner) && (!q || norm(`${c.name} ${c.company} ${c.industry}`).includes(q)));
  }, [forKpis, onlyFree, query]);

  const taken = clients.filter((c) => c.owner).length;
  const free = clients.length - taken;
  const open = clients.find((c) => c.id === openId);

  if (store.loading) return <Splash />;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Atmosféra pozadí */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 h-[560px] w-[760px] rounded-full bg-brand/[0.13] blur-[140px]" />
        <div className="absolute -right-40 top-40 h-[420px] w-[520px] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-ink-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <Logo />
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">CRM</span>

          <div className="relative order-last w-full md:order-none md:ml-4 md:w-auto md:max-w-xs md:flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="field !pl-9" placeholder="Hledat klienta nebo firmu…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Hledat" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white" aria-label="Vymazat hledání"><X size={14} /></button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Segmented
              id="currency"
              size="sm"
              value={currency}
              onChange={setCurrency}
              options={[{ value: 'CZK', label: 'Kč' }, { value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }]}
            />
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1" role="radiogroup" aria-label="Pracuji jako">
              <span className="hidden pl-2 pr-1 text-[11px] text-zinc-500 lg:inline">Pracuji jako</span>
              {actAs.map((m) => (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={me === m.id}
                  title={`Pracovat jako ${m.name}`}
                  onClick={() => setMe(m.id)}
                  className={`flex items-center gap-1.5 rounded-lg py-0.5 pl-0.5 transition ${me === m.id ? 'bg-white/10 pr-2.5' : 'pr-0.5 opacity-50 hover:opacity-100'}`}
                >
                  <Avatar id={m.id} size={24} />
                  {me === m.id && <span className="text-xs font-medium">{m.name}</span>}
                </button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Nový klient
              <span className="hidden items-center gap-1 border-l border-black/20 pl-2 text-black/70 sm:flex"><LinkedInGlyph size={13} /> Import</span>
            </motion.button>
            {remote && (
              <button className="btn-ghost !p-2" onClick={signOut} title={`Odhlásit (@${session.user.id})`} aria-label="Odhlásit se">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1560px] px-4 pb-16 pt-8 sm:px-6">
        {/* Titulek + geografický filtr */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Interní přehled studia · listopad 2026</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
              Každý lead má <span className="font-serif text-[1.12em] font-normal italic tracking-normal text-brand">svého</span> člověka.
            </h1>
          </motion.div>
          <Segmented
            id="region"
            value={region}
            onChange={setRegion}
            options={[
              { value: 'ALL', label: 'Všechny' },
              { value: 'CZ', label: 'CZ Clients', icon: <MapPin size={13} /> },
              { value: 'INTL', label: 'International Clients', icon: <Globe size={13} /> },
            ]}
          />
        </div>

        <div className="mt-7"><Kpis clients={forKpis} currency={currency} /></div>

        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Tým <span className="font-serif text-[1.15em] font-normal italic text-zinc-400">Project Two</span></h2>
          {ownerFilter && (
            <button onClick={() => setOwnerFilter(null)} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
              <X size={12} /> Zrušit filtr: {memberOf(ownerFilter).name}
            </button>
          )}
        </div>
        <div className="mt-4"><TeamCards clients={byRegion} currency={currency} ownerFilter={ownerFilter} onOwnerFilter={setOwnerFilter} /></div>

        {/* Pipeline toolbar */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-display text-xl font-semibold tracking-tight">
            LinkedIn <span className="font-serif text-[1.15em] font-normal italic text-zinc-400">pipeline</span>
            <span className="num ml-2 text-sm font-normal text-zinc-500">{visible.length} klientů</span>
          </h2>

          <button
            role="switch"
            aria-checked={onlyFree}
            onClick={() => setOnlyFree((v) => !v)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm transition ${
              onlyFree ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200 shadow-[0_0_30px_-10px_#34D399]' : 'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
            }`}
          >
            <ShieldCheck size={15} className={onlyFree ? 'text-emerald-300' : 'text-zinc-500'} />
            <span className="font-medium">Pouze neobsazení klienti</span>
            <span className={`relative h-4 w-7 rounded-full transition-colors ${onlyFree ? 'bg-emerald-400' : 'bg-white/15'}`}>
              <motion.span layout className="absolute top-0.5 h-3 w-3 rounded-full bg-white" style={{ left: onlyFree ? 14 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
            </span>
          </button>

          <Segmented
            id="view"
            value={view}
            onChange={setView}
            options={[
              { value: 'kanban', label: 'Kanban', icon: <Columns3 size={14} /> },
              { value: 'list', label: 'Seznam', icon: <List size={14} /> },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span>
            <b className="font-medium text-zinc-300">Anti-duplicita aktivní</b> — <span className="num">{taken}</span> klientů je zabraných, <span className="num">{free}</span> volných.
            Claude ani nikdo další nemůže bez varování sáhnout na klienta, kterého už řeší kolega.
          </span>
        </div>

        <div className="mt-5">
          <LayoutGroup>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {view === 'kanban' ? (
                  <Kanban clients={visible} currency={currency} onOpen={setOpenId} onMove={moveStage} />
                ) : (
                  <ListView clients={visible} currency={currency} onOpen={setOpenId} />
                )}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-xs text-zinc-600">
          <span className="num">
            {remote ? `Sdílená data týmu v GitHubu · ${store.status}` : 'Demo režim · ukládá se lokálně v prohlížeči'} · kurzy pro přepočet: 1 EUR = {String(RATES.EUR).replace('.', ',')} Kč, 1 USD = {String(RATES.USD).replace('.', ',')} Kč
          </span>
          {!remote && (
            <button
              onClick={() => {
                if (window.confirm('Obnovit původní demo data? Vaše změny se zahodí.')) { store.resetDemo(); notify('Demo data obnovena'); }
              }}
              className="inline-flex items-center gap-1.5 transition hover:text-zinc-300"
            >
              <RotateCcw size={12} /> Obnovit demo data
            </button>
          )}
        </footer>
      </main>

      <AnimatePresence>
        {open && (
          <Drawer
            key="drawer"
            client={open}
            onUpdate={(p) => patch(open.id, p)}
            onStage={(s) => moveStage(open.id, s)}
            onAssign={(o) => assign(open.id, o)}
            onDelete={() => removeClient(open.id)}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && <NewClientModal key="new" clients={clients} me={me} onClose={() => setAdding(false)} onSubmit={createClient} />}
      </AnimatePresence>
      <AnimatePresence>
        {collision && <CollisionModal key="collision" collision={collision} onClose={() => setCollision(null)} />}
      </AnimatePresence>
      <AnimatePresence>{toast && <Toast key={toast.key} toast={toast} />}</AnimatePresence>
    </div>
  );
}
