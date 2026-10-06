# QuickVault Web Frontend

The modern React application frontend for **QuickVault** — your personal quick-copy info vault & digital business card.

## 🚀 Features

- ⚡ **1-Tap Clipboard Copying**: Instant copy for recurring handles, links, and snippets.
- 🤖 **Smart Type Auto-Detection**: Instant regex classification for GitHub, LinkedIn, Email, Phone, and Web Links.
- 🔒 **Granular Entry Privacy**: Toggle `🔒 Keep Private` per entry to exclude sensitive links from public share cards.
- 📤 **RFC 4180 CSV Import/Export**: Secure CSV export with formula injection sanitization and full multiline note support.
- 📱 **QR & Public Share Cards**: Shareable public cards accessible via unguessable 21-character base62 nanoIDs (`/share/:slug`).
- ☁️ **Dual-Mode Engine**: Automatic seamless switching between local `localStorage` demo mode and Supabase PostgreSQL with strict RLS policies.

## 🛠️ Scripts

- `npm run dev`: Starts local Vite development server on `http://127.0.0.1:5173/`.
- `npm test`: Runs Vitest test suites (25+ tests covering auth, smart autofill, rate limiting, and CSV round-trips).
- `npm run build`: Compiles production distribution to `dist/`.
- `npm run preview`: Previews built production distribution locally.
