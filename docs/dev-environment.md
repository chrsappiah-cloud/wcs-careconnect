# Development Environment

## Dev Container
The repository includes `.devcontainer/devcontainer.json` for consistent onboarding.

Primary behavior:
- Node 20 development container
- Auto-installs backend and mobile dependencies after container creation

## Environment Variables
- Backend template: `apps/backend/.env.example`
- Local file: `apps/backend/.env` (not committed)

## Recommended Daily Commands
From repo root:

```bash
npm --prefix apps/backend start
npm --prefix apps/mobile run web
npm --prefix apps/mobile run ios
```

## Validation Habit
At least once per sprint:
1. Perform a clean clone.
2. Follow only `docs/how-to-run-careconnect-web-ios.md`.
3. Confirm web + iOS launch and run smoke checklist.
