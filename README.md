# Project Two — CRM

Interní týmové CRM studia Project Two: dashboard s finančními metrikami, LinkedIn sales pipeline (Kanban / seznam) a ochrana proti duplicitnímu oslovení klientů.

Vše běží jen na GitHubu — žádná další služba. Web hostuje GitHub Pages, data jsou v souboru `crm.json` v soukromém repozitáři a přihlašuje se GitHub tokenem.

React 18 · Vite · Tailwind CSS · Framer Motion · GitHub Pages + GitHub API

## Dva režimy

- **Demo** — bez nastavení. Ukázková data, uložená jen v prohlížeči, bez přihlášení.
- **Týmový** — nasazená verze. Přihlášení, sdílená data, synchronizace každých 20 s.

## Zprovoznění pro tým

1. **Datový repozitář** — na GitHubu založte **soukromý** repozitář `projectwo-crm-data` (může zůstat prázdný). Tento repozitář s kódem je veřejný, proto data klientů musí být jinde. Aplikace veřejný datový repozitář odmítne.
2. **Kolegové** — v datovém repozitáři v *Settings → Collaborators* pozvěte oba kolegy. Kdo nemá přístup, dovnitř se nedostane.
3. **GitHub Pages** — v tomto repozitáři v *Settings → Pages* zvolte *Source: GitHub Actions*. Po sloučení do větve `main` se web sám nasadí na `https://ggbosky.github.io/projectwodashboard/`.
4. **Tokeny** — každý člen si na [github.com/settings/tokens](https://github.com/settings/tokens) vytvoří vlastní token a přihlásí se jím:
   - vlastník datového repozitáře: *Fine-grained token* → jen repozitář `projectwo-crm-data` → *Contents: Read and write*;
   - pozvaní kolegové: *Token (classic)* s oprávněním `repo` (fine-grained tokeny k cizím osobním repozitářům nefungují).

Jiný název datového repozitáře nastavíte proměnnou `CRM_DATA_REPO` (*Settings → Secrets and variables → Actions → Variables*, tvar `vlastnik/nazev`).

## Jak ukládání funguje

- Každé uložení je commit do `crm.json`, takže historie změn i záloha jsou v Gitu zadarmo.
- Když dva lidé uloží současně, aplikace načte verzi kolegy a vlastní změny přehraje nad ní — nic se nepřepíše.
- Člen týmu se do aplikace zapíše sám při prvním přihlášení; jméno a barvu lze upravit ručně v `crm.json`.

## Lokální vývoj

```bash
npm install
npm run dev
```

Pro týmový režim lokálně zkopírujte `.env.example` jako `.env.local`.

## Kde co je

- `src/data.js` — fáze, balíčky, kurzy a demo data
- `src/store.js` — přihlášení, načítání, ukládání a synchronizace přes GitHub API
- `src/components/ui.jsx` — logo (`LogoMark`); originál je v `public/logo-mark.png`
