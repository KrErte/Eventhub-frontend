# EventHub Web

EventHub on sündmuste haldamise rakendus: sündmuste nimekiri, hiljem ka sündmuste loomine ja kohtade broneerimine.
See repo sisaldab **frontendi** (Angular). REST API on eraldi repos:
[eventhub-api](https://github.com/KrErte/eventhub-api).

**Praegune seis:** sündmuste nimekirja leht (`/events`) koos laadimise, vea ja tühja olekuga.
Sündmuse loomine, detailvaade, broneerimine ja sisselogimine on veel tegemata.

## Sisukord

- [Kuidas osad kokku käivad](#kuidas-osad-kokku-käivad)
- [Tehnoloogiad](#tehnoloogiad)
- [Käivitamine](#käivitamine)
- [Struktuur](#struktuur)
- [Marsruudid](#marsruudid)
- [Andmevoog](#andmevoog)
- [Kasutajaliidese olekud](#kasutajaliidese-olekud)
- [Ligipääsetavus](#ligipääsetavus)
- [Stiilid ja teemad](#stiilid-ja-teemad)
- [Testid ja vormindamine](#testid-ja-vormindamine)
- [Konventsioonid](#konventsioonid)

## Kuidas osad kokku käivad

```
 Brauser
   │  http://localhost:4200
   ▼
 Angular dev server (see repo, `npm start`)
   │  /api/**  → proxy (proxy.conf.json)
   ▼
 Spring Boot (eventhub-api, `./gradlew bootRun`)   http://localhost:8080
   ▼
 PostgreSQL 18 (Docker)
```

Rakendus kutsub API-t alati **suhtelise URL-iga** (`/api/events`), mitte `http://localhost:8080/...`.
Arenduses suunab Angulari dev server `/api` päringud `proxy.conf.json` järgi backendi pordile 8080.
Brauseri jaoks on kõik sama päritoluga (same origin), seega CORS-i pole vaja.

## Tehnoloogiad

|                 |                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Raamistik       | Angular 22: standalone komponendid, **zoneless**, OnPush vaikimisi                                |
| Olek            | Signals (`signal`, `computed`, `linkedSignal`). RxJS ainult ajapõhiste asjade jaoks (nt debounce) |
| HTTP            | `httpResource()` lugemiseks, `HttpClient` teenustes muutmiseks                                    |
| Vormid          | Signal Forms (`@angular/forms/signals`)                                                           |
| Testid          | Vitest (`ng test`, jsdom)                                                                         |
| Vormindamine    | Prettier                                                                                          |
| Lokaliseerimine | eesti keel (`LOCALE_ID = 'et'`, `<html lang="et">`)                                               |

## Käivitamine

**Eeldused:** Node.js 24 ja npm. Andmete nägemiseks peab backend töötama
(vt [eventhub-api](https://github.com/KrErte/eventhub-api): `./gradlew bootRun`).

```bash
npm install
npm start
```

Ava `http://localhost:4200`, mis suunab edasi aadressile `/events`.

Kui backend ei tööta, näitab leht teadet „Sündmuste laadimine ebaõnnestus.“ koos nupuga
**„Proovi uuesti“**. Käivita backend ja vajuta nuppu, lehte pole vaja värskendada.

## Struktuur

Kood on jagatud **feature'ite** järgi, nagu backendiski:

```
src/
├── index.html                 lang="et", pealkiri
├── styles.scss                globaalsed värvimuutujad (hele/tume), fookuse stiil
└── app/
    ├── app.config.ts          router, HttpClient (fetch), eesti locale
    ├── app.routes.ts          juurmarsruudid (lazy loading)
    ├── app.ts / .html / .scss rakenduse raam: skip link, päis, <main>, <router-outlet>
    └── events/                sündmuste feature
        ├── event.model.ts     EventSummary tüüp (= backendi EventResponse)
        ├── events.routes.ts   feature'i marsruudid
        └── event-list/        sündmuste nimekirja komponent + test
```

Uus feature (nt `bookings/`) saab oma kausta, oma `*.routes.ts` faili ja lisatakse `app.routes.ts`'i
`loadChildren`'iga.

## Marsruudid

| URL       | mis                              | laadimine                                                                 |
| --------- | -------------------------------- | ------------------------------------------------------------------------- |
| `/`       | suunab `/events`                 |                                                                           |
| `/events` | sündmuste nimekiri (`EventList`) | lazy: `events.routes.ts` + komponent laaditakse alles esimesel külastusel |
| muu       | suunab `/events`                 |                                                                           |

Lehe pealkiri (`<title>`) tuleb marsruudi `title` väljast, nt „Sündmused · EventHub“.

## Andmevoog

```
EventList komponent
  └── httpResource<EventSummary[]>(() => '/api/events')
         │  GET /api/events  (proxy → backend)
         ▼
      signalid: isLoading() · error() · value() · reload()
         │
         ▼
      mall (@if / @for) renderdab vastava oleku
```

- **Lugemine** käib `httpResource()`'ga: see teeb päringu automaatselt, hoiab tulemust signalis ja
  annab laadimise ning vea oleku. Käsitsi `subscribe`'i ega olekumuutujaid pole vaja.
- **Muutmine** (loomine, broneerimine) tuleb teenusesse, mis kasutab `HttpClient`'it.
- **Tüübid:** `EventSummary` (`events/event.model.ts`) peegeldab backendi `EventResponse`'i.
  Backendi välja muutmisel tuleb see tüüp samuti uuendada.
- Aeg tuleb API-st UTC ISO stringina (`2027-01-30T09:00:00Z`) ja kuvatakse `DatePipe`'iga kasutaja
  ajavööndis eesti formaadis: „30. jaanuar 2027, 11:00“.
- API vead tulevad `application/problem+json` kujul. Valideerimisvigadel on `errors` väli
  (`väli → teade`), mida vormid saavad kasutada.

## Kasutajaliidese olekud

Sündmuste nimekirjal on neli olekut:

| olek      | mida näidatakse                                                        | ARIA                                                |
| --------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| laadimine | „Laadin sündmusi…“                                                     | `role="status"` (ekraanilugeja loeb viisakalt ette) |
| viga      | „Sündmuste laadimine ebaõnnestus.“ + nupp „Proovi uuesti“ (`reload()`) | `role="alert"` (loetakse kohe ette)                 |
| tühi      | „Sündmusi pole.“                                                       |                                                     |
| andmed    | kaardid: pealkiri, aeg, koht, kirjeldus, kohtade arv                   | `<ul>`/`<li>`, `<h2>`, `<time datetime>`            |

## Ligipääsetavus

Eesmärk on **WCAG 2.1 AA** ja AXE kontrollide läbimine.

- **Semantiline HTML:** `<header>`, `<main>`, üks `<h1>` lehe kohta, sündmused `<h2>`-dega nimekirjas,
  kuupäevad `<time datetime="…">` elemendis.
- **Skip link:** „Liigu sisu juurde“ on esimene Tab-iga fookustatav element ja viib `<main>`'i.
- **Fookus:** kõigil interaktiivsetel elementidel on selgelt nähtav `:focus-visible` raam (3px).
- **Kontrast:** kõik tekstivärvid on vähemalt 4.5:1 nii heledas kui tumedas teemas.
- **Dünaamilised teated:** laadimine ja vead on ARIA live-regioonides (`status` / `alert`).
- **Keel:** `<html lang="et">`, et ekraanilugeja hääldaks teksti eesti keeles.

Automaatne AXE kontroll pole veel testidesse lisatud. Seni saab lehte kontrollida brauseri
AXE DevTools laiendusega.

## Stiilid ja teemad

Värvid on CSS muutujad failis `src/styles.scss` (`--bg`, `--surface`, `--text`, `--text-muted`,
`--border`, `--accent`, `--on-accent`, `--error`, `--focus`). Tume teema rakendub automaatselt
operatsioonisüsteemi seadistuse järgi (`prefers-color-scheme: dark`). Komponentide stiilid kasutavad
ainult neid muutujaid, mitte otse värvikoode.

## Testid ja vormindamine

```bash
npm test -- --watch=false                                             # kõik testid
npm test -- --watch=false --include src/app/events/event-list/event-list.spec.ts   # üks fail
npx prettier --check .                                                # kontrolli vormindust
npx prettier --write <fail>                                           # vorminda fail
```

Komponendi testid kasutavad `provideHttpClientTesting()`'ut ja `HttpTestingController`'it: päris
backendi pole vaja, iga test annab ise vastuse (andmed, tühi nimekiri, 500 viga) ja kontrollib
renderdatud HTML-i.

| test                                   | mida kontrollib                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `app.spec.ts`                          | päis, skip link ja `<main id="main">` on olemas                                            |
| `events/event-list/event-list.spec.ts` | laadimise teade, nimekiri ja andmed, tühi olek, vea olek, „Proovi uuesti“ teeb uue päringu |

## Konventsioonid

Täielikud reeglid on failis [`AGENTS.md`](AGENTS.md). Lühidalt:

- standalone komponendid, NgModule'eid pole. `standalone: true` ja `changeDetection` jäetakse seadmata
  (vaikimisi juba nii),
- `input()` / `output()` / `model()` ja `inject()`, mitte dekoraatorid ega konstruktori DI,
- `@if` / `@for` / `@defer`, mitte `*ngIf` / `*ngFor`,
- host-bindingud `host: {}` objektis, mitte `@HostBinding` / `@HostListener`,
- staatilised pildid `NgOptimizedImage`'iga,
- feature-marsruudid lazy loadinguga,
- commitid [Conventional Commits](https://www.conventionalcommits.org/) formaadis.
