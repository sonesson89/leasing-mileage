# Renault Leasing Checker

Full-stack application with a **Python (FastAPI)** backend and a **Vite + React + TypeScript** frontend.

## Project Structure

```
├── backend/          # Python FastAPI backend
│   ├── main.py       # Application entry-point & SPA serving
│   └── api.py        # API routes
├── client/           # Vite + React + TypeScript frontend
│   ├── src/
│   └── vite.config.ts
├── requirements.txt  # Python dependencies
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+ & npm

## Getting Started

### 1. Install backend dependencies

```bash
python -m venv .venv
# Windows
source .venv/Scripts/activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Run in development mode

Start both servers:

```bash
# Terminal 1 – Backend (from project root)
uvicorn backend.main:app --reload --port 8001

# Terminal 2 – Frontend (from client/)
cd client
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/leasingapi` requests to the backend at `http://localhost:8001`.

Open the frontend and sign in with your My Renault email and password. The password is used only for the Renault login request and is not stored. The backend retains Renault's login token in memory and identifies the browser with an HTTP-only cookie. The account and vehicle (VIN) are discovered automatically from the logged-in user's Renault profile — any My Renault account works, nothing needs to be preconfigured.

Because sessions are held in memory, restarting the backend returns users to the login screen.

The backend applies per-IP, in-memory rate limits of 5 login attempts and 30 invalid session-cookie attempts per minute. Exceeded limits return HTTP `429` with a `Retry-After` header. These counters reset when the backend restarts.

### 4. Production build

```bash
cd client
npm run build
```

Then start only the backend — it will serve the built frontend from `client/dist/`:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

## Troubleshooting

### Login returns error 403101 / Pending Two-Factor Authentication

Renault may require an email OTP when signing in from a new session. The current web login supports direct email/password authentication only, so accounts requiring a new OTP challenge cannot complete that challenge in the UI yet.

---

### All API calls return 502 Bad Gateway (`invalid loginID or password`)

This is caused by a bug in `renault-api` versions below `0.5.10`. If the `.venv` gets recreated or dependencies are reinstalled, the old version may be pulled in from cache.

**Fix:** upgrade `renault-api` inside the `.venv`:

```bash
# Git Bash / macOS / Linux
.venv/Scripts/python.exe -m pip install "renault-api==0.5.10"

# Windows Command Prompt / PowerShell
.venv\Scripts\python.exe -m pip install "renault-api==0.5.10"
```

Then restart the backend server.
