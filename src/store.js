import { useCallback, useEffect, useRef, useState } from 'react';
import { SEED_CLIENTS, TEAM } from './data';
import { today } from './lib';

/* Týmový režim: data žijí v souboru crm.json v soukromém GitHub repozitáři.
   Přihlášení = osobní GitHub token; přístup má jen ten, kdo má do repozitáře právo zápisu. */
export const DATA_REPO = import.meta.env.VITE_DATA_REPO || '';
export const remote = Boolean(DATA_REPO);

const API = 'https://api.github.com';
const FILE = 'crm.json';
const TOKEN_KEY = 'projectwo-crm.token';
const LOCAL_KEY = 'projectwo-crm.v1';
const PALETTE = ['#FF5A0F', '#38BDF8', '#34D399', '#FBBF24', '#F472B6'];
const AI_AGENT = { id: 'claude', name: 'Claude', role: 'AI outreach agent', color: '#A78BFA', ai: true };

function gh(token, path, opts = {}) {
  return fetch(API + path, {
    cache: 'no-store',
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...opts.headers,
    },
  });
}

const encode = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (ch) => ch.charCodeAt(0)));

/* Ověří token a přístup k datovému repozitáři. Vrací session, nebo vyhodí srozumitelnou chybu. */
async function authenticate(token) {
  let res;
  try {
    res = await gh(token, '/user');
  } catch {
    throw new Error('Nepodařilo se spojit s GitHubem. Zkontrolujte připojení.');
  }
  if (res.status === 401) throw new Error('Token není platný nebo už vypršel.');
  if (!res.ok) throw new Error('GitHub přihlášení odmítl. Zkuste to za chvíli.');
  const user = await res.json();

  const repoRes = await gh(token, `/repos/${DATA_REPO}`);
  if (!repoRes.ok) throw new Error(`Token nemá přístup k repozitáři ${DATA_REPO}. Zkontrolujte oprávnění tokenu a pozvánku do repozitáře.`);
  const repo = await repoRes.json();
  if (!repo.private) throw new Error(`Repozitář ${DATA_REPO} je veřejný. Data klientů se ukládají jen do soukromého repozitáře.`);
  if (!repo.permissions?.push) throw new Error(`V repozitáři ${DATA_REPO} nemáte právo zápisu.`);

  return { token, user: { id: user.login, name: (user.name || user.login).split(' ')[0] } };
}

export function useSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!remote);

  useEffect(() => {
    if (!remote) return;
    let token = null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch { /* bez úložiště */ }
    if (!token) { setReady(true); return; }
    authenticate(token)
      .then(setSession)
      .catch(() => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* nic */ } })
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (token) => {
    const s = await authenticate(token.trim());
    try { localStorage.setItem(TOKEN_KEY, s.token); } catch { /* přihlášení jen pro tuto návštěvu */ }
    setSession(s);
  }, []);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* nic */ }
    setSession(null);
  }, []);

  return { session, ready, signIn, signOut };
}

/* Změny se drží jako operace, aby šly znovu přehrát nad čerstvými daty kolegů. */
function applyOps(base, ops) {
  let { team, clients } = base;
  for (const op of ops) {
    if (op.type === 'add' && !clients.some((c) => c.id === op.client.id)) clients = [op.client, ...clients];
    else if (op.type === 'patch') clients = clients.map((c) => (c.id === op.id ? { ...c, ...op.patch } : c));
    else if (op.type === 'remove') clients = clients.filter((c) => c.id !== op.id);
    else if (op.type === 'member' && !team.some((m) => m.id === op.member.id)) {
      const humans = team.filter((m) => !m.ai).length;
      team = [...team, { ...op.member, color: PALETTE[humans % PALETTE.length] }];
    }
  }
  return { team, clients };
}

const loadLocal = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (saved && Array.isArray(saved.clients)) return saved.clients;
  } catch { /* poškozená nebo nedostupná data — použijeme demo */ }
  return SEED_CLIENTS;
};

export function useCrm(session, onError) {
  const [data, setData] = useState(() => (remote ? { team: [], clients: [] } : { team: TEAM, clients: loadLocal() }));
  const [loading, setLoading] = useState(remote);
  const [status, setStatus] = useState('načítám…');

  const base = useRef({ team: [AI_AGENT], clients: [] });
  const sha = useRef(null);
  const etag = useRef(null);
  const ops = useRef([]);
  const saving = useRef(false);
  const timer = useRef();
  const fail = useRef(onError);
  fail.current = onError;
  const token = session?.token;
  const me = session?.user;

  const render = useCallback(() => {
    const view = applyOps(base.current, ops.current);
    setData({ ...view, team: [...view.team].sort((a, b) => Number(a.ai) - Number(b.ai)) });
  }, []);

  useEffect(() => {
    if (remote) return;
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ clients: data.clients })); } catch { /* bez persistence */ }
  }, [data.clients]);

  /* Načte aktuální soubor z GitHubu. Vrací false při chybě. */
  const pull = useCallback(async (force = false) => {
    const headers = !force && etag.current ? { 'If-None-Match': etag.current } : {};
    let res;
    try {
      res = await gh(token, `/repos/${DATA_REPO}/contents/${FILE}`, { headers });
    } catch {
      setStatus('offline — zkouším znovu');
      return false;
    }
    if (res.status === 304) return true;
    if (res.status === 404) {
      // Prázdný repozitář nebo první spuštění — soubor vznikne při prvním uložení.
      base.current = { team: [AI_AGENT], clients: [] };
      sha.current = null;
      return true;
    }
    if (!res.ok) {
      setStatus('chyba čtení z GitHubu');
      return false;
    }
    try {
      const file = await res.json();
      const parsed = JSON.parse(decode(file.content));
      base.current = {
        team: Array.isArray(parsed.team) && parsed.team.length ? parsed.team : [AI_AGENT],
        clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      };
      sha.current = file.sha;
      etag.current = res.headers.get('etag');
      return true;
    } catch {
      setStatus('soubor crm.json je poškozený');
      return false;
    }
  }, [token]);

  const save = useCallback(async () => {
    if (saving.current || !ops.current.length) return;
    saving.current = true;
    setStatus('ukládám…');
    let done = false;
    for (let attempt = 0; attempt < 4 && !done; attempt += 1) {
      const batch = ops.current.slice();
      const next = applyOps(base.current, batch);
      let res;
      try {
        res = await gh(token, `/repos/${DATA_REPO}/contents/${FILE}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `CRM: ${me.id} (${batch.length} ${batch.length === 1 ? 'změna' : 'změny'})`,
            content: encode(JSON.stringify(next, null, 2)),
            ...(sha.current ? { sha: sha.current } : {}),
          }),
        });
      } catch {
        break;
      }
      if (res.ok) {
        const body = await res.json();
        base.current = next;
        sha.current = body.content.sha;
        etag.current = null;
        ops.current = ops.current.slice(batch.length);
        done = true;
      } else if (res.status === 409 || res.status === 422) {
        // Někdo z týmu uložil dřív — načteme jeho verzi a naše změny přehrajeme nad ní.
        if (!(await pull(true))) break;
      } else {
        break;
      }
    }
    saving.current = false;
    render();
    if (!done) {
      setStatus('neuloženo — zkouším znovu');
      fail.current?.('Změny se nepodařilo uložit do GitHubu. Zkusím to znovu.');
      clearTimeout(timer.current);
      timer.current = setTimeout(save, 8000);
    } else if (ops.current.length) {
      save();
    } else {
      setStatus('uloženo');
    }
  }, [token, me, pull, render]);

  const push = useCallback((op) => {
    const last = ops.current[ops.current.length - 1];
    // Souvislé úpravy téhož klienta (psaní poznámek) slučujeme do jedné operace.
    if (!saving.current && op.type === 'patch' && last?.type === 'patch' && last.id === op.id) {
      ops.current = [...ops.current.slice(0, -1), { ...last, patch: { ...last.patch, ...op.patch } }];
    } else {
      ops.current = [...ops.current, op];
    }
    render();
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [render, save]);

  /* První načtení, zápis vlastního profilu a pravidelná synchronizace. */
  useEffect(() => {
    if (!remote || !token) return undefined;
    let alive = true;
    const sync = async () => {
      if (saving.current || document.hidden) return;
      const ok = await pull();
      if (!alive) return;
      if (ok) {
        render();
        if (!ops.current.length) setStatus('synchronizováno');
      }
    };
    (async () => {
      const ok = await pull(true);
      if (!alive) return;
      if (!ok) fail.current?.('Nepodařilo se načíst data z GitHubu.');
      else if (!base.current.team.some((m) => m.id === me.id)) {
        push({ type: 'member', member: { id: me.id, name: me.name, role: 'Člen týmu', ai: false } });
      } else setStatus('synchronizováno');
      render();
      setLoading(false);
    })();
    const interval = setInterval(sync, 20000);
    document.addEventListener('visibilitychange', sync);
    const warn = (e) => { if (ops.current.length) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => {
      alive = false;
      clearInterval(interval);
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('beforeunload', warn);
    };
  }, [token, me, pull, push, render]);

  const patch = useCallback((id, p) => {
    const full = { ...p, updated: today() };
    if (remote) push({ type: 'patch', id, patch: full });
    else setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...full } : c)) }));
  }, [push]);

  const add = useCallback((client) => {
    if (remote) push({ type: 'add', client });
    else setData((d) => ({ ...d, clients: [client, ...d.clients] }));
  }, [push]);

  const remove = useCallback((id) => {
    if (remote) push({ type: 'remove', id });
    else setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
  }, [push]);

  const resetDemo = useCallback(() => { if (!remote) setData((d) => ({ ...d, clients: SEED_CLIENTS })); }, []);

  return { clients: data.clients, team: data.team, loading, status, patch, add, remove, resetDemo };
}
