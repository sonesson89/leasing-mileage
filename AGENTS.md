# AGENTS.md

Instructions for AI coding agents working in this repository.

## Keeping this file up to date

This file is a living requirements doc, not a one-time snapshot. Not every change needs to be documented here — skip pure styling tweaks, refactors, or bug fixes that don't change behavior. But if a change alters or contradicts anything stated in this file (a core rule, a mode's behavior, a data/unit convention, a persistence rule, etc.), update the relevant section of AGENTS.md in the same task, so it always reflects the app's actual current behavior.

## Project overview

Full-stack app that helps a driver track mileage against a car-leasing contract.

- **Backend**: Python (FastAPI), in [backend/](backend/).
- **Frontend**: Vite + React + TypeScript, in [client/](client/). `App.tsx` holds all state/logic; presentational pieces live in [client/src/components/](client/src/components/) (`LoginScreen`, `CarLocationMap`, `AverageMileageStats`, `MileageProjectionChart`, `ChargeHistoryChart`, `AnonTutorial` (`TutorialStep`), `SourceFooter`). Shared types are in [client/src/types.ts](client/src/types.ts) and formatting helpers in [client/src/utils/format.ts](client/src/utils/format.ts). Routing uses `react-router-dom` (`BrowserRouter` in [client/src/main.tsx](client/src/main.tsx)); the backend's SPA catch-all in `main.py` and Vite's dev server both serve `index.html` for any path, so client-side routes work on a full page load too.
- The Vite dev server (port 5173) proxies `/api` requests to the FastAPI backend (port 8001). In production, FastAPI serves the built client from `client/dist/` (see [backend/main.py](backend/main.py)).

## How the app works

The frontend ([client/src/App.tsx](client/src/App.tsx)) has three modes, chosen from the login screen or deep-linked directly via the URL path:

- `/` — shows the login screen if not authenticated, otherwise the real Renault dashboard (or whichever mode is currently active in memory).
- `/demo` — jumps straight into demo mode on load, without ever rendering the login screen. `handleDemo` also navigates here (`replace`) when triggered from the login screen's demo button, so the URL always reflects the active mode.
- `/anon` — jumps straight into anon mode on load, same deep-link behavior as `/demo`, via `handleAnon`.

Landing on `/demo` or `/anon` skips the `/api/auth/session` check entirely (see the mount effects in `App.tsx`) so a real session can never race with and override the deep-linked mode. Leaving demo/anon via "Back to login screen" (`handleReturnToLogin`) or real-login "Sign out" (`handleLogout`) navigates back to `/`.

1. **Real Renault login** — user submits email/password to `POST /api/auth/login`. The backend authenticates with the Renault API ([backend/renault_service.py](backend/renault_service.py)), stores the Renault login token server-side in memory keyed by an HTTP-only session cookie (`renault_session`), and the frontend then fetches `/api/car/status`, `/api/car/picture`, and `/api/car/charges` to show real mileage, car picture, car location (map), and charging history. Header title: "Renault Leasing Checker". A "Sign out" button calls `POST /api/auth/logout` and wipes the shared lease-setting `localStorage` keys.
2. **Demo mode** — "Demo with mocked Renault API data" button (shown right below "Login using Renault credentials"). No network calls; the frontend fills all state (mileage, car picture, location, charge sessions) with hardcoded mock data. Shows the full dashboard including map and charging history, labeled "Demo data". Like anon mode, shows a "Back to login screen" button (not "Sign out") and leaves `localStorage` untouched on exit, since there's no real session either.
3. **Anon mode** ("Continue without logging in", below a divider under the demo button) — no login, no API calls. The user manually enters mileage (in mil) via an input field. No car picture (generic `GenericCarIcon` SVG shown instead), no map, no charging history, since none of that is known. Header title becomes "Car Leasing Calculator" (since it's not necessarily a Renault) and shows a "Manual mode" label. Uses the same "Back to login screen" button/behavior as demo mode (`handleReturnToLogin`), which resets in-memory auth state only and deliberately leaves `localStorage` untouched (unlike the real-login "Sign out").

   Includes a 5-step tutorial/wizard ([client/src/components/AnonTutorial.tsx](client/src/components/AnonTutorial.tsx): speech-bubble popovers with a CSS-arrow, exports `ANON_TUTORIAL_STEPS` and a `TutorialStep` component rendered once per field) that points at, in order: the mileage field, start date, contract limit, over-mileage fee, and contract length fields. Each step has "Next"/"Cancel tutorial"; canceling offers "Cancel" (dismiss for this session) or "Never show tutorial again" (persists `hideAnonTutorial` to `localStorage`). The tutorial is also skipped automatically if `anonMileage`, `startDate`, `maxMilPerYear`, `overageFee`, and `leasingYears` are all already present in `localStorage` (returning user).

Shared dashboard (all modes): lease settings (start date, contract mil/year limit, over-mileage fee, contract length in years), a mileage-over-time projection chart, average mileage stats, and projected over/under-mileage cost — all computed client-side in `App.tsx` from `mileage`, `startDate`, `maxMilPerYear`, `overageFee`, and `leasingYears`. Lease settings persist to `localStorage` as soon as they have a value — `startDate` and `leasingYears` have defaults (today / 3 years) that are written to `localStorage` immediately on first load, not just on change — and are cleared on real-login "Sign out" (but not on demo/anon mode's "Back to login screen").

Unit convention: the Renault API and internal `mileage` state are in **km**; the UI displays **mil** (Swedish mile, 1 mil = 10 km) almost everywhere via the `fmtMil` helper. The anon-mode mileage input itself is in **mil** and is converted to km on change.


### Backend routes ([backend/api.py](backend/api.py))

- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout` — session management, backed by an in-memory `_sessions` dict (lost on backend restart) and per-IP in-memory rate limiting (5 login attempts / 30 invalid-session attempts per minute). `_sessions` maps the session cookie to a `RenaultSession` (login token + discovered `account_id`/`vin`), not just a bare token.
- `GET /api/car/picture`, `GET /api/car/status`, `GET /api/car/charges?days=N` — require the session cookie; proxy to `backend/renault_service.py`, which talks to the `renault-api` package. There is no fixed vehicle configured anywhere — `authenticate()` discovers the account and vehicle (first account with at least one vehicle) from the logged-in user's own Renault profile via `client.get_api_accounts()` / `account.get_api_vehicles()`, so any My Renault account can log in. The locale is hardcoded (`sv_SE`) in `renault_service.py`; there is no `.env`/config file — nothing needs to be configured to run the backend.

## Working conventions

- Keep demo mode fully mocked (no network calls) and keep it in sync if `App.tsx`'s data shape changes.
- Anon mode must never trigger any `/api/car/*` fetches — mileage there is user-entered only.
- Anon mode's exit path (`handleReturnToLogin`) must never clear `localStorage`; only the real-login "Sign out" path (`handleLogout`) does that.
- Follow the existing dark theme styling conventions (colors like `#efdf24` accent, `#191c22`/`#1a1a1a` backgrounds) when adding UI.
- Components in `client/src/components/` are styled with `styled-components` (anonymous styled elements defined at the top of the file), not separate CSS files — keep new extracted components consistent with that. `App.tsx` itself still uses plain classNames backed by [client/src/App.css](client/src/App.css) for the parts that haven't been extracted (header, vehicle card, lease settings, overage/under-budget cards); don't mix the two approaches within the same file.
- The `mileage` state is always in km internally; convert to/from mil at the UI boundary (divide/multiply by 10), don't change that convention.
- If adding/reordering anon-mode tutorial steps, update `ANON_TUTORIAL_STEPS` in `AnonTutorial.tsx` and each `TutorialStep`'s `stepIndex` prop in `App.tsx` together — they're matched by array index.

## Commands

- Do **not** run `npx tsc`, `tsc -b`, `npm run build`, or any other TypeScript type-check/build command after making client changes, even to verify correctness. Rely on `get_errors`/editor diagnostics instead.
- Backend dev server: `uvicorn backend.main:app --reload --port 8001` (run from repo root, inside the `.venv`).
- Frontend dev server: `npm run dev` (run from `client/`).
