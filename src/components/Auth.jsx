import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, KeyRound, LoaderCircle, Lock, RefreshCw, Ticket, Trash2, User, UserPlus, X } from 'lucide-react';
import { MIN_PASSWORD, decryptData, newDataKey, newInviteCode, sealToken, userId } from '../auth';
import { APP_REPO, PALETTE, buildInvite, initData, saveAccounts, verifyAccess } from '../store';
import { Shell } from './Modals';
import { LogoMark, Segmented } from './ui';

function Frame({ children, wide }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/[0.16] blur-[150px]" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`glass relative w-full ${wide ? 'max-w-[520px]' : 'max-w-[420px]'} p-7`}
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

export const ErrorBox = ({ children }) =>
  children ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-200">{children}</p> : null;

export function Swatches({ value, onChange, label = 'Barva' }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`Barva ${c}`}
          onClick={() => onChange(c)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110"
          style={{ background: c, boxShadow: value === c ? `0 0 0 2px #111114, 0 0 0 4px ${c}` : 'none' }}
        >
          {value === c && <Check size={15} className="text-black" />}
        </button>
      ))}
    </div>
  );
}

function Field({ id, label, icon, ...props }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</span>
        <input id={id} className="field !pl-9" required {...props} />
      </div>
    </div>
  );
}

const Submit = ({ busy, children }) => (
  <button className="btn-primary w-full disabled:opacity-60" disabled={busy}>
    {busy && <LoaderCircle size={15} className="animate-spin" />}
    {children}
  </button>
);

/* Přihlášení + vytvoření vlastního účtu. */
function Entrance({ auth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', password: '', code: '', color: PALETTE[1] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'register') {
      if (userId(f.name).length < 2) return setError('Zadejte jméno.');
      if (f.password.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await auth.signIn(f.name, f.password);
      else await auth.register(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  return (
    <Frame>
      <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
        {mode === 'login' ? 'Vítejte ' : 'Přidejte se '}
        <span className="font-serif text-[1.12em] font-normal italic text-brand">{mode === 'login' ? 'zpět' : 'k týmu'}</span>.
      </h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500"><Lock size={13} /> Interní nástroj — jen pro členy týmu.</p>

      <div className="mt-6">
        <Segmented
          id="auth"
          value={mode}
          onChange={(m) => { setMode(m); setError(''); }}
          options={[{ value: 'login', label: 'Přihlášení' }, { value: 'register', label: 'Vytvořit účet' }]}
        />
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field id="a-name" label="Jméno" icon={<User size={15} />} autoFocus autoComplete="username" placeholder="Marek" value={f.name} onChange={set('name')} />
        <Field
          id="a-pass"
          label={mode === 'login' ? 'Heslo' : `Heslo (min. ${MIN_PASSWORD} znaků)`}
          icon={<KeyRound size={15} />}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="••••••••••"
          value={f.password}
          onChange={set('password')}
        />
        {mode === 'register' && (
          <>
            <div>
              <Field id="a-code" label="Kód týmu" icon={<Ticket size={15} />} autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX" value={f.code} onChange={set('code')} />
              <p className="mt-1.5 text-xs text-zinc-500">Kód vám pošle kolega — najde ho v aplikaci v „Účtech týmu“.</p>
            </div>
            <div>
              <span className="label">Vaše barva</span>
              <Swatches value={f.color} onChange={(color) => setF((p) => ({ ...p, color }))} />
              <p className="mt-1.5 text-xs text-zinc-500">Avatar, ikonu, roli a rozložení si upravíte po přihlášení v profilu.</p>
            </div>
          </>
        )}
        <ErrorBox>{error}</ErrorBox>
        <Submit busy={busy}>{mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}</Submit>
      </form>
    </Frame>
  );
}

/* Úplně první spuštění: vlastník vloží GitHub token a založí svůj účet. */
function Setup({ auth }) {
  const [f, setF] = useState({ token: '', name: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (userId(f.name).length < 2) return setError('Zadejte jméno.');
    if (f.password.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    setBusy(true);
    setError('');
    try {
      const t = f.token.trim();
      const k = newDataKey();
      await verifyAccess(t);
      await initData(t, k);
      const owner = await sealToken(f.name, f.password, JSON.stringify({ t, k }));
      const invite = await buildInvite(newInviteCode(), t, k);
      auth.setAccounts(await saveAccounts(t, () => ({ users: [owner], ...invite })));
      auth.start(f.name, t, k);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  return (
    <Frame wide>
      <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
        První <span className="font-serif text-[1.12em] font-normal italic text-brand">nastavení</span>
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">Děláte jen jednou. Kolegové si pak účty vytvoří sami pomocí kódu týmu.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="s-token">GitHub token</label>
          <input id="s-token" type="password" className="field font-mono" required autoComplete="off" spellCheck={false} placeholder="github_pat_…" value={f.token} onChange={set('token')} />
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Token pro repozitář <b className="font-medium text-zinc-300">{APP_REPO}</b> s právem <b className="font-medium text-zinc-300">Contents: Read and write</b>. Uloží se jen zašifrovaně.{' '}
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300">
              Vytvořit <ExternalLink size={11} />
            </a>
          </p>
        </div>
        <Field id="s-name" label="Vaše jméno" icon={<User size={15} />} autoComplete="username" placeholder="Marek" value={f.name} onChange={set('name')} />
        <Field id="s-pass" label={`Heslo (min. ${MIN_PASSWORD} znaků)`} icon={<KeyRound size={15} />} type="password" autoComplete="new-password" placeholder="••••••••••" value={f.password} onChange={set('password')} />
        <ErrorBox>{error}</ErrorBox>
        <Submit busy={busy}>Založit CRM</Submit>
      </form>
    </Frame>
  );
}

export default function Auth({ auth }) {
  return auth.accounts.users.length ? <Entrance auth={auth} /> : <Setup auth={auth} />;
}

/* Účty týmu: kód pro nové členy, seznam účtů, obnova hesla kolegovi. */
export function AccountsModal({ session, auth, onClose, notify }) {
  const { accounts } = auth;
  const [code, setCode] = useState('');
  const [f, setF] = useState({ name: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!accounts.inviteCode) setCode('');
    else decryptData(session.key, accounts.inviteCode).then((c) => alive && setCode(c)).catch(() => alive && setCode(''));
    return () => { alive = false; };
  }, [accounts.inviteCode, session.key]);

  const apply = async (change, done) => {
    setBusy(true);
    setError('');
    try {
      auth.setAccounts(await saveAccounts(session.token, change));
      notify(done);
    } catch (err) {
      setError(err.message || 'Účty se nepodařilo uložit. Zkuste to znovu.');
    }
    setBusy(false);
  };

  const rotate = async () => {
    const invite = await buildInvite(newInviteCode(), session.token, session.key);
    await apply((file) => ({ ...file, ...invite }), 'Nový kód týmu je připravený');
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!accounts.users.some((u) => userId(u.name) === userId(f.name))) return setError('Takový účet neexistuje. Nový člen si účet vytvoří sám pomocí kódu týmu.');
    if (f.password.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    const entry = await sealToken(f.name, f.password, JSON.stringify({ t: session.token, k: session.key }));
    await apply((file) => ({ ...file, users: file.users.map((u) => (userId(u.name) === userId(f.name) ? { ...entry, name: u.name } : u)) }), `Heslo pro ${f.name} nastaveno`);
    setF({ name: '', password: '' });
    return undefined;
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

        <div className="mt-4 rounded-2xl border border-brand/30 bg-brand/[0.07] p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400"><Ticket size={13} /> Kód týmu pro nové členy</div>
          {code ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 select-all rounded-xl bg-black/40 px-3 py-2 text-center font-mono text-[15px] tracking-wider" data-testid="invite-code">{code}</code>
                <button
                  className="btn-ghost !p-2.5"
                  aria-label="Zkopírovat kód"
                  onClick={() => navigator.clipboard?.writeText(code).then(() => notify('Kód zkopírován'), () => notify('Kód se nepodařilo zkopírovat', true))}
                >
                  <Copy size={15} />
                </button>
                <button className="btn-ghost !p-2.5" aria-label="Vygenerovat nový kód" title="Vygenerovat nový kód (starý přestane platit)" disabled={busy} onClick={rotate}>
                  <RefreshCw size={15} />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">Pošlete ho kolegovi soukromě. Na přihlašovací stránce zvolí „Vytvořit účet“ a nastaví si vlastní jméno a heslo.</p>
            </>
          ) : (
            <button className="btn-primary mt-3 w-full disabled:opacity-60" disabled={busy} onClick={rotate}>
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />} Vytvořit kód týmu
            </button>
          )}
        </div>

        <ul className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          {accounts.users.map((u) => {
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
                    onClick={() => window.confirm(`Odebrat účet ${u.name}?`) && apply((file) => ({ ...file, users: file.users.filter((x) => x.name !== u.name) }), `Účet ${u.name} odebrán`)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={reset} className="mt-5 space-y-3">
          <span className="label">Kolega zapomněl heslo?</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" placeholder="Jméno účtu" aria-label="Jméno účtu" autoComplete="off" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="field" type="password" placeholder="Nové heslo" aria-label="Nové heslo" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>
          <ErrorBox>{error}</ErrorBox>
          <button className="btn-ghost w-full disabled:opacity-50" disabled={busy || !f.name.trim() || !f.password}>Nastavit nové heslo</button>
        </form>
      </div>
    </Shell>
  );
}
