# SariSariPOS - Tindahan POS (Sari-Sari Store POS)

Offline-first PWA para sa sari-sari store sa Pilipinas. Benta in 2 taps, kita agad, utang tracked per customer. Works 100% offline sa phone browser.

> Built for tindera/tindero (35-65yo, Android phone only, 50-150 SKUs). No GCash, no barcode, no login for v1 - para mabilis ibenta sa 1 store at kumita ₱99-299/month via GCash/Maya manual subscription sa v2.

## Live Demo
- Dev: `http://localhost:5177` (after `npm run dev`)
- Production: deploy `dist/` to Vercel (see Deploy section)

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS 4 + Dexie.js (IndexedDB) + dexie-react-hooks
- react-router-dom (bottom tab nav)
- vite-plugin-pwa (offline, manifest `SariSariPOS`, theme #7c3aed)

## Quick Start

```bash
cd SariSariPOS
npm install
npm run dev      # open http://localhost:5177
npm run build    # builds + generates sw.js, manifest
npm run preview  # preview production build on http://localhost:4173
```

No backend, no env vars. Data stored in IndexedDB on device (offline-first).

## Core User Journey
1. Tindera adds paninda: name, presyo, puhunan, stock, threshold (tubo auto = presyo - puhunan)
2. Benta: tap product → add to cart → adjust qty → choose Cash/Utang → if Utang, type customer name → `Benta ₱X` → stock deducts atomically, utang balance updates
3. Dashboard: see `Benta Ngayon`, `Tubo`, `Utang Ngayong Araw`, `Kabuuang Utang`, 7-day history, `Paubos na!` count
4. Utang: list per customer with balance, tap → detail (benta list + bayad history) → `Bayad` partial/full with `Sobra sa utang` validation
5. Export: Dashboard → `Export CSV` downloads `sari-sari-YYYY-MM-DD.csv` (products + sales + customers + payments) for backup

## Spec → Plan → Tasks → Implement
- `specs/001-core-mvp/spec.md` — 6 must-haves (Paninda, Benta, Utang, Dashboard, Paubos, Offline)
- `specs/001-core-mvp/plan.md` — data model (products, sales, customers, payments), offline PWA architecture
- `specs/001-core-mvp/tasks.md` — 7 atomic tasks

## Verification (Task 7 Checklist - All Pass)
Tested live in browser (Chrome, mobile viewport, Playwright):

- [x] **Paninda**: Add `Coke Mismo ₱15/₱12 stock 24` → shows `Tubo ₱3.00`; edit stock 3 threshold 5 → `Paubos na!` red badge; search `Coke` filters; `Lagyan ng pangalan` validation; reload persists (IndexedDB)
- [x] **Benta**: Add 2 Coke → `Cart (2) ₱30` → `Benta ₱30 Cash` → stock 24→22; `Kulang sa stock` blocks over-qty; `Wala ng stock` when 0; utang `Test Item ₱50` to `Juan Dela Cruz` creates customer
- [x] **Dashboard**: After 2 cash + 1 utang (total ₱83, tubo ₱15, utang ₱45, 3 transaksyon) dashboard shows exactly those numbers; low-stock count matches; 7-day `Ngayon: 3 benta Utang ₱15 → ₱90` etc; `Export CSV` downloads
- [x] **Utang**: `Juan ₱50` → pay ₱30 → balance ₱20; `Sobra sa utang` blocks overpay ₱30 on ₱20; total `₱65→₱35`; detail shows sales + payments history
- [x] **PWA Offline**: `npm run build` generates `dist/sw.js`, `workbox-*`, `manifest.webmanifest` (PWA precache 8 entries); empty states `Wala pang paninda + 3 samples`, `Walang utang 🎉`, `Walang laman ang cart`; data survives close/reopen; sale works offline-like (IndexedDB); `Paubos na!` badge on Paninda and Dashboard
- [x] **Full Journey (5 products → 2 cash +1 utang → dashboard → partial pay → low-stock → CSV → reload)**: All 11/11 checks passed (see `specs/001-core-mvp/tasks.md:43` Task 7)

## Project Structure
```
SariSariPOS/
├── AGENTS.md
├── specs/001-core-mvp/{spec.md,plan.md,tasks.md}
├── src/
│   ├── db/{db.ts, productService.ts, saleService.ts, customerService.ts}
│   ├── utils/currency.ts (formatPeso, calcTubo)
│   ├── components/{BottomNav.tsx, ProductCard.tsx, ProductFormModal.tsx}
│   ├── pages/{Dashboard.tsx, Paninda.tsx, Benta.tsx, Utang.tsx}
│   └── hooks/useDailyTotals.ts
├── public/favicon.svg
├── vite.config.ts (PWA manifest: SariSariPOS, #7c3aed, fil-PH)
└── dist/ (after build)
```

## Deploy to Vercel (Free)
1. Push to GitHub: `git init; git add .; git commit -m "feat: sari-sari POS MVP"; git push`
2. Vercel → New Project → Import repo → Framework: Vite → Build `npm run build` → Output `dist` → Deploy
3. No env vars, static PWA. Or `vercel --prod` via CLI.
4. Share link to 1 sari-sari store: `https://your-app.vercel.app` → Add to Home Screen (1 tap, works offline after first load)

## Selling to a Store (Your Next Step)
1. Visit 5 sari-sari stores near you, ask: "Ano problema sa listahan/utang?"
2. Demo on your phone: show `Benta` 2 taps, `Dashboard` tubo, `Utang` per customer
3. Offer: "Free trial 7 days, ako mag-setup ng paninda mo, ₱99/month via GCash after"
4. On success, collect GCash monthly, note feedback for v2 (GCash integration, cloud sync)

## For Interviews (Explain Every Line)
- `src/db/db.ts:1` - Dexie schema, 4 tables, offline 50MB+ vs localStorage 5MB
- `src/db/saleService.ts:1` - `createSale()` transaction: validate stock, deduct, update customer, insert sale atomically
- `src/utils/currency.ts:1` - `formatPeso` 2 decimals, `calcTubo` = price-cost

## Out of Scope (v2)
- Barcode, GCash/Maya payment, cloud sync, multi-store, auth, printer - kept out to ship in days

## Tested
- Chrome desktop + Android phone viewport (480px), Playwright, Vitest ready, offline-first
