# DIFAE AI Monorepo

This Turbo + PNPM workspace contains the DIFAE AI marketing site, admin panel, and shared UI library.

## Apps

- `apps/web` – Customer-facing marketing experience built with Next.js App Router.
- `apps/admin` – Admin console for content and operations teams.
- `packages/ui` – Shared component system, theme tokens, and auth utilities.

## Getting started

### Prerequisites

- Node.js 20+
- PNPM 9 (`corepack enable pnpm`)

### Installation

```bash
pnpm install
```

### Local development

Run both apps in parallel:

```bash
pnpm dev
```

Or run a single app:

```bash
pnpm dev:web
pnpm dev:admin
```

### Build & tests

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Environment variables

Create a `.env` file in each app (see `.env.example` below) and supply your Firebase project credentials plus GA4 ID.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GA4_ID=
```

## Deploy

The repository is set up for Firebase Hosting multi-site deployments (web + admin). Configure GitHub Actions secrets with Firebase tokens, then push to `main` to trigger CI/CD.

## Admin CMS workflow

- Use the admin console to manage plans, testimonials, partner logos, FAQs, and blog posts.
- The marketing site consumes Firestore collections and Storage assets surfaced through the admin screens once Firebase keys are provided.

## Demo accounts

Create admin and agent accounts via Firebase Auth, then assign roles in Firestore (`users` collection) to unlock protected routes.
