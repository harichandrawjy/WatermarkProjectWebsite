# User Login & Dashboard — Implementation Summary

Added Supabase-backed authentication to WaterGuard, gated `/encode` behind login, and built a Dashboard for users to retrieve metadata.json files from their past encodes.

## High-level flow

1. **Sign Up / Sign In** — email + password against Supabase Auth. JWT stored in `localStorage`.
2. **Encode** — now requires login. `owner` is no longer free-text; it's locked to the authenticated user's email. The watermark row is tagged with `user_id`.
3. **Verify** — stays public. Anyone can verify any file with its metadata.
4. **Dashboard** — lists the signed-in user's past encodes (newest first) with download buttons for both `metadata.json` and the watermarked file.

## Backend changes (`../../backend`)

| File | Change |
|---|---|
| `auth.py` *(new)* | `get_current_user` FastAPI dependency. Reads `Authorization: Bearer <jwt>` and resolves the Supabase user via `supabase.auth.get_user(token)`. |
| `main.py` | Added `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. Modified `POST /encode` to require auth, derive `owner` from `user.email`, and write `user_id` on insert. Added `GET /me/media` (list own encodes) and `GET /me/media/{id}/metadata` (fetch own metadata). |
| `requirements.txt` | Added `pydantic[email]` for `EmailStr` validation on auth bodies. |
| `migrations/001_add_user_id.sql` *(new)* | `ALTER TABLE watermarks ADD COLUMN user_id UUID REFERENCES auth.users(id)` + index + `created_at` default. |

### Why use the user's email as the watermark owner string?

The engine truncates `owner` to `OWNER_ID_BYTES = 8` when embedding bits. The database keeps the full email (so `/lookup` still works after compression). Behavior matches what was already there for free-text owners — except now the value can't be spoofed by the client.

## Frontend changes (`src/`)

| File | Change |
|---|---|
| `context/auth.tsx` *(new)* | `AuthProvider`, `useAuth()` hook. Persists `{ token, user }` in `localStorage` under keys `wm_token` / `wm_user`. Exposes `login`, `register`, `logout`. |
| `pages/Login.tsx` *(new)* | Email + password form. On success → Dashboard. |
| `pages/Register.tsx` *(new)* | Email + password + confirm. Handles Supabase's email-confirmation flow with a "check your inbox" view when `session` is null. |
| `pages/Dashboard.tsx` *(new)* | Fetches `GET /me/media`, lists each encode with kind, media ID, PSNR, timestamp, and two download buttons: `metadata.json` (built from the row's `metadata` column, so users can re-download the file they need for `/verify` even if they lost the original) and `File` (the watermarked PNG/MKV). |
| `App.tsx` | Wrapped tree in `<AuthProvider>`. Added `'login' \| 'register' \| 'dashboard'` to the `Page` type. |
| `components/Navbar.tsx` | Logged-out: "Sign In" + "Sign Up" buttons. Logged-in: avatar + email dropdown with Dashboard / Encode New / Sign Out. Mobile burger menu mirrors both states. |
| `pages/Encode.tsx` | Auth-gated: shows a sign-in prompt when not logged in. Owner field is now a read-only display of the logged-in email (with a lock icon). Form only collects Media ID. `fetch('/encode')` now sends `Authorization: Bearer <token>`. |

## What stays the same

- `Verify.tsx`, `Results.tsx`, `Home.tsx`, `About.tsx` — untouched.
- All existing encode/verify logic, watermark engine, `/lookup`, file storage — untouched.

## Setup the user needs to run once

1. **Run the SQL migration** in Supabase Dashboard → SQL Editor → New query → paste `backend/migrations/001_add_user_id.sql` → Run.
2. **Install the new backend dependency**:
   ```powershell
   cd ..\..\backend
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Confirm Supabase Auth settings** (Dashboard → Authentication → Providers → Email):
   - If "Confirm email" is **on**, new signups go through the email-confirmation screen.
   - If **off**, signups log straight in. (Easier for local testing.)

## API contract added

| Method | Path | Auth | Body / Params | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password }` | `{ user, access_token \| null, needs_confirmation }` |
| POST | `/auth/login` | — | `{ email, password }` | `{ user, access_token }` |
| GET | `/auth/me` | Bearer | — | `{ id, email }` |
| POST | `/encode` | Bearer | multipart: `file`, `media_id` *(no `owner`)* | unchanged response shape |
| GET | `/me/media` | Bearer | — | `{ items: WatermarkRow[] }` |
| GET | `/me/media/{id}/metadata` | Bearer | — | metadata JSON for that record |

## Security notes

- Owner ID on encoded media is now cryptographically tied to a real Supabase account — it can no longer be spoofed by typing into a form.
- `/me/*` endpoints filter by `user_id` from the verified JWT, so users only see their own records.
- The backend never touches passwords. Supabase handles hashing, JWT signing, and email confirmation.
- JWT is stored in `localStorage`. Acceptable for a graduation-project demo; for production, consider switching to httpOnly cookies + a refresh-token flow.
