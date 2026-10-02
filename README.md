# Kadri Oba Obafemi — Directorate Attendance (Next.js + Supabase)

Self-hosted attendance app: directorates, members (with roles and private
4-digit codes), meetings (with session codes + QR check-in), and a public
self check-in page.

## 1. Create a Supabase project
1. Go to supabase.com, create a free project.
2. In the SQL Editor, paste and run everything in `supabase/schema.sql`.
3. In Project Settings → API, copy your **Project URL** and **anon public key**.

## 2. Create admin accounts
Go to Authentication → Users in Supabase and manually add an account
(email + password) for yourself and anyone else who should have access
to the Manage screens. Regular campaign members do **not** need accounts —
they only use the public Check-In page with their personal code.

## 3. Configure the app
```
cp .env.local.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
with the values from step 1.

## 4. Run it locally
```
npm install
npm run dev
```
Visit http://localhost:3000.

## 5. Host it yourself
Any Node-capable host works since this is a standard Next.js app:
```
npm run build
npm run start
```
Point it at a domain, or deploy to any Node/Next-friendly host (Vercel,
Railway, Render, a VPS with PM2, etc.) — just set the same two environment
variables on the host.

## How it works
- **Admins** log in at `/login` and manage everything at `/manage`.
- **Members** never log in. At a meeting, the admin displays that
  meeting's session code (or its QR code) at `/manage/meeting/[id]`.
  Members go to `/checkin`, enter their personal code + the session code,
  and are marked present. Scanning the QR code pre-fills the session code.
- All code matching happens inside the `check_in()` Postgres function
  (see `supabase/schema.sql`), so personal codes are never sent to anyone's
  browser except through direct admin access to the `members` table.
- Closing check-in on a meeting (the toggle button) immediately blocks
  any further self check-ins for it.
