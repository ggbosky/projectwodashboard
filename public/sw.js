// Minimální service worker: umožní nainstalovat CRM jako aplikaci.
// Nic neukládá do mezipaměti — data i nové verze se vždy berou z internetu.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
