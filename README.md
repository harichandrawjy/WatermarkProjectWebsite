# Aegis — Watermark Project Website

React frontend for **Aegis**, a semi-fragile watermarking system for image and video integrity. Users embed an invisible watermark into their media and later verify whether it has been tampered with (face swap, inpainting, splicing, frame drops, reorders).

Talks to the FastAPI backend in [`../../Backend/WatermarkProjectBackend`](../../Backend/WatermarkProjectBackend).

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Supabase Auth (JWT in `localStorage`)
- Iconify (Lucide set)
- Deploys to Vercel ([vercel.json](vercel.json))

## Pages

Single-page app — no react-router. Navigation is a `useState<Page>` in [App.tsx](src/App.tsx).

| Page | File | Auth | Purpose |
|---|---|---|---|
| Home | [src/pages/Home.tsx](src/pages/Home.tsx) | — | Landing page, pipeline explainer, use cases |
| Encode | [src/pages/Encode.tsx](src/pages/Encode.tsx) | required | Upload media, embed watermark, download protected file |
| Verify | [src/pages/Verify.tsx](src/pages/Verify.tsx) | — | Upload suspect file + metadata, detect tampering |
| Results | [src/pages/Results.tsx](src/pages/Results.tsx) | — | Renders `AnalysisResult` from verify |
| Dashboard | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) | required | List of the user's past encodes with re-downloadable `metadata.json` |
| Login / Register | [src/pages/Login.tsx](src/pages/Login.tsx), [src/pages/Register.tsx](src/pages/Register.tsx) | — | Supabase email + password |
| About | [src/pages/About.tsx](src/pages/About.tsx) | — | Project background |

Auth state lives in [src/context/auth.tsx](src/context/auth.tsx). Persists `{ token, user }` in `localStorage` under `wm_token` / `wm_user`. Exposes `login`, `register`, `logout`, and `authedFetch` (auto-attaches the Bearer token).

## Setup

```
npm install
```

Create a `.env` file if the backend isn't on the default `http://localhost:8000`:

```
VITE_API_URL=http://localhost:8000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server on `http://localhost:5173` |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the built bundle |
| `npm run lint` | Run ESLint |

## Running the full stack locally

1. Start the backend (from `../../Backend/WatermarkProjectBackend`):
   ```powershell
   .venv\Scripts\activate
   uvicorn main:app --reload --port 8000
   ```
2. Start this app:
   ```
   npm run dev
   ```
3. Open <http://localhost:5173>. Sign up, then head to Encode.

If the backend runs on a different origin, set `ALLOWED_ORIGINS` in the backend's environment so CORS lets the frontend through.

## How the watermark works (short version)

Backend embeds bits with **LWT + 8×8 DCT + SVD + QIM** on the Y channel, error-corrects with **BCH(15,7)**, and stores per-sub-block **SHA-256 parity** in the Cb LSBs for spatial tamper localization. Videos are watermarked per-frame with frame-ID + chain-tag bits so deletions and reorders show up as temporal events instead of cascading errors.

Output formats are **PNG** (images) and **MKV / FFV1** (video). Both are lossless — re-encoding to JPEG or MP4 destroys the watermark **by design**, and verification correctly flags such files as tampered.

See [AUTH_CHANGES.md](AUTH_CHANGES.md) for the auth layer, per-user data isolation, and API contract added on top of the base engine.

## Types

Result and frame shapes returned by `/verify` (used by [Results.tsx](src/pages/Results.tsx)) are declared in [src/App.tsx](src/App.tsx) as `AnalysisResult`, `FrameResult`, and `TamperedRegion`.
