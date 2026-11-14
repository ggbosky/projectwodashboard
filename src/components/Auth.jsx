import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleCheck, ExternalLink, KeyRound, LoaderCircle, Lock, Plus, Trash2, User, UserPlus, X } from 'lucide-react';
import { MIN_PASSWORD, sealToken, userId } from '../auth';
import { APP_REPO, DATA_REPO, saveUsers, verifyAccess } from '../store';
import { Shell } from './Modals';
import { LogoMark } from './ui';

function Frame({ children, wide }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/[0.16] blur-[150px]" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`glass relative w-full ${wide ? 'max-w-[520px]' : 'max-w-[400px]'} p-7`}
      >
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-auto" />
          <span className="font-display text-xl font-bold tracking-tight">Project Two</span>
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">CRM</span>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

const ErrorBox = ({ children }) =>
  children ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-200">{children}</p> : null;

function validateAccounts(rows, existing = []) {
  const ids = rows.map((r) => userId(r.name));
  if (rows.some((r) => userId(r.name).length < 2)) return 'Každý účet potřebuje jméno.';
  if (new Set(ids).size !== ids.length || ids.some((id) => existing.includes(id))) return 'Jména účtů se nesmí opakovat.';
  if (rows.some((r) => r.password.length < MIN_PASSWORD)) return `Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`;
  return '';
}

/* Běžné přihlášení: jméno + heslo. */
function Login({ auth }) {
  const [f, setF] = useState({ name: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await auth.signIn(f.name, f.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Frame>
      <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
        Vítejte <span className="font-serif text-[1.12em] font-normal italic text-brand">zpět</span>.
      </h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500"><Lock size={13} /> Interní nástroj — jen pro členy týmu.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="a-name">Jméno</label>
          <div className="relative">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input id="a-name" className="field !pl-9" required autoFocus autoComplete="username" placeholder="Marek" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="a-pass">Heslo</label>
          <div className="relative">
            <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input id="a-pass" type="password" className="field !pl-9" required autoComplete="current-password" placeholder="••••••••••" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <button className="btn-primary w-full disabled:opacity-60" disabled={busy}>
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          Přihlásit se
        </button>
      </form>
    </Frame>
  );
}

/* První spuštění: vlastník jednou vloží přístupový klíč a založí účty týmu. */
function Setup({ auth }) {
  const [token, setToken] = useState('');
  const [rows, setRows] = useState([{ name: '', password: '' }, { name: '', password: '' }, { name: '', password: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState(null);
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const submit = async (e) => {
    e.preventDefault();
    const filled = rows.filter((r) => r.name.trim() || r.password);
    const problem = filled.length ? validateAccounts(filled) : 'Založte alespoň jeden účet.';
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      await verifyAccess(token.trim());
      const sealed = await Promise.all(filled.map((r) => sealToken(r.name, r.password, token.trim())));
      const { users, committed } = await saveUsers(token.trim(), () => sealed);
      auth.setUsers(users);
      if (committed) auth.start(filled[0].name, token.trim());
      else setManual(filled[0].name);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
    return undefined;
  };

  if (manual) {
    return (
      <Frame wide>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/40"><CircleCheck size={22} /></div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Účty jsou připravené</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Stáhl se soubor <b className="font-medium text-zinc-200">users.json</b>. Nahrajte ho na GitHubu do repozitáře{' '}
          <b className="font-medium text-zinc-200">{APP_REPO || 's aplikací'}</b> do složky <b className="font-medium text-zinc-200">public/</b> na větvi main.
          Po nasazení (1–2 minuty) se může přihlásit celý tým.
        </p>
        <button className="btn-primary mt-6 w-full" onClick={() => auth.start(manual, token.trim())}>Pokračovat do aplikace</button>
      </Frame>
    );
  }

  return (
    <Frame wide>
      <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
        První <span className="font-serif text-[1.12em] font-normal italic text-brand">nastavení</span>
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">Děláte jen jednou. Kolegové se pak hlásí už jen jménem a heslem.</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label className="label" htmlFor="s-token">1 · Přístupový klíč k datům (GitHub token)</label>
          <input id="s-token" type="password" className="field font-mono" required autoComplete="off" spellCheck={false} placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} />
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Fine-grained token s právem <b className="font-medium text-zinc-300">Contents: Read and write</b> pro repozitáře{' '}
            <b className="font-medium text-zinc-300">{DATA_REPO}</b>{APP_REPO && <> a <b className="font-medium text-zinc-300">{APP_REPO}</b></>}. V aplikaci se uloží jen zašifrovaně.{' '}
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300">
              Vytvořit <ExternalLink size={11} />
            </a>
          </p>
        </div>

        <div>
          <span className="label">2 · Účty týmu (první je váš)</span>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.2fr_auto] gap-2">
                <input className="field" placeholder="Jméno" aria-label={`Jméno ${i + 1}`} autoComplete="off" value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} />
                <input className="field" type="password" placeholder={`Heslo (min. ${MIN_PASSWORD} znaků)`} aria-label={`Heslo ${i + 1}`} autoComplete="new-password" value={r.password} onChange={(e) => setRow(i, { password: e.target.value })} />
                <button type="button" className="btn-ghost !px-2.5" aria-label="Odebrat řádek" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><X size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white" onClick={() => setRows((rs) => [...rs, { name: '', password: '' }])}>
            <Plus size={12} /> Přidat dalšího člena
          </button>
        </div>

        <ErrorBox>{error}</ErrorBox>
        <button className="btn-primary w-full disabled:opacity-60" disabled={busy || !token.trim()}>
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          Vytvořit účty
        </button>
      </form>
    </Frame>
  );
}

export default function Auth({ auth }) {
  return auth.users.length ? <Login auth={auth} /> : <Setup auth={auth} />;
}

/* Správa účtů pro přihlášené: přidat člena, změnit heslo, odebrat. */
export function AccountsModal({ session, auth, onClose, notify }) {
  const [f, setF] = useState({ name: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const apply = async (change, done) => {
    setBusy(true);
    setError('');
    try {
      const { users, committed } = await saveUsers(session.token, change);
      auth.setUsers(users);
      notify(committed ? `${done} · web se do 2 minut znovu nasadí` : `${done} · stažený users.json nahrajte do složky public/`, !committed);
      setF({ name: '', password: '' });
    } catch {
      setError('Účty se nepodařilo uložit. Zkuste to znovu.');
    }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateAccounts([f]);
    if (problem) return setError(problem);
    const entry = await sealToken(f.name, f.password, session.token);
    const exists = auth.users.some((u) => userId(u.name) === userId(f.name));
    return apply(
      (users) => [...users.filter((u) => userId(u.name) !== userId(f.name)), entry],
      exists ? `Heslo pro ${entry.name} změněno` : `Účet ${entry.name} přidán`,
    );
  };

  return (
    <Shell onClose={onClose} label="Účty týmu">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            Účty <span className="font-serif text-[1.15em] font-normal italic text-brand">týmu</span>
          </h3>
          <button onClick={onClose} className="btn-ghost !p-2" aria-label="Zavřít"><X size={16} /></button>
        </div>

        <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          {auth.users.map((u) => {
            const self = userId(u.name) === session.user.id;
            return (
              <li key={u.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <User size={14} className="text-zinc-500" />
                <span className="font-medium">{u.name}</span>
                {self && <span className="text-xs text-zinc-500">to jste vy</span>}
                {!self && (
                  <button
                    className="ml-auto text-zinc-500 transition hover:text-red-400 disabled:opacity-40"
                    disabled={busy}
                    aria-label={`Odebrat účet ${u.name}`}
                    onClick={() => window.confirm(`Odebrat účet ${u.name}?`) && apply((users) => users.filter((x) => x.name !== u.name), `Účet ${u.name} odebrán`)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <span className="label">Přidat člena nebo změnit heslo</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" placeholder="Jméno" aria-label="Jméno účtu" autoComplete="off" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="field" type="password" placeholder={`Heslo (min. ${MIN_PASSWORD})`} aria-label="Nové heslo" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>
          <ErrorBox>{error}</ErrorBox>
          <button className="btn-primary w-full disabled:opacity-60" disabled={busy || !f.name.trim() || !f.password}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Uložit účet
          </button>
          <p className="text-xs leading-relaxed text-zinc-500">Existující jméno = změna hesla. Zapomenuté heslo takto nastaví kterýkoli přihlášený kolega.</p>
        </form>
      </div>
    </Shell>
  );
}
