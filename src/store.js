import { useCallback, useEffect, useRef, useState } from 'react';
import { SEED_CLIENTS, TEAM } from './data';
import { today } from './lib';
import { supabase } from './supabase';

export const remote = Boolean(supabase);

const STORE = 'projectwo-crm.v1';
const loadLocal = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && Array.isArray(saved.clients)) return saved.clients;
  } catch { /* poškozená nebo nedostupná data — použijeme demo */ }
  return SEED_CLIENTS;
};

/* Přihlášení (jen v ostrém režimu se Supabase). */
export function useSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!remote);
  useEffect(() => {
    if (!remote) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

/* Data CRM. Lokálně: demo data v localStorage. Ostře: sdílená databáze se živou synchronizací. */
export function useCrm(session, onError) {
  const [clients, setClients] = useState(() => (remote ? [] : loadLocal()));
  const [team, setTeam] = useState(remote ? [] : TEAM);
  const [loading, setLoading] = useState(remote);
  const pending = useRef(new Map()); // id → { patch, timer } — odložené zápisy při psaní
  const fail = useRef(onError);
  fail.current = onError;
  const uid = session?.user?.id;

  useEffect(() => {
    if (remote) return;
    try { localStorage.setItem(STORE, JSON.stringify({ clients })); } catch { /* bez persistence */ }
  }, [clients]);

  const refetch = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.error || c.error) {
      fail.current?.('Nepodařilo se načíst data. Zkontrolujte, že je váš e-mail na seznamu týmu.');
    } else {
      setTeam(p.data);
      setClients(c.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!remote || !uid) return undefined;
    refetch();
    const upsert = (set) => ({ eventType, new: row, old }) => {
      set((rows) => {
        if (eventType === 'DELETE') return rows.filter((r) => r.id !== old.id);
        // Rozepsané lokální změny mají přednost před ozvěnou ze serveru.
        const merged = { ...row, ...(pending.current.get(row.id)?.patch || {}) };
        return rows.some((r) => r.id === row.id) ? rows.map((r) => (r.id === row.id ? merged : r)) : [merged, ...rows];
      });
    };
    const channel = supabase
      .channel('crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, upsert(setClients))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [uid, refetch]);

  const flush = useCallback(async (id) => {
    const entry = pending.current.get(id);
    if (!entry) return;
    pending.current.delete(id);
    const { error } = await supabase.from('clients').update(entry.patch).eq('id', id);
    if (error) {
      fail.current?.('Změnu se nepodařilo uložit — načítám aktuální stav.');
      refetch();
    }
  }, [refetch]);

  const patch = useCallback((id, p) => {
    const full = { ...p, updated: today() };
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, ...full } : c)));
    if (!remote) return;
    const entry = pending.current.get(id);
    clearTimeout(entry?.timer);
    pending.current.set(id, { patch: { ...entry?.patch, ...full }, timer: setTimeout(() => flush(id), 450) });
  }, [flush]);

  const add = useCallback(async (client) => {
    setClients((cs) => [client, ...cs]);
    if (!remote) return;
    const { error } = await supabase.from('clients').insert(client);
    if (error) {
      fail.current?.('Klienta se nepodařilo uložit.');
      refetch();
    }
  }, [refetch]);

  const remove = useCallback(async (id) => {
    setClients((cs) => cs.filter((c) => c.id !== id));
    if (!remote) return;
    clearTimeout(pending.current.get(id)?.timer);
    pending.current.delete(id);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      fail.current?.('Klienta se nepodařilo smazat.');
      refetch();
    }
  }, [refetch]);

  const resetDemo = useCallback(() => { if (!remote) setClients(SEED_CLIENTS); }, []);

  return { clients, team, loading, patch, add, remove, resetDemo };
}
