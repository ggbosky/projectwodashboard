import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, KeyRound, LoaderCircle, Lock } from 'lucide-react';
import { DATA_REPO } from '../store';
import { LogoMark } from './ui';

export default function Auth({ signIn }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(token);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/[0.16] blur-[150px]" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative w-full max-w-[420px] p-7"
      >
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-auto" />
          <span className="font-display text-xl font-bold tracking-tight">Project Two</span>
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">CRM</span>
        </div>

        <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
          Vítejte <span className="font-serif text-[1.12em] font-normal italic text-brand">zpět</span>.
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500"><Lock size={13} /> Interní nástroj — přihlášení GitHub účtem.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="a-token">GitHub token</label>
            <div className="relative">
              <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="a-token"
                type="password"
                className="field !pl-9 font-mono"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="github_pat_… nebo ghp_…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-200">{error}</p>}
          <button className="btn-primary w-full disabled:opacity-60" disabled={busy || !token.trim()}>
            {busy && <LoaderCircle size={15} className="animate-spin" />}
            Přihlásit se
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-zinc-500">
          Token potřebuje právo zápisu do soukromého repozitáře <b className="font-medium text-zinc-300">{DATA_REPO}</b>, kde jsou data CRM.
          Zůstane uložený jen v tomto prohlížeči, dokud se neodhlásíte.
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-1 font-medium text-sky-400 hover:text-sky-300"
          >
            Vytvořit token na GitHubu <ExternalLink size={11} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
