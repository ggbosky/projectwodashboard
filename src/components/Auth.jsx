import { useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle, Lock, MailCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { LogoMark, Segmented } from './ui';

const MESSAGES = [
  [/invalid login credentials/i, 'Nesprávný e-mail nebo heslo.'],
  [/email not confirmed/i, 'Nejdřív potvrďte e-mail odkazem, který jsme vám poslali.'],
  [/already registered/i, 'Tento e-mail už účet má — přihlaste se.'],
  [/password should be/i, 'Heslo musí mít alespoň 6 znaků.'],
  [/database error|seznamu tymu/i, 'Tento e-mail není na seznamu týmu Project Two.'],
  [/rate limit/i, 'Příliš mnoho pokusů. Zkuste to za chvíli.'],
];
const translate = (msg) => MESSAGES.find(([re]) => re.test(msg))?.[1] || 'Něco se nepovedlo. Zkuste to prosím znovu.';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const creds = { email: f.email.trim(), password: f.password };
    const { data, error: err } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp({
            ...creds,
            options: { data: { name: f.name.trim() }, emailRedirectTo: window.location.origin + window.location.pathname },
          });
    setBusy(false);
    if (err) setError(translate(err.message));
    else if (mode === 'register' && !data.session) setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/[0.16] blur-[150px]" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-[400px] p-7"
      >
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-auto" />
          <span className="font-display text-xl font-bold tracking-tight">Project Two</span>
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">CRM</span>
        </div>

        {sent ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/40"><MailCheck size={26} /></div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Zkontrolujte e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Na adresu <b className="font-medium text-zinc-200">{f.email}</b> jsme poslali potvrzovací odkaz. Po kliknutí se můžete přihlásit.
            </p>
            <button className="btn-ghost mt-6 w-full" onClick={() => { setSent(false); setMode('login'); }}>Zpět na přihlášení</button>
          </div>
        ) : (
          <>
            <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
              Vítejte <span className="font-serif text-[1.12em] font-normal italic text-brand">zpět</span>.
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500"><Lock size={13} /> Interní nástroj — jen pro členy týmu.</p>

            <div className="mt-6">
              <Segmented
                id="auth"
                value={mode}
                onChange={(m) => { setMode(m); setError(''); }}
                options={[{ value: 'login', label: 'Přihlášení' }, { value: 'register', label: 'Nový účet' }]}
              />
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="label" htmlFor="a-name">Jméno</label>
                  <input id="a-name" className="field" required autoComplete="given-name" placeholder="Marek" value={f.name} onChange={set('name')} />
                </div>
              )}
              <div>
                <label className="label" htmlFor="a-email">E-mail</label>
                <input id="a-email" type="email" className="field" required autoComplete="email" placeholder="vy@projectwo.com" value={f.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label" htmlFor="a-pass">Heslo</label>
                <input
                  id="a-pass"
                  type="password"
                  className="field"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={f.password}
                  onChange={set('password')}
                />
              </div>
              {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
              <button className="btn-primary w-full disabled:opacity-60" disabled={busy}>
                {busy && <LoaderCircle size={15} className="animate-spin" />}
                {mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
