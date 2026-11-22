import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Download, ExternalLink, KeyRound, LoaderCircle, Lock, RefreshCw, ShieldCheck, Ticket, Trash2, User, UserPlus, X } from 'lucide-react';
import { MIN_PASSWORD, decryptData, newDataKey, newInviteCode, sealToken, userId } from '../auth';
import { APP_REPO, PALETTE, buildInvite, initData, saveAccounts, verifyAccess, withAdmin } from '../store';
import { memberOf } from '../lib';
import { Shell } from './Modals';
import { Avatar, LogoMark, Segmented } from './ui';

const isDesktopApp = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);

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
      {!isDesktopApp && (
        <a
          href={`${import.meta.env.BASE_URL}ProjectTwoCRM.exe`}
          download
          className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-xs text-zinc-500 transition hover:text-zinc-200"
        >
          <Download size={13} /> Stáhnout aplikaci pro Windows
        </a>
      )}
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
              <p className="mt-1.5 text-xs text-zinc-500">Kód vám pošle admin týmu.</p>
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
      const owner = { ...(await sealToken(f.name, f.password, JSON.stringify({ t, k }))), admin: true };
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
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">Děláte jen jednou. Stanete se adminem — členy pak přidáte sami, nebo si účty vytvoří pomocí kódu týmu.</p>
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

/* Správa týmu — jen pro admina: přidání a odebrání členů, hesla, admin práva, kód týmu. */
export function AdminModal({ session, auth, clients, onRemoveMember, onClose, notify }) {
  const users = withAdmin(auth.accounts.users);
  const admins = users.filter((u) => u.admin).length;
  const [code, setCode] = useState('');
  const [f, setF] = useState({ name: '', password: '', admin: false });
  const [resetFor, setResetFor] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const secret = JSON.stringify({ t: session.token, k: session.key });

  useEffect(() => {
    let alive = true;
    if (!auth.accounts.inviteCode) setCode('');
    else decryptData(session.key, auth.accounts.inviteCode).then((c) => alive && setCode(c)).catch(() => alive && setCode(''));
    return () => { alive = false; };
  }, [auth.accounts.inviteCode, session.key]);

  // Každá změna vychází z čerstvého seznamu na GitHubu a zapisuje admin práva výslovně.
  const apply = async (change, done) => {
    setBusy(true);
    setError('');
    let ok = true;
    try {
      auth.setAccounts(await saveAccounts(session.token, (file) => change({ ...file, users: withAdmin(file.users) })));
      notify(done);
    } catch (err) {
      setError(err.message || 'Změnu se nepodařilo uložit. Zkuste to znovu.');
      ok = false;
    }
    setBusy(false);
    return ok;
  };
  const mapUser = (name, fn) => (file) => ({ ...file, users: file.users.map((u) => (u.name === name ? fn(u) : u)) });

  const rotate = async () => {
    const invite = await buildInvite(newInviteCode(), session.token, session.key);
    await apply((file) => ({ ...file, ...invite }), 'Nový kód týmu je připravený');
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (userId(f.name).length < 2) return setError('Zadejte jméno nového člena.');
    if (users.some((u) => userId(u.name) === userId(f.name))) return setError('Účet s tímto jménem už existuje.');
    if (f.password.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    const entry = { ...(await sealToken(f.name, f.password, secret)), admin: f.admin };
    if (await apply((file) => ({ ...file, users: [...file.users, entry] }), `Účet ${entry.name} vytvořen`)) setF({ name: '', password: '', admin: false });
    return undefined;
  };

  const resetPassword = async (e, u) => {
    e.preventDefault();
    if (newPass.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    const entry = await sealToken(u.name, newPass, secret);
    if (await apply(mapUser(u.name, (x) => ({ ...entry, name: x.name, admin: x.admin })), `Nové heslo pro ${u.name} nastaveno`)) { setResetFor(null); setNewPass(''); }
    return undefined;
  };

  const removeUser = async (u) => {
    const owned = clients.filter((c) => c.owner === userId(u.name)).length;
    const note = owned ? ` Jeho ${owned} klientů se uvolní jako volné leady.` : '';
    if (!window.confirm(`Odebrat člena ${u.name}?${note}`)) return;
    if (await apply((file) => ({ ...file, users: file.users.filter((x) => x.name !== u.name) }), `Člen ${u.name} odebrán`)) onRemoveMember(userId(u.name));
  };

  return (
    <Shell onClose={onClose} label="Správa týmu" wide>
      <div className="scroll-thin max-h-[88vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand"><ShieldCheck size={13} /> Admin</div>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              Správa <span className="font-serif text-[1.15em] font-normal italic text-brand">týmu</span>
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2" aria-label="Zavřít"><X size={16} /></button>
        </div>

        <span className="label mt-5">Členové ({users.length})</span>
        <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          {users.map((u) => {
            const id = userId(u.name);
            const self = id === session.user.id;
            const profile = memberOf(id);
            const lastAdmin = u.admin && admins === 1;
            return (
              <li key={u.name} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar id={id} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{profile && profile.name !== u.name ? `${profile.name} (${u.name})` : u.name}</span>
                      {u.admin && <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">Admin</span>}
                      {self && <span className="text-xs font-normal text-zinc-500">vy</span>}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {profile ? `${profile.role} · ${clients.filter((c) => c.owner === id).length} klientů` : 'Zatím se nepřihlásil'}
                    </div>
                  </div>
                  <button
                    className={`btn-ghost !p-2 ${u.admin ? '!text-brand' : ''}`}
                    disabled={busy || lastAdmin}
                    title={lastAdmin ? 'Poslední admin musí zůstat' : u.admin ? 'Odebrat admin práva' : 'Udělat adminem'}
                    aria-label={u.admin ? `Odebrat admin práva: ${u.name}` : `Udělat adminem: ${u.name}`}
                    aria-pressed={Boolean(u.admin)}
                    onClick={() => apply(mapUser(u.name, (x) => ({ ...x, admin: !x.admin })), u.admin ? `${u.name} už není admin` : `${u.name} je admin`)}
                  >
                    <ShieldCheck size={15} />
                  </button>
                  <button className="btn-ghost !p-2" disabled={busy} title="Nastavit nové heslo" aria-label={`Nové heslo: ${u.name}`} onClick={() => { setResetFor(resetFor === u.name ? null : u.name); setNewPass(''); setError(''); }}>
                    <KeyRound size={15} />
                  </button>
                  <button className="btn-ghost !p-2 hover:!text-red-400 disabled:opacity-30" disabled={busy || self} title={self ? 'Sami sebe odebrat nemůžete' : 'Odebrat člena'} aria-label={`Odebrat člena ${u.name}`} onClick={() => removeUser(u)}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {resetFor === u.name && (
                  <form onSubmit={(e) => resetPassword(e, u)} className="mt-3 flex gap-2">
                    <input className="field" type="password" autoFocus placeholder={`Nové heslo pro ${u.name} (min. ${MIN_PASSWORD})`} aria-label={`Nové heslo pro ${u.name}`} autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                    <button className="btn-primary shrink-0 disabled:opacity-60" disabled={busy || !newPass}>Uložit</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={addMember} className="mt-5 space-y-3">
          <span className="label">Přidat člena</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" placeholder="Jméno" aria-label="Jméno nového člena" autoComplete="off" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="field" type="password" placeholder={`Heslo (min. ${MIN_PASSWORD})`} aria-label="Heslo nového člena" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={f.admin} onChange={(e) => setF({ ...f, admin: e.target.checked })} />
            Dát admin práva
          </label>
          <ErrorBox>{error}</ErrorBox>
          <button className="btn-primary w-full disabled:opacity-60" disabled={busy || !f.name.trim() || !f.password}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />} Vytvořit účet
          </button>
          <p className="text-xs leading-relaxed text-zinc-500">Jméno a heslo předejte kolegovi; heslo, barvu a vzhled si pak změní sám v profilu.</p>
        </form>

        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400"><Ticket size={13} /> Kód týmu — kolega si účet vytvoří sám</div>
          {code ? (
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 select-all rounded-xl bg-black/40 px-3 py-2 text-center font-mono text-[15px] tracking-wider" data-testid="invite-code">{code}</code>
              <button className="btn-ghost !p-2.5" aria-label="Zkopírovat kód" onClick={() => navigator.clipboard?.writeText(code).then(() => notify('Kód zkopírován'), () => notify('Kód se nepodařilo zkopírovat', true))}>
                <Copy size={15} />
              </button>
              <button className="btn-ghost !p-2.5" aria-label="Vygenerovat nový kód" title="Vygenerovat nový kód (starý přestane platit)" disabled={busy} onClick={rotate}>
                <RefreshCw size={15} />
              </button>
            </div>
          ) : (
            <button className="btn-ghost mt-3 w-full disabled:opacity-60" disabled={busy} onClick={rotate}>Vytvořit kód týmu</button>
          )}
        </div>
      </div>
    </Shell>
  );
}
