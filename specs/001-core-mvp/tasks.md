# Tasks: Sari-Sari Store POS - Core MVP

Tasks are ordered by dependency. Implement one at a time and verify before moving on.

## Task 1: Project Scaffolding + Core Infrastructure
- **Inputs:** `specs/001-core-mvp/plan.md`, `AGENTS.md`
- **Outputs:** Vite+React+TS project, Tailwind configured, React Router with 4 tab layout (Dashboard/Paninda/Benta/Utang), Dexie DB file created with 4 tables, `utils/currency.ts` with formatPeso, bottom nav component, empty pages for each route
- **Verification:** `npm run dev` runs without errors, visit http://localhost:5173 shows 4 tabs navigating, IndexedDB "SariSariPOS" appears in DevTools > Application > IndexedDB with 4 stores, `formatPeso(150)` returns "₱150.00" in console

## Task 2: Product Inventory (Paninda) - Data + CRUD
- **Inputs:** `src/db/db.ts` from Task 1, `spec.md F1`
- **Outputs:** `src/db/productService.ts` (add/update/archive with validation), `src/pages/Paninda.tsx` + `ProductCard.tsx` + `ProductFormModal.tsx` (name, price, cost, stock, category, threshold), search + category filter + Paubos toggle, low-stock red highlight
- **Verification:** Add "Coke Mismo" price ₱15 cost ₱12 stock 24 → appears in grid with tubo ₱3, edit to stock 3 with threshold 5 → shows "Paubos na!" red badge, search "Coke" filters correctly, refresh browser → data persists, try empty name → shows "Lagyan ng pangalan" error

## Task 3: POS Sales (Benta) - Cart & Stock Deduction
- **Inputs:** `src/db/db.ts` + products from Task 2, `spec.md F2`
- **Outputs:** `src/db/saleService.ts` with `createSale()` transaction (validate stock, deduct stock, insert sale, compute profit), `src/pages/Benta.tsx` (product grid tap to add, cart bottom sheet with qty +/- , total, Cash/Utang toggle, "Benta ₱X" button), `src/hooks/useDailyTotals.ts`
- **Verification:** With Coke stock 24, tap product, set qty 2, press Benta ₱30 (Cash) → sale saved in sales table, stock becomes 22, try to add qty 30 when stock 22 → button disabled "Kulang sa stock", dashboard daily benta updates, refresh → stock remains 22

## Task 4: Dashboard - Daily Tubo & History
- **Inputs:** `src/db/saleService.ts` from Task 3, `spec.md F4 + F5`
- **Outputs:** `src/pages/Dashboard.tsx` (today cards: Benta, Tubo, Utang Total, Transactions, Paubos count), 7/30 day history list (date | benta | tubo | utang), low-stock summary section linking to Paninda, CSV export button
- **Verification:** Make 3 sales today ₱150 revenue/₱40 tubo (1 utang ₱50) → Dashboard shows exactly "Benta: ₱150.00 | Tubo: ₱40.00 | Utang: ₱50.00 | 3 transaksyon", low-stock count matches Task 2, export CSV downloads file with products+sales, date grouping correct for yesterday vs today

## Task 5: Utang Tracking (Listahan) - Customers & Payments
- **Inputs:** `src/db/db.ts` + `saleService.ts` from Task 3, `spec.md F3`
- **Outputs:** `src/db/customerService.ts` (create customer, add payment, balance validation), updated Benta flow to support Utang (customer select/input), `src/pages/Utang.tsx` (customer list with balance, tap → detail: sales + payments + "Bayad" input with validation), total utang header
- **Verification:** Sell ₱50 as utang to "Aling Nena" → Utang page shows Aling Nena balance ₱50, total utang ₱50, add payment ₱30 → balance ₱20, try overpay ₱30 when balance ₱20 → "Sobra sa utang" error, cash sales do NOT affect utang list, payments history shows dates

## Task 6: PWA Offline + Data Safety & Polish
- **Inputs:** All previous tasks, `spec.md F6` + Edge Cases
- **Outputs:** `vite-plugin-pwa` configured (manifest: name "SariSariPOS", themeColor, icons), service worker caching app shell, empty states ("Wala pang paninda" + big + button + "Magdagdag ng sample" 3 items), delete confirmations ("May benta na ito, i-archive?"), storage quota handling, Tagalog error toasts throughout, mobile responsiveness polish (44px touch targets)
- **Verification:** Build `npm run build && npm run preview` → Lighthouse PWA score ≥90, disconnect wifi → refresh → app still loads and can make sale, clear? No data loss test: add data, close tab, reopen → data present, empty state shows correctly on fresh IndexedDB delete, all validation messages in Tagalog/English

## Task 7: Final Verification & Deployment Prep
- **Inputs:** All tasks 1-6 completed
- **Outputs:** README with setup + demo instructions, seeded demo data script, Vercel deploy config, final manual QA checklist passed
- **Verification:** Run full user journey: (1) Add 5 products → (2) Make 2 cash sales → (3) Make 1 utang sale → (4) Check dashboard totals correct → (5) Mark partial utang payment → (6) Verify low-stock alert → (7) Export CSV → (8) Test offline → All 6 spec acceptance criteria pass, app ready to show to 1 real sari-sari store for 7-day trial
