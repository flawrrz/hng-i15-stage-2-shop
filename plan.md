# Project Plan: Next.js E-Commerce Shop Web App

## Milestone 1: Next.js App Router Initialization & UI Audit
- [ ] Initialize Next.js project (`npx create-next-app@latest`) with App Router, TypeScript/JavaScript, and Tailwind CSS.
- [ ] Establish folder conventions (`/app`, `/components`, `/lib/supabase`, `/actions` or `/app/api`).
- [ ] Create a `.env.local.example` template containing required client and server environment variables.
- [ ] **UI Audit:** Analyze [www.sliderpals.com](https://www.sliderpals.com) to identify primary UI patterns (color schemes, navigation menu style, product card layouts, typography, button hover effects, and slide-out cart UI).

## Milestone 2: Supabase Database & Schema Setup
- [ ] Create a new project on Supabase.
- [ ] Design and run SQL scripts for core tables:
  - `products` (id, title, description, price, stock_quantity, image_url, category, created_at)
  - `orders` (id, user_id, total_amount, status, shipping_address, created_at)
  - `order_items` (id, order_id, product_id, quantity, price_at_purchase)
- [ ] Seed initial mock product data into the `products` table.
- [ ] Configure Row Level Security (RLS) policies allowing public reading of products and user-restricted management of orders.

## Milestone 3: Google Authentication via Next.js Middleware & Supabase Auth
- [ ] Configure a project in the **Google Cloud Console** (OAuth Consent Screen, Web Application Client ID/Secret).
- [ ] Enable the Google Provider under Supabase *Authentication -> Providers* with the client keys and correct redirect URL (`/auth/callback`).
- [ ] Set up `@supabase/ssr` helpers for client-side and server-side authentication state management in Next.js.
- [ ] Create a `/auth/callback` Route Handler (`app/auth/callback/route.js`) to exchange code for session cookies.
- [ ] Build a user profile menu widget in the header styled after www.sliderpals.com.

## Milestone 4: Frontend Catalog & Shopping Cart (UI modeled after sliderpals.com)
- [ ] **Header & Footer:** Build modern navigation, top banner, and footer layouts inspired by www.sliderpals.com.
- [ ] **Product Grid:** Create Server Components (`app/page.js`) to fetch product catalogs directly from Supabase, rendering product cards matching www.sliderpals.com's aesthetic.
- [ ] **Product Details Modal/Page:** Implement dynamic routes (`app/products/[id]/page.js`) with responsive image displays and purchase controls.
- [ ] **Interactive Shopping Cart:** Build a slide-out cart drawer component using React Context / Zustand to track items, quantities, and subtotal calculations.
- [ ] Build a checkout form page (`app/checkout/page.js`) to collect shipping and customer information.

## Milestone 5: Backend Order Processing & Mailgun Email Integration
- [ ] Create a Next.js Server Action or API Route Handler (`app/api/checkout/route.js`) to process order submissions:
  - Verify cart prices against database records.
  - Insert order data into `orders` and `order_items` tables using Supabase server client.
- [ ] Integrate **Mailgun API** inside the Next.js backend endpoint (`mailgun-js` or direct REST API call):
  - Configure Mailgun domain/sandbox and API keys in `.env.local`.
  - Trigger an automated HTML confirmation email to the customer containing order summary details upon successful checkout.
- [ ] Build a dedicated "Order Success" receipt page (`app/checkout/success/page.js`) echoing sliderpals.com's UI design.

## Milestone 6: Testing, Polish & Vercel Deployment
- [ ] Perform end-to-end testing (Google auth login, catalog browsing, cart updates, order creation in Supabase, and Mailgun confirmation delivery).
- [ ] Audit UI responsiveness across mobile, tablet, and desktop viewports against sliderpals.com visual standards.
- [ ] Configure environment variables in the Vercel (or preferred host) dashboard and complete the production deployment.