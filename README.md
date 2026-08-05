<div align="center">

  <h1>🔑 QuickVault</h1>
  <p><strong>Your Personal Quick-Copy Vault & Digital Contact Card</strong></p>

  <p>
    QuickVault eliminates the friction of hunting down your GitHub links, portfolios, LinkedIn handles, emails, and bio snippets for instant one-tap copying anywhere.
  </p>

</div>

---

## ✨ Features

- ⚡ **One-Tap Clipboard Copying**: Copy any saved link, handle, or text snippet to your clipboard with a single tap.
- 🤖 **Smart Auto-Type Detection**: Paste any URL or handle and QuickVault automatically recognizes patterns (GitHub, LinkedIn, Email, Phone, Web Links) to assign icon badges and pre-fill label names.
- 🔒 **High-Visibility Red Security Warning**: Active risk engine discouraging password/secret storage with prominent warning alerts (`#EB3B5A`).
- 📱 **QR & Public Share Mode**: Generate a shareable URL (`/share/:slug`) and downloadable `.PNG` QR code to use as a modern digital business card.
- 🔑 **Granular Entry Privacy**: Check `🔒 Keep Private` on individual entries so they stay hidden even when your vault is public.
- 🛑 **Instant Revocation**: Click "Stop Sharing" anytime to immediately break the link and return a 404/Revoked state.
- 🌗 **Sunset Light & Dark Mode**: Curated HSL color palette with ambient radial mesh glow and a seamless navbar theme switcher.
- ☁️ **Supabase Cloud Persistence**: Full PostgreSQL integration backed by Row-Level Security (RLS) policies ensuring strict user data isolation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS with custom tokens, glassmorphism, responsive grid & flexbox
- **Icons**: Lucide React + custom inline SVGs
- **Backend & Database**: Supabase (PostgreSQL, Auth, Row-Level Security)
- **Utilities**: `qrcode` client-side canvas generation

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have Node.js (v18+) installed on your machine.

### 2. Clone the Repository

```bash
git clone https://github.com/Ashpat007/QuickVault.git
cd QuickVault/web
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Supabase Credentials

Copy `.env.example` to `.env` inside the `web/` folder:

```bash
cp .env.example .env
```

Add your Supabase project credentials in `web/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Note: If no Supabase credentials are provided, QuickVault automatically runs in an out-of-the-box **Local Demo Mode** using `localStorage`)*

### 5. Setup Database Schema & Security Rules

1. Open your Supabase project dashboard → **SQL Editor**.
2. Run the SQL script found in [`supabase/schema.sql`](../supabase/schema.sql) to create the `sets` and `entries` tables with RLS policies.

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

---

## 📁 Project Structure

```
QuickVault/
├── supabase/
│   └── schema.sql              # Supabase Postgres database schema & RLS policies
├── web/
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── assets/             # Brand logos & graphics
│   │   ├── components/         # React components (Auth, VaultList, EntryRow, Modals, EmptyState)
│   │   ├── lib/                # Supabase client integration & regex type detector
│   │   ├── pages/              # Public share route page (/share/:slug)
│   │   ├── App.jsx             # Main application entry point & theme state
│   │   └── index.css           # Global design system & theme CSS variables
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
