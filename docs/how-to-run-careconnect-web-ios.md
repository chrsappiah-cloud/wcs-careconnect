# How to Run CareConnect (Web + iOS)

This is the canonical run guide for a clean clone.

## Prerequisites
- Node.js 20+
- npm 10+
- Xcode with iOS Simulator (for iOS)
- macOS (for simulator flow)

## 1) Install Dependencies
From repository root:

```bash
npm --prefix apps/backend install
npm --prefix apps/mobile install
```

## 2) Configure Environment
Create backend env file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Set `DATABASE_URL` (or DB_* variables) in `apps/backend/.env`.

## 3) Start Backend

```bash
npm --prefix apps/backend start
```

Expected: API on `http://localhost:3001`.

## 4A) Run Web
In a second terminal:

```bash
npm --prefix apps/mobile run web
```

Expected: web app on `http://localhost:8081`.

## 4B) Run iOS Simulator
In a second terminal:

```bash
npm --prefix apps/mobile run ios
```

## Quick Smoke Test
- Open Residents list.
- Open one resident profile.
- Update resident status.
- Open Alerts and acknowledge one alert.
- Open Messages and send one message.

If any step fails, capture logs from both backend and mobile terminal sessions.
