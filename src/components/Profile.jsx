import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { MIN_PASSWORD, sealToken, userId } from '../auth';
import { saveAccounts } from '../store';
import { memberOf } from '../lib';
import { ErrorBox, Swatches } from './Auth';
import { Shell } from './Modals';
import { Avatar, Segmented } from './ui';

const EMOJI = ['', '🦊', '🚀', '⚡', '🎯', '🔥', '🧠', '🎨', '☕', '🐺', '💎', '🌙'];

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
    >
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-zinc-500">{hint}</span>
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-white/15'}`}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: checked ? 18 : 2 }} />
      </span>
    </button>
  );
}

/* Můj profil: jméno, role, barva, avatar, rozložení dashboardu a heslo. Ukládá se průběžně. */
export default function ProfileModal({ session, auth, onUpdate, onClose, notify }) {
  const me = memberOf(session.user.id);
  const prefs = me?.prefs || {};
  const [pw, setPw] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!me) return null;

  const setPref = (patch) => onUpdate({ prefs: { ...prefs, ...patch } });

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.a.length < MIN_PASSWORD) return setError(`Heslo musí mít alespoň ${MIN_PASSWORD} znaků.`);
    if (pw.a !== pw.b) return setError('Hesla se neshodují.');
    setBusy(true);
    setError('');
    try {
      const entry = await sealToken(session.user.name, pw.a, JSON.stringify({ t: session.token, k: session.key }));
      auth.setAccounts(await saveAccounts(session.token, (file) => ({ ...file, users: file.users.map((u) => (userId(u.name) === session.user.id ? entry : u)) })));
      setPw({ a: '', b: '' });
      notify('Heslo změněno');
    } catch (err) {
      setError(err.message || 'Heslo se nepodařilo změnit.');
    }
    setBusy(false);
    return undefined;
  };

  return (
    <Shell onClose={onClose} label="Můj profil" wide>
      <div className="scroll-thin max-h-[88vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar id={me.id} size={48} />
            <div>
              <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">
                Můj <span className="font-serif text-[1.15em] font-normal italic text-brand">profil</span>
              </h3>
              <p className="text-xs text-zinc-500">Přihlašovací jméno: {session.user.name} · změny se ukládají hned</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2" aria-label="Zavřít"><X size={16} /></button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-name">Zobrazované jméno</label>
            <input id="p-name" className="field" maxLength={24} value={me.name} onChange={(e) => onUpdate({ name: e.target.value })} onBlur={(e) => !e.target.value.trim() && onUpdate({ name: session.user.name })} />
          </div>
          <div>
            <label className="label" htmlFor="p-role">Role v týmu</label>
            <input id="p-role" className="field" maxLength={40} placeholder="Sales & strategie" value={me.role} onChange={(e) => onUpdate({ role: e.target.value })} />
          </div>
        </div>

        <span className="label mt-5">Barva — avatar i akcent celé aplikace</span>
        <Swatches value={me.color} onChange={(color) => onUpdate({ color })} />

        <span className="label mt-5">Avatar</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar">
          {EMOJI.map((e) => {
            const active = (me.emoji || '') === e;
            return (
              <button
                key={e || 'initial'}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={e ? `Avatar ${e}` : 'Avatar s iniciálou'}
                onClick={() => onUpdate({ emoji: e })}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition hover:bg-white/[0.08] ${active ? 'border-brand bg-brand/15' : 'border-white/[0.08] bg-white/[0.03]'}`}
              >
                {e || <span className="font-display text-sm font-semibold text-zinc-300">{me.name[0] || '?'}</span>}
              </button>
            );
          })}
        </div>

        <span className="label mt-5">Můj dashboard</span>
        <div className="space-y-2">
          <Toggle label="Finanční KPI karty" hint="Obrat, pipeline, uzavřené weby, průměrná zakázka" checked={prefs.kpis !== false} onChange={(v) => setPref({ kpis: v })} />
          <Toggle label="Přehled týmu" hint="Karty členů s klienty a vygenerovanými penězi" checked={prefs.team !== false} onChange={(v) => setPref({ team: v })} />
          <Toggle label="Jen moji klienti po přihlášení" hint="Pipeline se otevře vyfiltrovaná na vás" checked={prefs.mine === true} onChange={(v) => setPref({ mine: v })} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <span className="label">Výchozí pohled</span>
            <Segmented id="p-view" size="sm" value={prefs.view || 'kanban'} onChange={(view) => setPref({ view })} options={[{ value: 'kanban', label: 'Kanban' }, { value: 'list', label: 'Seznam' }]} />
          </div>
          <div>
            <span className="label">Výchozí měna</span>
            <Segmented id="p-cur" size="sm" value={prefs.currency || 'CZK'} onChange={(currency) => setPref({ currency })} options={[{ value: 'CZK', label: 'Kč' }, { value: 'EUR', label: 'EUR' }, { value: 'USD', label: 'USD' }]} />
          </div>
        </div>

        <form onSubmit={changePassword} className="mt-6 space-y-3 border-t border-white/[0.06] pt-5">
          <span className="label">Změna hesla</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="password" placeholder={`Nové heslo (min. ${MIN_PASSWORD})`} aria-label="Nové heslo" autoComplete="new-password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} />
            <input className="field" type="password" placeholder="Nové heslo znovu" aria-label="Nové heslo znovu" autoComplete="new-password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} />
          </div>
          <ErrorBox>{error}</ErrorBox>
          <button className="btn-ghost w-full disabled:opacity-50" disabled={busy || !pw.a || !pw.b}>
            {busy && <LoaderCircle size={15} className="animate-spin" />} Změnit heslo
          </button>
        </form>
      </div>
    </Shell>
  );
}
