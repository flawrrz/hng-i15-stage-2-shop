# Stage 2 Shop — Mobile App (Expo)

Companion iOS/Android app for the Stage 2 Shop web app. Same Supabase backend,
same `/api/checkout` and `/api/newsletter` endpoints, same products — so orders,
stock and emails all stay in sync with the website.

**Stack:** Expo SDK 57 · Expo Router (file-based navigation) · Supabase JS v2 ·
Zustand (cart) · expo-sqlite (local storage) · TypeScript

---

## ✨ Features

- **Shop tab** — hero, live search, 2-column product grid, pull-to-refresh, newsletter signup
- **Product detail** — images, stock status, quantity picker, add to cart
- **Cart tab** — quantity controls, remove/clear, totals with the same shipping/tax rules as the web (free shipping ≥ $50, 8% tax), cart badge on the tab bar
- **Checkout** — same validation and payloads as the website, guest checkout supported
- **Account tab** — email/password sign-in & sign-up, Google OAuth (deep-linked), order history, sign out
- **Persists locally** — cart and session survive app restarts (localStorage backed by expo-sqlite)
- **Live cart sync** — signed-in carts are shared instantly with the web shop (Supabase Realtime); a guest cart merges into the account at sign-in

---

## 🚀 Quick Start

```bash
# 1. From the REPO ROOT: install the web app and start it (the API backend)
npm install
npm run dev                      # http://localhost:3000

# 2. In a second terminal: install and start the mobile app
cd mobile
npm install
npx expo start                   # scan the QR code with the Expo Go app
```

> **First run note:** `npx expo start` generates `expo-env.d.ts` (gitignored,
> like in every Expo project). Run it once before `npx tsc --noEmit`.

The app reads three environment variables from `mobile/.env`
(the repo ships with one prefilled from your web `.env.local`; the template is
[`.env.example`](.env.example)):

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://tpveipnnpwxoiouhkozk.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (public by design — RLS protects the data) | `eyJhbGciOi...` |
| `EXPO_PUBLIC_API_URL` | Base URL of the Next.js app (its `/api/*` routes are the mobile backend) | `http://localhost:3000` |

If a variable is missing the app fails fast with an error naming it — fill in
`.env` and restart with `npx expo start --clear`.

> ⚠️ `EXPO_PUBLIC_*` values are **inlined into the bundle**. Never put secrets
> in them (no service-role keys, no SMTP passwords).

### Which `EXPO_PUBLIC_API_URL` do I use?

| Where the app runs | `EXPO_PUBLIC_API_URL` |
|--------------------|----------------------|
| iOS Simulator | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` (localhost is the *emulator* itself) |
| Physical phone (same Wi-Fi) | `http://<your-computer-LAN-IP>:3000` — find it with `ipconfig` |
| Production build | `https://your-app.vercel.app` |

---

## 🔐 Supabase Auth Setup (one-time)

The app signs users in with Supabase using **deep links** (`stage2shop://…`),
so those URLs must be allowed in the Supabase dashboard:

1. Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**
2. Add:
   ```
   stage2shop://**          # standalone/dev-build app (Google OAuth + email confirmation)
   exp://**                 # Expo Go during development (dev server uses exp:// URLs)
   ```
3. **Authentication → Providers → Google** must already be enabled
   (shared with the web app — no extra credentials needed).
4. Optional for testing: **Authentication → Providers → Email** — if
   *Confirm email* is on, sign-up sends a link that returns to
   `stage2shop://auth/callback` and signs the user in automatically.

OAuth flow used: implicit flow handled by
`expo-auth-session` + `expo-web-browser` (`openAuthSessionAsync`), with a
`Linking.useLinkingURL()` fallback for links that land via the email app —
same pattern as Supabase's official Expo example. Session storage is
`expo-sqlite`'s localStorage polyfill (no AsyncStorage needed).

---

## 🛒 Cart Sync Setup (one-time)

Signed-in carts sync live between this app and the web shop through a
`cart_items` table + Supabase Realtime. Run it once:

1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the repo root's [`supabase-cart-sync.sql`](../supabase-cart-sync.sql)
3. Click **Run**

Until the table exists everything still works locally — sync just stays
inactive and logs a console error naming that file (run it and reload).

---

## 🛠 Development Commands

```bash
npx expo start             # dev server (Expo Go QR code)
npx expo start --clear     # restart, clearing Metro cache (after .env changes)
npx expo lint              # ESLint (0 errors expected)
npx tsc --noEmit           # typecheck (0 errors expected)
npx expo export -p android # verify a production JS bundle builds
npx expo-doctor            # dependency/config health check
```

CI-style check before every commit:

```bash
npx expo lint && npx tsc --noEmit
```

---

## 📦 Building & Submitting (EAS)

No Xcode/Android Studio needed — builds run in the cloud.

```bash
npx eas-cli login           # one-time (use the same Expo account everywhere)
npx eas-cli build --profile preview --platform android      # installable APK for testers
npx eas-cli build --profile production --platform android   # Play Store AAB
npx eas-cli build --profile production --platform ios       # App Store .ipa
npx eas-cli submit --platform ios --profile production      # upload to App Store Connect
npx eas-cli submit --platform android --profile production  # upload to Play Console
```

Profiles live in [`eas.json`](eas.json):
`development` (dev client), `preview` (internal distribution APK), `production`
(store, auto-increments the build number).

Before submitting, set `EXPO_PUBLIC_API_URL` to your **deployed** Vercel URL in
`.env` (EAS reads it at bundle time) so checkout/newsletter work outside your
local network.

### 🍎 App Store Guideline 4.8 note

The app offers **Google Sign-In**, which falls under
[App Store Review Guideline 4.8](https://developer.apple.com/app-store/review/guidelines):
apps that use a third-party/social login service must also offer **Sign in with
Apple** — or, since January 2024, an equivalent privacy-focused login option.
Email/password sign-in exists in the app, but Apple has rejected similar apps
under 4.8 anyway. If App Review rejects the iOS build:

- add `expo-apple-authentication` and wire a "Continue with Apple" button into
  `src/lib/auth.tsx`'s `signInWithGoogle` flow next to it, **or**
- argue the equivalent option (email/password with no cross-app tracking) in
  Resolution Center / add Apple sign-in.

Android (Play Store) has no such requirement.

---

## 📁 Structure

```
mobile/
├── app.json               # identity (scheme: stage2shop, bundles: com.stage2shop.app)
├── eas.json               # EAS build/submit profiles
├── .env / .env.example    # EXPO_PUBLIC_* config (only .env.example is committed)
└── src/
    ├── app/               # screens (Expo Router file-based routes)
    │   ├── _layout.tsx    # root stack + AuthProvider + CartSync + splash
    │   ├── (tabs)/        # Shop · Cart · Account (native tab bar + badge)
    │   ├── product/[id].tsx
    │   ├── checkout/      # index (form) · success (confirmation)
    │   └── auth/callback.tsx   # email-confirmation deep link landing
    ├── components/        # Button, TextField, ProductCard, QuantityStepper, ...
    └── lib/
        ├── env.ts         # reads & validates EXPO_PUBLIC_* vars
        ├── supabase.ts    # client (localStorage session, AppState token refresh)
        ├── auth.tsx       # AuthProvider: password + Google OAuth + deep links
        ├── cart-store.ts  # zustand + persist (mirrors web cart-store)
        ├── cart-sync.ts   # web ↔ mobile cart sync engine (mirrors web)
        ├── api.ts         # /api/checkout, /api/newsletter calls, totals
        ├── theme.ts       # design tokens (same palette as web)
        └── types.ts       # shared Supabase row types
```

---

## 🧯 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Missing EXPO_PUBLIC_...` error on start | Create `mobile/.env` from `.env.example`, restart with `npx expo start --clear` |
| Checkout/network request fails on device | `EXPO_PUBLIC_API_URL` must be your computer's **LAN IP**, not `localhost`; firewall must allow port 3000 |
| Google sign-in returns to browser, never signs in | Add `stage2shop://**` (and `exp://**` for Expo Go) to Supabase **Redirect URLs** |
| Blank cart/orders after reinstall | Expected — data lives in on-device storage (expo-sqlite localStorage) |
| Stale bundle or env changes not picked up | `npx expo start --clear` |
| `expo-env.d.ts` missing under `tsc` | Run `npx expo start` once (it generates the file) |
