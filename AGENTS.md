# EventHub Web
- Angular 22: standalone, zoneless, OnPush on vaikimisi (ära sea changeDetection'it ega standalone: true). NgModule'eid ei kasutata.
- input()/output()/model(), mitte @Input/@Output. inject(), mitte konstruktori DI.
- @if/@for/@defer, mitte *ngIf/*ngFor.
- Lugemine: httpResource(). Muutmine: HttpClient teenuses.
- Vormid: Signal Forms (@angular/forms/signals).
- Olek: signal/computed/linkedSignal. RxJS ainult ajapõhiste asjade jaoks (debounce).
- API kutsed suhtelise URL-iga /api/..., dev-is proxy kaudu.
- Proxy: proxy.conf.json, /api → localhost:8080
- Staatilised pildid: NgOptimizedImage (inline base64-ga ei tööta).
- Host-bindingud host-objektis, mitte @HostBinding/@HostListener.
- Feature-marsruudid lazy loadinguga.
- Ligipääsetavus: peab läbima AXE kontrollid ja WCAG AA (fookus, kontrast, ARIA).
- Testid: Vitest.

## Käsud
Käivita `frontend/` kaustast.
- start: `npm start` (`ng serve`)
- test: `npm test -- --watch=false`
- üks fail: `npm test -- --watch=false --include src/app/<tee>.spec.ts`
- format: `npx prettier --check .` / `npx prettier --write <fail>`
