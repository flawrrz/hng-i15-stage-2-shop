# Stage 2 Shop - Modern E-Commerce Platform

A full-stack e-commerce web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (PostgreSQL + Auth), and **Zustand** for state management. Features Google OAuth authentication, shopping cart, checkout flow, order management, and email notifications via Gmail SMTP.

It also ships with a **companion mobile app** in [`mobile/`](mobile/README.md) — an Expo (SDK 57) app that talks to the *same* Supabase project and the same `/api/*` routes, so both platforms share one catalog, one cart/checkout contract and one order history.

## 🚀 Live Demo

**Deployed on Vercel**: [https://hng-i15-stage-2-shop.vercel.app](https://hng-i15-stage-2-shop.vercel.app)

---

## ✨ Features

### Customer-Facing
- **Product Catalog** - Browse products with categories, responsive grid layout
- **Product Details** - Image gallery, description, quantity selector, add to cart
- **Shopping Cart** - Slide-out drawer with persistent storage (Zustand + localStorage)
- **Checkout Flow** - Multi-step form (Contact → Shipping → Payment-ready)
- **Order Confirmation** - Success page with order summary, email receipt
- **User Account** - Google OAuth login, order history, profile management
- **Responsive Design** - Mobile-first, works on all device sizes

### Developer Experience
- **TypeScript** - Full type safety across frontend, backend, and database
- **Server Components** - Default RSC for optimal performance
- **Server Actions / Route Handlers** - Type-safe API layer
- **Supabase Integration** - SSR-compatible auth with `@supabase/ssr`
- **Edge-Ready Proxy** - Auth protection for routes

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + Google OAuth 2.0 |
| **State** | Zustand 5 (with persist middleware) |
| **Email** | Gmail SMTP (Nodemailer) |
| **Icons** | Lucide React |
| **Deployment** | Vercel |
| **Linting** | ESLint 9 + Next.js config |

---

## 📁 Project Structure

```
stage-2-shop/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API Route Handlers
│   │   │   ├── checkout/  # POST /api/checkout - order processing
│   │   │   └── newsletter/ # POST /api/newsletter - subscriptions
│   │   ├── auth/          # Auth pages
│   │   │   ├── callback/  # OAuth callback handler
│   │   │   ├── login/     # Sign in page
│   │   │   └── signup/    # Sign up page
│   │   ├── checkout/      # Checkout flow
│   │   │   └── success/   # Order confirmation page
│   │   ├── products/      # Product pages
│   │   │   └── [id]/      # Dynamic product detail
│   │   ├── account/       # User dashboard
│   │   ├── about/         # About page
│   │   ├── contact/       # Contact form
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout (Header, Footer, CartDrawer)
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── Button.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetail.tsx
│   │   └── AccountPage.tsx
│   ├── lib/               # Utilities & clients
│   │   ├── supabase/      # Supabase clients
│   │   │   ├── client.ts  # Browser client
│   │   │   └── server.ts  # Server/Server Action client
│   │   ├── cart-store.ts  # Zustand cart store
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── utils.ts       # Helper functions
│   └── proxy.ts           # Auth proxy (Next.js v16+)
├── mobile/               # Expo mobile app (iOS + Android)
│   ├── app.json          # scheme stage2shop · bundle com.stage2shop.app
│   ├── eas.json          # EAS build profiles (dev/preview/production)
│   ├── .env.example      # EXPO_PUBLIC_* template (copy to .env)
│   └── src/              # screens (app/), components/, lib/ — see mobile/README.md
├── supabase-schema.sql    # Database schema + seed data
├── supabase-additional.sql # Additional tables (newsletter, views)
├── .env.local.example     # Environment variable template
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- npm / pnpm / yarn
- Supabase account
- Google Cloud Console project
- Gmail account with App Password (for emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/stage-2-shop.git
cd stage-2-shop

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Fill in your credentials in .env.local
# (See Environment Variables section below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create `.env.local` from `.env.local.example` and fill in:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (Required for auth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Gmail SMTP (Required for emails)
GMAIL_SMTP_USER=yourgmail@gmail.com
GMAIL_SMTP_APP_PASSWORD=your-16-character-app-password
GMAIL_FROM_NAME=Shop

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to Get Credentials

| Service | Dashboard | Keys Needed |
|---------|-----------|-------------|
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard/project/_/settings/api) | Project URL, Anon Key, Service Role Key |
| **Google OAuth** | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) | Client ID, Client Secret |
| **Gmail SMTP** | [myaccount.google.com](https://myaccount.google.com) | Gmail address, 16-char app password |

---

## 🗄 Database Setup

### Run Schema in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Create **New Query**
3. Paste contents of `supabase-schema.sql`
4. Click **Run** (creates tables, indexes, RLS policies, seed data)
5. Optional: Run `supabase-additional.sql` for newsletter table

### Schema Overview

```sql
products          # Product catalog
orders            # Customer orders
order_items       # Line items per order
newsletter_subscribers  # Email subscriptions
```

**RLS Policies** (already included):
- Products: Public read, admin write
- Orders: Users see only their own
- Order Items: Users see only their own order's items

---

## 🔐 Authentication Setup

### Google OAuth Configuration

1. **Google Cloud Console** → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web Application)
3. Add Authorized Redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://your-app.vercel.app/auth/callback
   ```
4. Copy Client ID & Secret to `.env.local`

2. **Supabase Dashboard** → Authentication → Providers → Google
   - Enable Google provider
   - Paste Client ID & Secret
   - Save

---

## 📧 Email Setup (Gmail SMTP)

1. Go to your Google account: [myaccount.google.com](https://myaccount.google.com)
2. Turn on **2-Step Verification** (required before App Passwords are available)
3. Open **Security → App passwords** and create a new app password
4. Copy the generated 16-character password
5. Add `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, and `GMAIL_FROM_NAME` to `.env.local`

**Emails sent:**
- Order confirmation (HTML receipt) after checkout
- Newsletter subscription confirmations

---

## 🏗 Build & Deploy

### Local Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add all environment variables in Vercel dashboard
4. Deploy
5. Update Google OAuth redirect URI with your Vercel URL

### Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add all from `.env.local`.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (webpack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📱 Mobile App (Expo)

A full shop experience for iOS & Android lives in [`mobile/`](mobile/README.md):

- **Shop / Cart / Account** native tabs with a live cart badge
- Browse products, product detail, cart, checkout → posts to the web app's
  `/api/checkout` (guest checkout included), newsletter via `/api/newsletter`
- Email/password auth + Google OAuth via deep links, order history — all backed
  by the same Supabase project and RLS policies
- Cart & session persisted with `expo-sqlite`'s localStorage

```bash
npm run dev            # terminal 1: web app = the mobile backend
cd mobile && npm install
npx expo start         # terminal 2: scan the QR with Expo Go
```

Setup details (env vars, Supabase redirect URLs `stage2shop://**` / `exp://**`,
EAS builds, App Store Guideline 4.8 note) → **[mobile/README.md](mobile/README.md)**.

Quality gates: `npx expo lint` · `npx tsc --noEmit` · `npx expo-doctor`

---

## 🎨 UI/UX Design Reference

Design inspired by **[sliderpals.com](https://www.sliderpals.com)**:
- Clean, playful aesthetic
- Card-based product grids
- Slide-out cart drawer
- Consistent spacing & typography
- Subtle hover/tap interactions
- Accessible color contrast

---

## 🔒 Security Features

- **Row Level Security (RLS)** on all Supabase tables
- **Server-side auth validation** via middleware
- **Price verification** on checkout (prevents tampering)
- **Stock validation** before order creation
- **Service role key** only used server-side
- **Environment variables** for all secrets

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] Home page loads with featured products
- [ ] `/products` displays all products with filters
- [ ] Product detail page shows images, description, add-to-cart
- [ ] Cart drawer opens, updates quantities, persists on refresh
- [ ] Checkout form validates required fields
- [ ] Order creates in Supabase (`orders` + `order_items`)
- [ ] Stock decrements in `products` table
- [ ] Confirmation email sent via Gmail SMTP
- [ ] Google Sign In works (login + signup)
- [ ] `/account` shows order history for logged-in user
- [ ] Newsletter signup works
- [ ] Mobile responsive (test Chrome DevTools device toolbar)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Supabase** - Backend-as-a-service
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Simple state management
- **Lucide** - Beautiful icons
- **Unsplash** - Placeholder product images
- **sliderpals.com** - UI/UX inspiration

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/stage-2-shop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/stage-2-shop/discussions)
- **Email**: support@yourdomain.com

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
