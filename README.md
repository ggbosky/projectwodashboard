# Project Two — CRM

Interní týmové CRM studia Project Two: dashboard s finančními metrikami, LinkedIn sales pipeline (Kanban / seznam) a ochrana proti duplicitnímu oslovení klientů. Tým sdílí jednu databázi, přihlašuje se e-mailem a heslem a změny se synchronizují živě.

React 18 · Vite · Tailwind CSS · Framer Motion · Supabase · GitHub Pages

## Dva režimy

- **Demo** — bez nastavení. Ukázková data, uložená jen v prohlížeči, bez přihlášení.
- **Týmový** — jakmile jsou nastavené proměnné `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`. Přihlášení, sdílená databáze, živá synchronizace.

## Zprovoznění pro tým

1. **Supabase** — na [supabase.com](https://supabase.com) založte projekt (stačí Free).
2. **Databáze** — otevřete `supabase/schema.sql`, nahoře přepište tři e-maily na své a celý soubor spusťte v *SQL Editoru*. Dovnitř se dostanou jen tyto e-maily.
3. **Adresa webu** — v *Authentication → URL Configuration* nastavte *Site URL* na adresu aplikace (např. `https://ggbosky.github.io/projectwodashboard/`). Potvrzování e-mailu nechte zapnuté.
4. **Klíče** — z *Project Settings → API* zkopírujte *Project URL* a *anon public key*. V GitHubu je uložte v *Settings → Secrets and variables → Actions → Variables* jako `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`. (Anon klíč je veřejný záměrně — data chrání pravidla v databázi. Klíč `service_role` nikam nedávejte.)
5. **GitHub Pages** — v *Settings → Pages* zvolte *Source: GitHub Actions*. Po sloučení do větve `main` se web sám nasadí.
6. **Účty** — každý člen si na webu vytvoří účet přes „Nový účet“ a potvrdí e-mail.

## Lokální vývoj

```bash
npm install
npm run dev
```

Pro týmový režim lokálně zkopírujte `.env.example` jako `.env.local` a doplňte klíče.

## Kde co je

- `src/data.js` — fáze, balíčky, kurzy a demo data
- `src/store.js` — načítání, ukládání a synchronizace dat
- `supabase/schema.sql` — tabulky, přístupová pravidla, seznam povolených e-mailů
- `src/components/ui.jsx` — logo (`LogoMark`); originál je v `public/logo-mark.png`
