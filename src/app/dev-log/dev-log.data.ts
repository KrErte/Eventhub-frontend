/** One development stage shown on the "Arenduse käik" page. */
export interface DevStage {
  title: string;
  /** What was built, in plain language. */
  summary: string;
  /** Notable details and decisions. */
  points: string[];
  commits: DevCommit[];
}

export interface DevCommit {
  repo: 'backend' | 'frontend';
  hash: string;
  message: string;
}

export const REPO_URLS: Record<DevCommit['repo'], string> = {
  backend: 'https://github.com/KrErte/eventhub-api',
  frontend: 'https://github.com/KrErte/Eventhub-frontend',
};

export const DEV_STAGES: DevStage[] = [
  {
    title: 'Git ja repod',
    summary: 'Backend ja frontend on eraldi repod, nagu GitHubis.',
    points: [
      'Spring Booti ja Angulari põhjad koos AGENTS.md reeglitega.',
      'Generaatorite üle kirjutatud .gitignore failidesse lisati tagasi .env, *.log ja *.tsbuildinfo.',
    ],
    commits: [
      {
        repo: 'backend',
        hash: '72a13e9',
        message: 'chore: add Spring Boot scaffold and agent conventions',
      },
      {
        repo: 'frontend',
        hash: '79cd8d8',
        message: 'chore: add Angular scaffold and agent conventions',
      },
    ],
  },
  {
    title: 'Vigade käsitlus',
    summary: 'Kõik backendi vead tulevad ühest kohast ühtses ProblemDetail vormingus.',
    points: [
      'GlobalExceptionHandler: 404, 400 koos errors väljaga (väli → teade), 500 ilma sisemiste detailideta.',
      'NotFoundException ja @NullMarked package-info.java failid (JSpecify).',
    ],
    commits: [
      {
        repo: 'backend',
        hash: '47b2e46',
        message: 'feat(common): add global ProblemDetail exception handler',
      },
    ],
  },
  {
    title: 'Sündmuste lugemine',
    summary: 'Esimene päris feature: sündmused andmebaasist kuni API-ni.',
    points: [
      'Flyway migratsioon V1, Event entity, EventResponse DTO, repository, service ja controller.',
      'GET /api/events (sorteeritud aja järgi) ja GET /api/events/{id}.',
      'Paketid feature’i järgi: kõik sündmustega seotu on event/ kaustas, entity ja repo on package-private.',
      'Ajutine security: /api/** on avatud, OAuth2 lisatakse hiljem.',
      'Testid päris Postgresiga (Testcontainers).',
    ],
    commits: [
      { repo: 'backend', hash: '173d6e3', message: 'feat(event): add read-only events API' },
    ],
  },
  {
    title: 'Sündmuste nimekiri',
    summary: 'Brauseris on näha backendist tulevad sündmused.',
    points: [
      '/events leht, mis loeb andmeid httpResource()-ga. Olekud: laadimine, viga, tühi, andmed.',
      'Rakenduse raam: päis, skip link, <main>, eesti keel, hele ja tume teema WCAG AA kontrastiga.',
      'Backendi dev-profiil 3 näidissündmusega (ainult ./gradlew bootRun).',
      'Nupp „Proovi uuesti“, et backendi maas olles poleks vaja lehte värskendada.',
    ],
    commits: [
      { repo: 'backend', hash: '8958880', message: 'feat(event): add dev seed data' },
      { repo: 'frontend', hash: '75d7446', message: 'feat(events): add event list page' },
      {
        repo: 'frontend',
        hash: '24448d0',
        message: 'feat(events): add retry button to event list error state',
      },
    ],
  },
  {
    title: 'README-d',
    summary: 'Mõlemas repos on kirjas rakenduse tehniline ja loogiline pool.',
    points: [
      'Arhitektuur, API koos näidisvastustega, andmebaas, käivitamine ja testid.',
      'README-sid uuendatakse iga järgmise sammuga.',
    ],
    commits: [
      { repo: 'backend', hash: 'f23bc75', message: 'docs: add backend README' },
      { repo: 'frontend', hash: '23d17f6', message: 'docs: rewrite README for EventHub web' },
    ],
  },
  {
    title: 'Sündmuse lisamine',
    summary: 'Uue sündmuse saab luua vormiga.',
    points: [
      'POST /api/events koos eestikeelse valideerimisega, vastus 201 Created ja Location päis.',
      '/events/new vorm Signal Formsiga: vead välja juures, aria-invalid, fookus esimesele vigasele väljale.',
      'Backendi valideerimisvead seotakse õige vormiväljaga.',
    ],
    commits: [
      { repo: 'backend', hash: '8b71537', message: 'feat(event): add create event endpoint' },
      { repo: 'frontend', hash: 'ef11281', message: 'feat(events): add create event form' },
    ],
  },
  {
    title: 'AXE ligipääsetavuse kontroll',
    summary: 'Iga vaade ja olek on automaatselt WCAG reeglite vastu kontrollitud.',
    points: [
      'axe-core 4.14.0 (fikseeritud) ja abifunktsioon expectNoAxeViolations().',
      'Kontrastsus on käsitsi arvutatud: kõik tekstipaarid vähemalt 6:1 mõlemas teemas.',
    ],
    commits: [
      {
        repo: 'frontend',
        hash: '7269d29',
        message: 'test(a11y): add axe-core checks to component tests',
      },
    ],
  },
  {
    title: 'Broneerimine',
    summary: 'Sündmusele saab kohti broneerida ja viimast kohta ei müüda kunagi kaks korda.',
    points: [
      'POST /api/events/{id}/bookings, 1–10 kohta korraga.',
      'Ülebroneerimise kaitse: üks atomaarne UPDATE ühes transaktsioonis koos broneeringuga. Kui midagi ebaõnnestub, vabanevad kohad uuesti.',
      'Sama e-postiga ühele sündmusele ainult üks broneering. Suur- ja väiketähti ei eristata.',
      '409 vastus, kui kohti pole, sündmus on alanud või e-post on juba broneerinud.',
      'Samaaegsuse test: 10 lõime proovivad viimast kohta ja täpselt 1 saab selle.',
      'Sündmuse leht /events/:id koos broneerimise vormiga. Nimekirjas on vabad kohad.',
    ],
    commits: [
      {
        repo: 'backend',
        hash: '6ef44cc',
        message: 'feat(booking): add seat booking with overbooking protection',
      },
      {
        repo: 'frontend',
        hash: '1e0111f',
        message: 'feat(bookings): add event detail page with booking form',
      },
    ],
  },
  {
    title: 'Buildi parandus',
    summary: 'AXE commit oli ng build’i katki teinud. Parandatud eraldi commitiga.',
    points: [
      'Testide abifail src/testing/axe.ts sattus rakenduse buildi. Nüüd on see buildist välja jäetud.',
      'Sellest ajast jooksutatakse enne igat commitit ka buildi.',
    ],
    commits: [
      {
        repo: 'frontend',
        hash: '5f578be',
        message: 'fix(build): exclude test helpers from app build',
      },
    ],
  },
];

export const CURRENT_STATE: string[] = [
  'Testid: backendis 20 ja frontendis 39 (sh AXE), kõik läbivad.',
  'Kasutaja saab vaadata sündmusi, sündmust lisada ja kohti broneerida.',
];

export const NEXT_STEPS: string[] = [
  'CI (GitHub Actions): testid, build ja prettier iga pushi peale.',
  'Autentimine (OAuth2/JWT): sündmusi lisavad ainult sisselogitud kasutajad.',
  '„Minu broneeringud“ ja broneeringu tühistamine.',
];
