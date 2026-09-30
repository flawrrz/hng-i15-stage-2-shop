# AGENTS.md - Project Guidelines for AI Coding Assistants

## Project Overview
- **Project Type:** E-commerce / Shop Website
- **Developer Profile:** Bootcamp student (beginner/intermediate level). Prioritize clear, well-commented code, modern patterns, and incremental steps over overly clever or highly abstracted shortcuts.
- **Core Tech Stack:**
  - Full-Stack Framework: Next.js (App Router)
  - Styling: Tailwind CSS
  - Database & BaaS: Supabase (PostgreSQL, Row Level Security, `@supabase/ssr` / `@supabase/supabase-js`)
  - Authentication: Supabase Auth via Google Console (OAuth 2.0)
  - Email Notifications: Mailgun API (via Next.js Route Handlers / Server Actions)

## UI/UX Reference Site Guidelines
- **Design Inspiration:** Reference [www.sliderpals.com](https://www.sliderpals.com) for UI/UX visual style, layout composition, component design, micro-interactions, color palettes, and purchasing flows.
- **UI Modeling:** When crafting Next.js React components, layout grids, hero sections, product cards, or navigation headers, emulate the clean, playful, and user-friendly design patterns present on www.sliderpals.com.
- **Component Styling:** Utilize Tailwind CSS classes to mirror the spacing, card borders, hover states, typography hierarchy, slide-out cart drawers, and UI elements seen on www.sliderpals.com.

## Next.js Architecture & Coding Style
- **App Router Standards:** Utilize the Next.js App Router (`/app` directory). Leverage Server Components (`page.js`/`page.tsx`) by default for data fetching, and use `"use client"` explicitly only when interactive state (e.g., hooks, click listeners, cart drawers) is required.
- **Backend API Layer:** Write backend endpoint handlers using **Next.js Route Handlers** (`app/api/.../route.js`) or **Server Actions** for form submissions, database updates, and Mailgun email triggers.
- **Simplicity & Readability:** Write clean, explicit code. Avoid complex one-liners. Add clear comments explaining *why* a particular piece of logic exists, especially around Supabase client initialization, OAuth redirects, and API calls.
- **Error Handling:** Never leave empty `catch` blocks. Always display user-friendly toast/UI messages and log detailed server error details via `console.error`.
- **Environment Variables:** Never hardcode secrets. Access keys via process.env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`).

## Commands
- **Install Dependencies:** `npm install`
- **Run Development Server:** `npm run dev`
- **Build for Production:** `npm run build`

## Safety & Permissions (For AI Assistants)
- **Ask First Before:** Installing heavy third-party npm packages, running raw database migrations directly, or modifying core authentication/middleware files.
- **Allowed Freely:** Reading project files, suggesting React/Next.js code snippets, writing unit/integration tests, and debugging terminal or browser error logs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
