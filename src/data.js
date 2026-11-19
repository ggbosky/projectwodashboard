// Mock data pro Project Two CRM. Vše je fiktivní a slouží jen jako demo obsah.

export const TEAM = [
  { id: 'marek', name: 'Marek', role: 'Founder · Sales & strategie', color: '#FF5A0F' },
  { id: 'karel', name: 'Karel', role: 'Design & development', color: '#38BDF8' },
  { id: 'claude', name: 'Claude', role: 'AI outreach agent', color: '#A78BFA', ai: true },
];

export const STAGES = [
  { id: 'messaged', name: 'Napsané zprávy', short: 'Napsáno', hint: 'Odeslaný outreach na LinkedInu', color: '#38BDF8' },
  { id: 'proposal', name: 'Chtějí návrh', short: 'Návrh', hint: 'Chystáme strukturu a cenu', color: '#FBBF24' },
  { id: 'sent', name: 'Návrh poslán', short: 'Posláno', hint: 'Návrh a cena odeslány, čekáme na reakci', color: '#FB923C' },
  { id: 'meeting', name: 'Jdou na schůzku', short: 'Schůzka', hint: 'Domluvený call / konzultace', color: '#A78BFA' },
  { id: 'won', name: 'Uzavření klienti', short: 'Uzavřeno', hint: 'Podepsáno / zaplaceno — realizace', color: '#34D399' },
];

export const PACKAGES = [
  { id: 'start', name: 'Start', from: 10000, color: '#A1A1AA' },
  { id: 'business', name: 'Business', from: 20000, color: '#38BDF8' },
  { id: 'premium', name: 'Premium', from: 50000, color: '#FF5A0F' },
  { id: 'webapp', name: 'Web app', from: 90000, color: '#A78BFA' },
  { id: 'custom', name: 'Custom', from: 0, color: '#34D399' },
];

// Orientační fixní kurzy pro přepočet (CZK za 1 jednotku měny).
export const RATES = { CZK: 1, EUR: 24.5, USD: 21.4 };

const us = (text, date) => ({ from: 'us', text, date });
const them = (text, date) => ({ from: 'them', text, date });

let n = 0;
const c = (name, title, company, industry, region, country, owner, stage, pkg, value, currency, updated, messages = [], notes = '') => ({
  id: `c${++n}`,
  name, title, company, industry, region, country, owner, stage, pkg, value, currency, updated, messages, notes,
  linkedin: `linkedin.com/in/${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`,
});

export const SEED_CLIENTS = [
  // ——— Uzavření
  c('Petr Novotný', 'Majitel', 'Truhlářství Novotný', 'Řemeslo', 'CZ', 'CZ', 'marek', 'won', 'business', 28000, 'CZK', '2026-10-21', [
    us('Dobrý den, Petře, viděl jsem vaše realizace kuchyní — škoda, že je web neukazuje ve stejné kvalitě. Můžu poslat krátký návrh?', '2026-09-18'),
    them('Dobrý den, web je slabina, to vím. Pošlete.', '2026-09-19'),
    us('Posílám strukturu + cenu balíčku Business. Galerie realizací a poptávkový formulář v ceně.', '2026-09-23'),
    them('Bereme. Zálohu pošlu zítra.', '2026-10-02'),
  ], 'Zaplacena záloha 50 %. Fotky realizací dodá do konce měsíce. Chce důraz na poptávky z Brna a okolí.'),
  c('Lucie Hájková', 'Spolumajitelka', 'Kavárna Zrno', 'Gastro', 'CZ', 'CZ', 'karel', 'won', 'start', 14000, 'CZK', '2026-10-28', [
    us('Ahoj Lucie, Zrno mám rád — a myslím, že by si zasloužilo web, kde se dá najít menu i otevíračka na první dobrou.', '2026-10-05'),
    them('Ahoj! To by se hodilo, teď máme jen Instagram.', '2026-10-05'),
  ], 'One-page + menu v PDF nahradit HTML verzí. Spuštěno, čeká se na doménu.'),
  c('Jana Dvořáková', 'Fyzioterapeutka', 'Fyzio Vltava', 'Zdraví', 'CZ', 'CZ', 'marek', 'won', 'business', 24000, 'CZK', '2026-11-03', [
    us('Dobrý den, paní Dvořáková, pomáháme fyzio praxím s webem, přes který se dá rovnou objednat. Mohu ukázat ukázku?', '2026-09-30'),
    them('Dobrý den, rezervace přes web by mi ušetřily hodně telefonátů.', '2026-10-01'),
  ], 'Napojení na Reservio. Texty si píše sama, korektura od nás.'),
  c('Ingrid Solberg', 'Creative Director', 'Nordlys Studio', 'Design', 'INTL', 'NO', 'karel', 'won', 'premium', 3200, 'EUR', '2026-10-15', [
    us('Hi Ingrid — your interiors are stunning, but the portfolio site takes 9 s to load on mobile. We could fix that and give it a proper editorial feel.', '2026-08-28'),
    them('That is painfully accurate. Send me what you have in mind.', '2026-08-30'),
    us('Proposal attached: case-study driven portfolio, EN/NO, 4 weeks.', '2026-09-04'),
    them('Approved. Invoice to the studio address please.', '2026-09-12'),
  ], 'Dvojjazyčný web EN/NO. Fakturace v EUR, splatnost 14 dní. Zaplaceno celé.'),
  c('Tobias Bergmann', 'Managing Partner', 'Bergmann Consulting', 'Poradenství', 'INTL', 'DE', 'claude', 'won', 'business', 1400, 'EUR', '2026-10-09', [
    us('Hallo Tobias, we build lean websites for independent consultants — clear offer, booking link, done in two weeks. Worth a quick look?', '2026-09-10'),
    them('Timing is good, I am rebranding. What does it cost?', '2026-09-11'),
  ], 'Lead našel a oslovil Claude, call a uzavření převzal Marek. Web v němčině, texty dodá klient.'),
  c('Tereza Marková', 'Zakladatelka', 'Keramika Polná', 'E-shop', 'CZ', 'CZ', 'claude', 'won', 'premium', 62000, 'CZK', '2026-11-06', [
    us('Dobrý den, Terezo, vaše keramika je nádherná. E-shop ale na mobilu padá v košíku — rádi bychom vám ukázali, jak by mohl vypadat nový.', '2026-09-22'),
    them('Dobrý den, o tom košíku vím, zákazníci mi to píšou. Co navrhujete?', '2026-09-22'),
    us('Posílám návrh: nový e-shop na míru, platby kartou, napojení na Zásilkovnu.', '2026-09-29'),
  ], 'E-shop cca 120 produktů. Migrace ze starého řešení. Druhá splátka po spuštění.'),
  c('Ondřej Šimek', 'Advokát', 'Advokátní kancelář Šimek', 'Právo', 'CZ', 'CZ', 'marek', 'won', 'premium', 55000, 'CZK', '2026-10-30', [
    us('Dobrý den, pane doktore, připravujeme weby pro advokátní kanceláře — důvěryhodné, rychlé a s jasnou specializací. Smím poslat ukázku?', '2026-09-05'),
    them('Dobrý den, pošlete. Náš web je z roku 2015.', '2026-09-08'),
  ], 'Tři jazykové mutace (CZ/EN/DE). Fotografování týmu zajišťujeme přes partnera.'),
  c('Sarah Whitfield', 'COO', 'Loop Analytics', 'SaaS', 'INTL', 'UK', 'marek', 'won', 'webapp', 6800, 'EUR', '2026-11-10', [
    us('Hi Sarah, saw your post about the client portal backlog. We ship small web apps for teams like yours — happy to scope it on a call.', '2026-09-15'),
    them('Yes please. Next Tuesday?', '2026-09-16'),
    us('Scope + fixed price attached after our call. Portal MVP, 6 weeks.', '2026-09-25'),
    them('Signed. Kick-off Monday.', '2026-10-01'),
  ], 'Klientský portál (MVP). Platba ve třech milnících, první dvě zaplaceny.'),

  // ——— Schůzka
  c('Martin Kovář', 'Realitní makléř', 'Reality Kovář', 'Reality', 'CZ', 'CZ', 'marek', 'meeting', 'business', 26000, 'CZK', '2026-11-12', [
    us('Dobrý den, Martine, osobní web makléře dnes prodává víc než inzerát. Mám pro vás konkrétní nápad.', '2026-11-02'),
    them('Dobrý den, sem s ním. Můžeme si zavolat?', '2026-11-04'),
  ], 'Call 18. 11. v 10:00. Chce napojení na Sreality export a osobní brand.'),
  c('Camille Laurent', 'Founder', 'Atelier Lumière', 'Fotografie', 'INTL', 'FR', 'karel', 'meeting', 'premium', 2900, 'EUR', '2026-11-11', [
    us('Bonjour Camille — love the light in your wedding work. Your site hides it behind tiny thumbnails; we would love to show you a bolder direction.', '2026-10-27'),
    them('Merci! I am open to it, can we talk next week?', '2026-10-29'),
  ], 'Videocall 19. 11. v 15:00. Rozpočet do 3 000 EUR, chce galerii s full-screen prohlížením.'),
  c('David Bartoš', 'Jednatel', 'Elektro Bartoš', 'Řemeslo', 'CZ', 'CZ', 'claude', 'meeting', 'start', 12000, 'CZK', '2026-11-08', [
    us('Dobrý den, pane Bartoši, elektrikáři s jednoduchým webem a ceníkem dostávají poptávky i bez inzerce. Můžeme vám ho připravit do 10 dnů.', '2026-10-30'),
    them('Dobrý den, zavolejte mi prosím v pátek dopoledne.', '2026-11-03'),
  ], 'Telefonát v pátek 20. 11. Claude připravil podklady, call vede Marek.'),
  c('Erik Lindqvist', 'Head Roaster', 'Fjord Coffee Roasters', 'E-shop', 'INTL', 'SE', 'claude', 'meeting', 'premium', 2600, 'EUR', '2026-11-13', [
    us('Hi Erik, your subscription page loses people at the plan picker. We redesign small e-commerce flows — want a 15-min teardown?', '2026-11-01'),
    them('Sure, a teardown sounds useful.', '2026-11-05'),
  ], 'Teardown call 21. 11. Zajímá ho hlavně předplatné kávy.'),

  // ——— Návrh
  c('Hana Sýkorová', 'Majitelka', 'Pekařství U Sýkorů', 'Gastro', 'CZ', 'CZ', 'karel', 'proposal', 'start', 11000, 'CZK', '2026-11-09', [
    us('Dobrý den, paní Sýkorová, připravili bychom vám jednoduchý web s nabídkou a objednávkou dortů.', '2026-11-01'),
    them('Dobrý den, pošlete mi prosím, kolik by to stálo.', '2026-11-06'),
  ], 'Poslat návrh struktury do pátku. Objednávkový formulář na dorty.'),
  c('Klára Benešová', 'Lektorka jógy', 'Jóga s Klárou', 'Osobní značka', 'CZ', 'CZ', 'marek', 'proposal', 'start', 10000, 'CZK', '2026-11-07', [
    us('Ahoj Kláro, tvoje lekce mají skvělé recenze — web s rozvrhem a přihlášením by ti ušetřil spoustu zpráv.', '2026-10-31'),
    them('Ahoj, přesně to řeším. Co by to obnášelo?', '2026-11-02'),
  ], 'Balíček Start, rozvrh + přihlašování přes formulář.'),
  c('Lena Hofmann', 'Partnerin', 'Hofmann Architekten', 'Architektura', 'INTL', 'AT', 'marek', 'proposal', 'premium', 4200, 'EUR', '2026-11-12', [
    us('Hallo Lena, your Vienna projects deserve a calmer, larger presentation. We specialise in portfolio sites for studios.', '2026-10-24'),
    them('Interesting. Please send a proposal with timeline and budget.', '2026-11-04'),
  ], 'Chce návrh do 20. 11. Portfolio 25 projektů, DE/EN.'),
  c('Tomáš Vrba', 'Majitel', 'BikeServis Brno', 'Služby', 'CZ', 'CZ', 'claude', 'proposal', 'business', 22000, 'CZK', '2026-11-10', [
    us('Dobrý den, Tomáši, servisy s online objednáním termínu mají v sezóně plno o měsíc dřív. Ukážeme vám, jak na to.', '2026-11-03'),
    them('Dobrý den, zajímá mě to. Jaká je cena?', '2026-11-05'),
  ], 'Rezervace servisu online. Cenu a strukturu chystá Karel.'),
  c("James O'Connor", 'Solicitor', 'Meridian Legal', 'Právo', 'INTL', 'IE', 'karel', 'sent', 'business', 1800, 'EUR', '2026-11-05', [
    us('Hi James, we build clear, fast websites for small law practices. Could I send two examples?', '2026-10-26'),
    them('Go ahead — and include a rough price.', '2026-10-30'),
  ], 'Poslány 2 reference. Čeká na cenovou nabídku.'),

  // ——— Napsáno
  c('Jiří Fiala', 'Majitel', 'Zahradnictví Fiala', 'Služby', 'CZ', 'CZ', 'claude', 'messaged', 'business', 20000, 'CZK', '2026-11-11', [
    us('Dobrý den, pane Fialo, zahradnictví s přehledným webem a ceníkem realizací získávají zakázky i mimo sezónu. Můžu poslat ukázku?', '2026-11-11'),
  ]),
  c('Eva Pokorná', 'Účetní', 'Účetnictví Pokorná', 'Finance', 'CZ', 'CZ', 'marek', 'messaged', 'start', 10000, 'CZK', '2026-11-10', [
    us('Dobrý den, paní Pokorná, pomáháme účetním s jednoduchým webem, který přivádí nové klienty z okolí. Mělo by to pro vás smysl?', '2026-11-10'),
  ]),
  c('Marco Ricci', 'Founder', 'Studio Volt', 'Agentura', 'INTL', 'IT', 'claude', 'messaged', 'business', 1500, 'EUR', '2026-11-12', [
    us('Ciao Marco, noticed Studio Volt has no case studies online. We can turn three projects into a site that sells — interested?', '2026-11-12'),
  ]),
  c('Adam Kříž', 'Svatební fotograf', 'Adam Kříž Photography', 'Fotografie', 'CZ', 'CZ', 'karel', 'messaged', 'business', 21000, 'CZK', '2026-11-08', [
    us('Ahoj Adame, tvoje fotky jsou špička. Web s portfoliem a poptávkovým formulářem by ti zvedl rezervace na příští sezónu.', '2026-11-08'),
  ]),
  c('Emily Carter', 'Practice Owner', 'Brightside Dental', 'Zdraví', 'INTL', 'US', 'claude', 'messaged', 'premium', 3000, 'EUR', '2026-11-13', [
    us('Hi Dr. Carter, practices with online booking on their own site see fewer no-shows. Could I share a short example?', '2026-11-13'),
  ]),

  // ——— Napsáno (bez vlastníka = volné leady)
  c('Roman Malý', 'Majitel', 'Autoservis Malý', 'Služby', 'CZ', 'CZ', null, 'messaged', 'start', 10000, 'CZK', '2026-11-13'),
  c('Pavel Sedlák', 'Vinař', 'Vinařství Sedlák', 'E-shop', 'CZ', 'CZ', null, 'messaged', 'premium', 50000, 'CZK', '2026-11-13', [], 'Prodává jen přes e-mail. Potenciál na e-shop s degustačními balíčky.'),
  c('Nikola Jandová', 'Zakladatelka', 'Kosmetika Bloom', 'E-shop', 'CZ', 'CZ', 'karel', 'messaged', 'business', 20000, 'CZK', '2026-11-12', [], 'Rezervováno pro Karla — zná ji osobně, osloví sám.'),
  c('Hannah Reed', 'Interior Designer', 'Oakwell Interiors', 'Design', 'INTL', 'UK', null, 'messaged', 'premium', 2500, 'EUR', '2026-11-12'),
  c('Michal Hrubý', 'Jednatel', 'Stavby Hrubý', 'Stavebnictví', 'CZ', 'CZ', null, 'messaged', 'business', 20000, 'CZK', '2026-11-11'),
  c('Anna Kessler', 'Physiotherapeutin', 'Kessler Physio', 'Zdraví', 'INTL', 'CH', 'marek', 'messaged', 'business', 1600, 'EUR', '2026-11-10', [], 'Rezervováno pro Marka — doporučení od Fyzio Vltava.'),
  c('Veronika Urbanová', 'Koučka', 'Veronika Urbanová Coaching', 'Osobní značka', 'CZ', 'CZ', null, 'messaged', 'start', 10000, 'CZK', '2026-11-09'),
];
