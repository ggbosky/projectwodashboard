/* Přihlášení jménem a heslem bez serveru.
   Přístupový klíč k datům (GitHub token) je v souboru users.json uložený zašifrovaně — pro každého
   člena zvlášť, jeho vlastním heslem (PBKDF2 + AES-GCM). Správné heslo klíč odemkne, špatné ne. */
const ITERATIONS = 600000;

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

export const userId = (name) =>
  name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

async function keyFrom(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function sealToken(name, password, token) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(password, salt), new TextEncoder().encode(token));
  return { name: name.trim(), salt: b64(salt), iv: b64(iv), data: b64(data) };
}

/* Vrátí token, nebo vyhodí chybu při špatném hesle. */
export async function openToken(entry, password) {
  const key = await keyFrom(password, unb64(entry.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(entry.iv) }, key, unb64(entry.data));
  return new TextDecoder().decode(plain);
}

export const MIN_PASSWORD = 10;
