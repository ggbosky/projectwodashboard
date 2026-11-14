import { useCallback, useEffect, useRef, useState } from 'react';
import { SEED_CLIENTS, TEAM } from './data';
import { today } from './lib';
import { decryptData, encryptData, openToken, userId } from './auth';

/* Týmový režim: data žijí zašifrovaná v souboru crm.json na samostatné větvi tohoto repozitáře.
   Členové se hlásí jménem a heslem; heslo odemkne token a datový klíč z users.json. */
export const APP_REPO = import.meta.env.VITE_APP_REPO || '';
// Větev, ze které se web nasazuje — sem se ukládá seznam účtů.
export const APP_BRANCH = import.meta.env.VITE_APP_BRANCH || 'main';
export const DATA_BRANCH = 'crm-data';
export const remote = Boolean(APP_REPO);

const API = 'https://api.github.com';
const FILE = 'crm.json';
const USERS_PATH = 'public/users.json';
const SESSION_KEY = 'projectwo-crm.session';
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

const repoName = APP_REPO.split('/')[1] || APP_REPO;
const NO_WRITE = `Token nemá právo zápisu do repozitáře ${repoName}. V nastavení tokenu na GitHubu zvolte „Repository access → Only select repositories → ${repoName}“ a „Permissions → Repository permissions → Contents → Read and write“. Pak token vygenerujte znovu a vložte sem.`;

async function call(token, path, opts) {
  let res;
  try {
    res = await gh(token, path, opts);
  } catch {
    throw new Error('Nepodařilo se spojit s GitHubem. Zkontrolujte připojení.');
  }
  if (res.status === 401) throw new Error('Token není platný nebo už vypršel. Zkopírujte ho z GitHubu znovu celý (začíná github_pat_ nebo ghp_).');
  return res;
}

/* Ověří, že token platí a repozitář vidí. */
export async function verifyAccess(token) {
  const res = await call(token, `/repos/${APP_REPO}`);
  if (!res.ok) throw new Error(NO_WRITE);
}

const dataPath = `/repos/${APP_REPO}/contents/${FILE}`;

/* Založí (nebo přepíše) zašifrovaný datový soubor. Zároveň ověří, že token smí zapisovat. */
export async function initData(token, key) {
  const text = await encryptData(key, JSON.stringify({ team: [AI_AGENT], clients: [] }));
  const existing = await call(token, `${dataPath}?ref=${DATA_BRANCH}`);
  if (existing.ok) {
    const { sha } = await existing.json();
    const res = await call(token, dataPath, { method: 'PUT', body: JSON.stringify({ message: 'CRM: nové nastavení', content: encode(text), branch: DATA_BRANCH, sha }) });
    if (!res.ok) throw new Error(NO_WRITE);
    return;
  }
  // Samostatná větev bez historie kódu: strom → commit → větev.
  const post = async (path, body) => {
    const res = await call(token, `/repos/${APP_REPO}/git/${path}`, { method: 'POST', body: JSON.stringify(body) });
    if (res.status === 422 && path === 'refs') return {}; // větev už existuje, soubor doplní první uložení
    if (!res.ok) throw new Error(NO_WRITE);
    return res.json();
  };
  const tree = await post('trees', { tree: [{ path: FILE, mode: '100644', type: 'blob', content: text }] });
  const commit = await post('commits', { message: 'CRM: založení dat', tree: tree.sha, parents: [] });
  await post('refs', { ref: `refs/heads/${DATA_BRANCH}`, sha: commit.sha });
}

/* Seznam účtů (jména + zašifrované klíče) — veřejný soubor nasazený spolu s aplikací. */
export async function fetchUsers() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}users.json`, { cache: 'no-store' });
    const parsed = res.ok ? await res.json() : null;
    return Array.isArray(parsed?.users) ? parsed.users : [];
  } catch {
    return [];
  }
}

/* Uloží seznam účtů do repozitáře s aplikací (nasazovaná větev → web se sám znovu nasadí).
   Když klíč do repozitáře s aplikací nesmí, soubor se stáhne k ručnímu nahrání. */
export async function saveUsers(token, change) {
  const path = `/repos/${APP_REPO}/contents/${USERS_PATH}`;
  let current = null;
  let sha;
  if (APP_REPO) {
    try {
      const res = await gh(token, `${path}?ref=${encodeURIComponent(APP_BRANCH)}`);
      if (res.ok) {
        const file = await res.json();
        sha = file.sha;
        current = JSON.parse(decode(file.content)).users;
      } else if (res.status === 404) current = [];
    } catch { /* spadneme do ručního režimu */ }
  }
  const users = change(Array.isArray(current) ? current : await fetchUsers());
  const text = JSON.stringify({ v: 1, users }, null, 2);
  if (APP_REPO && current) {
    try {
      const res = await gh(token, path, {
        method: 'PUT',
        body: JSON.stringify({ message: 'CRM: aktualizace účtů', content: encode(text), branch: APP_BRANCH, ...(sha ? { sha } : {}) }),
      });
      if (res.ok) return { users, committed: true };
    } catch { /* ruční režim */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'users.json';
  a.click();
  URL.revokeObjectURL(a.href);
  return { users, committed: false };
}

const BAD_LOGIN = 'Nesprávné jméno nebo heslo.';

export function useSession() {
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(!remote);

  useEffect(() => {
    if (!remote) return;
    (async () => {
      setUsers(await fetchUsers());
      try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (saved?.token && saved?.key && saved?.user?.id) {
          await verifyAccess(saved.token);
          setSession(saved);
        }
      } catch {
        try { localStorage.removeItem(SESSION_KEY); } catch { /* nic */ }
      }
      setReady(true);
    })();
  }, []);

  const start = useCallback((name, token, key) => {
    const s = { token, key, user: { id: userId(name), name: name.trim() } };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* přihlášení jen pro tuto návštěvu */ }
    setSession(s);
  }, []);

  const signIn = useCallback(async (name, password) => {
    const entry = users.find((u) => userId(u.name) === userId(name));
    if (!entry) throw new Error(BAD_LOGIN);
    let secret;
    try {
      secret = JSON.parse(await openToken(entry, password));
    } catch {
      throw new Error(BAD_LOGIN);
    }
    await verifyAccess(secret.t);
    start(entry.name, secret.t, secret.k);
  }, [users, start]);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* nic */ }
    setSession(null);
  }, []);

  return { session, ready, users, setUsers, signIn, signOut, start };
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
  const key = session?.key;
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
      res = await gh(token, `${dataPath}?ref=${DATA_BRANCH}`, { headers });
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
      const parsed = JSON.parse(await decryptData(key, decode(file.content)));
      base.current = {
        team: Array.isArray(parsed.team) && parsed.team.length ? parsed.team : [AI_AGENT],
        clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      };
      sha.current = file.sha;
      etag.current = res.headers.get('etag');
      return true;
    } catch {
      setStatus('data se nepodařilo rozšifrovat');
      return false;
    }
  }, [token, key]);

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
        const content = encode(await encryptData(key, JSON.stringify(next)));
        res = await gh(token, dataPath, {
          method: 'PUT',
          body: JSON.stringify({
            message: `CRM: ${me.id} (${batch.length} ${batch.length === 1 ? 'změna' : 'změny'})`,
            content,
            branch: DATA_BRANCH,
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
  }, [token, key, me, pull, render]);

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
