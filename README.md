<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OmniAgent AI — Run local (frontend + backend)

## Prerequisites
- Node.js 20+
- npm

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment
Create `.env.local` for Vite frontend and `.env` (or exported vars) for backend.

Required backend vars:
- `META_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN` (optional for dry-run)
- `META_PHONE_NUMBER_ID` (optional for dry-run)
- `GEMINI_API_KEY` (optional fallback reply if missing)
- `BACKEND_PORT` (optional, default `3001`)

Optional frontend var:
- `VITE_BACKEND_URL` (default `http://localhost:3001`)

## 3) Run frontend
```bash
npm run dev
```

## 4) Run backend (second terminal)
```bash
npm run backend:start
```

## 5) Webhook local testing
Expose backend with ngrok:
```bash
ngrok http 3001
```
Set Meta callback URL to:
`https://<ngrok-id>.ngrok-free.app/api/webhook`

## Commands
```bash
npm test
npm run typecheck
npm run build
```
