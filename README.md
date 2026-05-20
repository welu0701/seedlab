# SeedLab 🌱

A household garden management app for tracking raised beds, hydroponic systems, and seed germination trays.

## Features

- **Raised Beds** — Configurable grid layout, per-cell plant tracking with status (growing, ready to harvest, needs trim, died)
- **Hydroponics** — Numbered slot management with nutrient refill alerts
- **Seed Lab** — Germination tray tracker with automatic "ready to move" detection
- **Vegetable Catalog** — Shared library with germination and harvest day targets
- **Shared household** — Both you and your partner see and edit the same garden data via individual accounts

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (includes `npm`)
- A free [Supabase](https://supabase.com/) account

---

## Local Setup

### 1. Install Node.js

Download and install from [nodejs.org](https://nodejs.org/) (choose the LTS version).

Verify it works:
```bash
node --version   # should print v18 or later
npm --version
```

### 2. Clone the repo

```bash
git clone https://github.com/welu0701/seedlab.git
cd seedlab
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up Supabase

1. Go to [supabase.com](https://supabase.com/) and create a free account
2. Click **New project** — give it a name (e.g. `seedlab`) and a database password
3. Once the project is ready, go to **SQL Editor** → **New query**
4. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**
5. Go to **Project Settings** → **API** and copy:
   - `Project URL`
   - `anon / public` key

### 5. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173/seedlab/](http://localhost:5173/seedlab/) in your browser.

---

## First-time use

1. **Sign up** with your email and password
2. **Create a household** — give it a name (e.g. "The Weber Garden")
3. Your household gets a **6-character invite code** visible in Settings
4. Your partner signs up with their own account and enters the invite code to join

---

## Inviting your partner

Once you have a household, your partner can join by:
1. Creating their own account at the app URL
2. Entering the invite code shown on your dashboard

---

## Deploying to GitHub Pages

```bash
npm run deploy
```

This builds the app and pushes it to the `gh-pages` branch. Then in your GitHub repo:
- Go to **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: `gh-pages` / `/ (root)`

Your app will be live at `https://welu0701.github.io/seedlab/`

> **Note:** GitHub Pages hosts static files only — Supabase handles all the data. You'll need to add your production Supabase keys to a GitHub Actions secret if you want to automate deploys, or just run `npm run deploy` locally.

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Backend | Supabase (Postgres + Auth) |
| Date math | date-fns |
| Notifications | Sonner |
| Icons | Lucide React |
