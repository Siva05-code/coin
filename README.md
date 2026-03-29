# CoinCoach - Production Setup (Vercel)

This project is now configured for Vercel deployment with:
- static pages (`index.html`, `app.html`)
- serverless API routes (`/api/health`, `/api/config`, `/api/chat`)
- production headers via `vercel.json`
- environment variable template via `.env.example`

## 1) Environment Variables

Copy `.env.example` into `.env.local` for local development:

```bash
cp .env.example .env.local
```

Values used by `/api/config`:
- `APP_NAME`
- `APP_ENV`
- `SUPPORT_EMAIL`

Server-only secret (never expose in frontend):
- `API_KEY`
- `GROQ_MODEL` (optional)
- `GROQ_API_URL` (optional)

Do not commit real `.env*` files. `.gitignore` already excludes them.

## 2) Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. In Vercel Project Settings -> Environment Variables, add:
   - `APP_NAME`
   - `APP_ENV`
   - `SUPPORT_EMAIL`
   - `API_KEY`
4. Deploy.

## 3) Local Vercel Run (optional)

```bash
npm i -g vercel
vercel dev
```

Then open:
- `http://localhost:3000`
- `http://localhost:3000/api/health`

## 4) Production Checks

- Home page loads from `/`
- Demo page loads from `/app`
- API health endpoint returns `{ ok: true }`
- Runtime config appears on the app page header line
- Chat works through `/api/chat` using server-side API key (no hardcoded key in UI)
