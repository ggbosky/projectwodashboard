# Project Two — CRM

Interní týmové CRM studia Project Two: dashboard s finančními metrikami, LinkedIn sales pipeline (Kanban / seznam) a ochrana proti duplicitnímu oslovení klientů.

Vše běží jen na GitHubu a jen v tomto jednom repozitáři — žádná další služba. Web hostuje GitHub Pages, data jsou zašifrovaná v souboru `crm.json` na větvi `crm-data` a tým se přihlašuje jménem a heslem.

React 18 · Vite · Tailwind CSS · Framer Motion · GitHub Pages + GitHub API

## Dva režimy

- **Demo** — lokální vývoj bez nastavení. Ukázková data, uložená jen v prohlížeči, bez přihlášení.
- **Týmový** — nasazená verze. Přihlášení jménem a heslem, sdílená data, synchronizace každých 20 s.

## Zprovoznění pro tým (dělá jen vlastník, jednou)

1. **GitHub Pages** — v *Settings → Pages* zvolte *Source: GitHub Actions*. Web běží na `https://ggbosky.github.io/projectwodashboard/`.
2. **Token** — na [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) vytvořte *fine-grained token*:
   - *Repository access* → *Only select repositories* → `projectwodashboard`
   - *Permissions* → *Repository permissions* → *Contents* → *Read and write*
   - platnost co nejdelší — po vypršení je potřeba nastavení zopakovat
3. **První nastavení** — otevřete web, vložte token a založte účty (jméno + heslo) pro celý tým. Za 1–2 minuty se web sám znovu nasadí a kolegové se přihlásí jménem a heslem.

Účty se dál spravují přímo v aplikaci (ikona vedle odhlášení): přidání člena, změna hesla, odebrání.

## Jak přihlášení a šifrování funguje

Bez serveru není kde heslo ověřit, proto heslo slouží jako šifrovací klíč:

- `public/users.json` obsahuje pro každého člena token a datový klíč, zamčené jeho heslem (PBKDF2, 600 000 iterací + AES-GCM). Správné heslo je odemkne, špatné ne.
- `crm.json` na větvi `crm-data` je celý zašifrovaný datovým klíčem (AES-256-GCM). Repozitář je veřejný, ale bez hesla některého člena jsou data nečitelná.

Důležité: oba soubory jsou veřejné. Kdo si `users.json` stáhne, může hesla zkoušet hádat u sebe bez omezení počtu pokusů — **používejte dlouhá, neuhodnutelná hesla** (ideálně z generátoru). Aplikace vyžaduje alespoň 10 znaků. Odebrání účtu nezneplatní klíče, které už dotyčný mohl získat — při odchodu člena vytvořte nový token a projděte nastavení znovu (založí se nový datový klíč; stará data je předtím potřeba vyexportovat).

## Jak ukládání funguje

- Každé uložení je commit na větvi `crm-data`, takže historie změn je v Gitu.
- Když dva lidé uloží současně, aplikace načte verzi kolegy a vlastní změny přehraje nad ní — nic se nepřepíše.
- Člen týmu se do přehledu zapíše sám při prvním přihlášení.

## Lokální vývoj

```bash
npm install
npm run dev
```

Pro týmový režim lokálně zkopírujte `.env.example` jako `.env.local`.

## Kde co je

- `src/data.js` — fáze, balíčky, kurzy a demo data
- `src/store.js` — přihlášení, načítání, ukládání a synchronizace přes GitHub API
- `src/auth.js` — šifrování tokenu a dat
- `src/components/ui.jsx` — logo (`LogoMark`); originál je v `public/logo-mark.png`
