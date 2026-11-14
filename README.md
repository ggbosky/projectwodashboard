# Project Two — CRM

Interní týmové CRM studia Project Two: dashboard s finančními metrikami, LinkedIn sales pipeline (Kanban / seznam) a ochrana proti duplicitnímu oslovení klientů.

Vše běží jen na GitHubu — žádná další služba. Web hostuje GitHub Pages, data jsou v souboru `crm.json` v soukromém repozitáři a tým se přihlašuje jménem a heslem.

React 18 · Vite · Tailwind CSS · Framer Motion · GitHub Pages + GitHub API

## Dva režimy

- **Demo** — bez nastavení. Ukázková data, uložená jen v prohlížeči, bez přihlášení.
- **Týmový** — nasazená verze. Přihlášení jménem a heslem, sdílená data, synchronizace každých 20 s.

## Zprovoznění pro tým (dělá jen vlastník, jednou)

1. **Datový repozitář** — na GitHubu založte **soukromý** repozitář `projectwo-crm-data` (může zůstat prázdný). Tento repozitář s kódem je veřejný, proto data klientů musí být jinde.
2. **GitHub Pages** — v tomto repozitáři v *Settings → Pages* zvolte *Source: GitHub Actions* a slučte kód do větve `main`. Web se nasadí na `https://ggbosky.github.io/projectwodashboard/`.
3. **Přístupový klíč** — na [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) vytvořte *fine-grained token*: *Only select repositories* → `projectwo-crm-data` a `projectwodashboard`, oprávnění *Contents: Read and write*. Platnost nastavte co nejdelší — po vypršení je potřeba nastavení zopakovat.
4. **První nastavení** — otevřete web. Místo přihlášení se ukáže průvodce: vložte klíč a založte účty (jméno + heslo) pro celý tým. Za 1–2 minuty se web sám znovu nasadí a kolegové se přihlásí jménem a heslem.

Účty se dál spravují přímo v aplikaci (ikona vedle odhlášení): přidání člena, změna hesla, odebrání.

Jiný název datového repozitáře nastavíte proměnnou `CRM_DATA_REPO` (*Settings → Secrets and variables → Actions → Variables*, tvar `vlastnik/nazev`).

## Jak přihlášení funguje

Bez serveru není kde heslo ověřit, proto heslo slouží jako šifrovací klíč. Soubor `public/users.json` obsahuje pro každého člena přístupový klíč k datům zašifrovaný jeho heslem (PBKDF2, 600 000 iterací + AES-GCM). Správné heslo klíč odemkne, špatné ne.

Důležité: `users.json` je veřejný. Kdo ho stáhne, může hesla zkoušet hádat u sebe bez omezení počtu pokusů — **používejte dlouhá, neuhodnutelná hesla** (ideálně z generátoru hesel). Aplikace vyžaduje alespoň 10 znaků. Odebrání účtu nezneplatní klíč, který už dotyčný mohl získat — při odchodu člena vytvořte nový token a projděte nastavení znovu.

## Jak ukládání funguje

- Každé uložení je commit do `crm.json`, takže historie změn i záloha jsou v Gitu zadarmo.
- Když dva lidé uloží současně, aplikace načte verzi kolegy a vlastní změny přehraje nad ní — nic se nepřepíše.
- Člen týmu se do přehledu zapíše sám při prvním přihlášení; barvu a roli lze upravit ručně v `crm.json`.

## Lokální vývoj

```bash
npm install
npm run dev
```

Pro týmový režim lokálně zkopírujte `.env.example` jako `.env.local`.

## Kde co je

- `src/data.js` — fáze, balíčky, kurzy a demo data
- `src/store.js` — přihlášení, načítání, ukládání a synchronizace přes GitHub API
- `src/auth.js` — šifrování přístupového klíče heslem
- `src/components/ui.jsx` — logo (`LogoMark`); originál je v `public/logo-mark.png`
