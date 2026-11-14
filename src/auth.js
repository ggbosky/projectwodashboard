/* Přihlášení jménem a heslem bez serveru.
   V users.json je pro každého člena zašifrované „tajemství“ (GitHub token + klíč k datům),
   zamčené jeho vlastním heslem (PBKDF2 + AES-GCM). Správné heslo ho odemkne, špatné ne.
   Samotná data CRM jsou zašifrovaná společným datovým klíčem, takže mohou ležet i ve veřejném repozitáři. */
const ITERATIONS = 600000;

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
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

/* Společný klíč, kterým se šifrují data CRM. */
export const newDataKey = () => b64(crypto.getRandomValues(new Uint8Array(32)));

const dataKey = (key) => crypto.subtle.importKey('raw', unb64(key), 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function encryptData(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await dataKey(key), new TextEncoder().encode(text));
  return JSON.stringify({ v: 1, iv: b64(iv), data: b64(data) });
}

export async function decryptData(key, text) {
  const { iv, data } = JSON.parse(text);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await dataKey(key), unb64(data));
  return new TextDecoder().decode(plain);
}

/* Kód týmu: pozvánka, kterou si nový kolega při registraci odemkne přístup. */
export function newInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chars = [...crypto.getRandomValues(new Uint8Array(16))].map((n) => alphabet[n % 32]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join('')).join('-');
}
export const normCode = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');
