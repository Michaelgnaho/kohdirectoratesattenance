# Baby Guide: Make Kadri Attendance Fully Working (Next.js + Supabase + Tailwind)

Your code already talks to Supabase through `lib/supabaseClient.ts` and the `check_in()` function.
Nothing needs rewiring. You only need to add your keys, run the schema, and create an admin.
This copy of the project has also been converted to Tailwind and fixed (see the end).

## 1. Install and run once to check it builds
```bash
npm install
```

## 2. Create the Supabase project
1. supabase.com -> New project -> set a database password -> Create.
2. Left menu **SQL Editor** -> New query -> paste ALL of `supabase/schema.sql` -> **Run**.
   You should see "Success". Tables: directorates, members, meetings, attendance.
3. **Project Settings -> API**: copy **Project URL** and **anon public** key.
   (Never use the `service_role` key in this app.)

## 3. Add your keys
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```
Restart the dev server any time you change this file.

## 4. Create your admin login
Supabase -> **Authentication -> Users -> Add user -> Create new user**.
Enter email + password and tick **Auto Confirm User**.
Every logged-in user counts as an admin (see the RLS policies), so only create accounts for real admins.

## 5. Run it
```bash
npm run dev
```
Open http://localhost:3000

## 6. Test the full flow (in this order)
1. `/login` -> sign in with the admin account.
2. `/manage` -> add a directorate.
3. Click it -> add a member (a 4-digit code is generated and shown) -> create a meeting (a 5-character session code is generated).
4. Click the meeting -> note the code and QR.
5. Open `/checkin` in a private window (not logged in) -> enter the member code + session code -> you should see the green confirmation.
6. Back on the meeting page, refresh: the member should show **Present**.
7. Tap "Check-in open" to close it, then try again from `/checkin`: it must say check-in is closed.
8. Scan the QR with a phone: it opens `/checkin?code=XXXXX` with the meeting code pre-filled.

## 7. If something fails
| Symptom | Fix |
|---|---|
| "Invalid API key" / network error | Wrong or missing `.env.local` values. Restart dev server. |
| "relation ... does not exist" | `schema.sql` was not run, or failed halfway. Re-run it. |
| Directorate list always empty after adding | You are not logged in (RLS blocks anonymous), or Auth user not confirmed. |
| Login says "Email not confirmed" | Recreate the user with **Auto Confirm User** ticked. |
| "Something went wrong" on check-in | `check_in()` missing or not granted. Re-run the last lines of `schema.sql`. |
| QR opens localhost on a phone | Phone cannot reach your laptop. Test the deployed URL instead. |

## 8. Deploy (Vercel)
1. Push this folder to GitHub (make sure `.env.local` is NOT committed; it is in `.gitignore`).
2. vercel.com -> Add New -> Project -> import the repo.
3. Environment Variables: add the same two `NEXT_PUBLIC_SUPABASE_*` values.
4. Deploy. QR codes will now use your live domain automatically.
5. Supabase -> Authentication -> URL Configuration: set **Site URL** to your Vercel URL.

## 9. What changed in this copy
- **Tailwind v3 added**: `tailwind.config.ts`, `postcss.config.mjs`, `@tailwind` directives in `app/globals.css`,
  and the three dev dependencies in `package.json`. Every page now uses Tailwind classes instead of inline styles.
  Your colour palette (light + dark) is kept as theme colours: `bg-bg`, `bg-card`, `text-ink`, `text-sub`, `border-line`, `bg-accent`, `text-danger`.
  Shared look lives in `@layer components` in `globals.css`: `.card`, `.input`, `.btn`, `.btn-ghost`, `.btn-danger`, `.list-row`, `.muted`.
- **Build fix**: `/checkin` uses `useSearchParams`, which Next 14 refuses to build without a `<Suspense>` wrapper. Added.
- **Errors now visible**: adding a directorate, member or meeting used to fail silently. Errors now show on screen.
- **Forms**: login and check-in submit with the Enter key and disable the button while working.
- Removed the empty `components/` folder.

## 10. Good next improvements (not done yet)
- Admin pages check login in the browser only. Data is still protected by RLS, so this is safe, but a Next middleware using `@supabase/ssr` would redirect before the page loads.
- Any logged-in user is an admin. For stricter control, add an `admins` table and base the policies on it.
- 4-digit member codes allow only 10,000 combinations, and `check_in()` has no rate limit. Fine for small groups; consider longer codes or attempt limits if abuse is a worry.
