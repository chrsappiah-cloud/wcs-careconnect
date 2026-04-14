# CareConnect

CareConnect is an aged-care platform with a Node/Express backend and an Expo mobile app that also runs on web.

## Branch Strategy

- `stabilisation/careconnect-2026-04-14`: known-good baseline branch for demos and testing.
- `feature/careconnect-functional-2026-04-14`: shipping branch for functional fixes and UX updates.
- `cleanup/careconnect-structural-2026-04-14`: non-shipping cleanup branch for AI-assisted or structural changes.

Merge policy:
- Merge functional fixes first.
- Merge cleanup branches only after automated tests pass and manual smoke tests pass on iOS simulator and web.

## MVP Scope and Quality Gates

- MVP scope: `docs/CareConnect MVP v0.1.md`
- Mobile/web parity checklist: `docs/mobile-web-parity-checklist.md`
- Run guide (web + iOS): `docs/how-to-run-careconnect-web-ios.md`
- Dev environment conventions: `docs/dev-environment.md`

Before starting any new feature work, complete and pass the parity checklist on simulator and web.

## Quick Start (Clone to Running App)

From repo root:

```bash
npm --prefix apps/backend install && npm --prefix apps/mobile install
npm --prefix apps/backend start
npm --prefix apps/mobile run ios
```

For web instead of simulator:

```bash
npm --prefix apps/mobile run web
```

Web default URL: `http://localhost:8081`
Backend default URL: `http://localhost:3001`

## VS Code Run and Debug

Included files:
- `.vscode/launch.json`
- `.vscode/tasks.json`

Debug profiles:
- `CareConnect Backend (Node)`: runs backend with dotenv and debugger attached.
- `CareConnect Web (Expo + Chrome)`: starts Expo web and launches Chrome.
- `CareConnect Full Stack Debug`: runs backend and web debug together.

Task shortcuts:
- `backend:start`
- `mobile:web`
- `mobile:ios`
