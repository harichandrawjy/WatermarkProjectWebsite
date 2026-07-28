# User Login & Dashboard — Implementation Summary

Added Supabase-backed authentication to Aegis, gated `/encode` behind login, and built a Dashboard for users to retrieve metadata.json files from their past encodes.

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

### Why the watermark owner is *not* the user's email

> **Superseded.** This section originally said the email was embedded directly, and that keeping the full email in the DB was enough because "`/lookup` still works after compression." That reasoning was wrong and has been fixed — see migration `003_add_profiles_short_id.sql`.

The engine truncates `owner` to `OWNER_ID_BYTES = 8` when embedding. Embedding the email therefore meant the watermark only ever carried its first 8 characters, so any two accounts sharing that prefix became the **same owner**:

```
john.smith@gmail.com        ->  john.smi
john.smigielski@outlook.com ->  john.smi     <-- indistinguishable
```

Keeping the full email in the DB did not rescue this, because `/lookup` matches on `owner_key` — the *truncated* form. The full email was only ever part of the response, never part of the match, so it provided no separating power. The consequences were real: `/lookup` could attribute a file to the wrong account, and `/encode`'s duplicate check could block one user with another user's record while quoting that user's `media_id` back in the error.

Now each account is assigned an 8-character `short_id` (`profiles` table, `UNIQUE` + a format `CHECK` so it can never be truncated by the engine), and *that* is what gets embedded. The email stays in `watermarks.owner` purely for display and is still what `/lookup` returns, so nothing changes for the user.

The owner value still can't be spoofed by the client — it's derived from the JWT either way.

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
