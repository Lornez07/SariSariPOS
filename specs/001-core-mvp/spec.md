# Spec: Sari-Sari Store POS - Core MVP

## Problem Statement
Sari-sari store owners in the Philippines track inventory, sales, and customer utang (credit) using pen and paper. This causes: (1) lost profit from not knowing what sold vs expired, (2) forgotten utang that never gets collected (₱500-₱2000/month lost), (3) no daily profit visibility, (4) stockouts of bestsellers because low-stock is not noticed. Existing POS systems are too expensive (₱10k+), require internet, and are too complex for tindera/tindero who often are 40-60 years old and use only a phone.

## Target User
Primary: Sari-sari store owner (nanay/tatay/tindera) in the Philippines, 35-65 years old, uses Android phone, not tech-savvy, manages store alone, sells 50-150 SKUs (snacks, canned goods, softdrinks, load). Secondary: Store helper / family member who does the listing.

## Core User Journey (one sentence)
Tindera can record a sale in 2 taps, see daily tubo (profit) instantly, and track utang per customer so that she knows exactly how much she earned and who still owes her.

## Success Metrics
- Sale recorded in ≤ 5 seconds (2 taps after opening app)
- Daily profit visible on home screen without scrolling
- Utang balance per customer accurate to centavo
- Works 100% offline after first load (PWA), data never lost on refresh
- Tested by 1 real sari-sari store for 7 days with feedback

## Features: Must-Have (v1)

- [ ] **F1 - Product Inventory (Paninda)** — Add/edit/delete products with name, presyo (price), puhunan (cost), stock, category, low-stock threshold
  - Acceptance: Given store has no products When tindera adds "Coke Mismo" with price ₱15, cost ₱12, stock 24 Then product appears in list, stock = 24, tubo per item = ₱3 is calculated and visible

- [ ] **F2 - Quick POS (Benta)** — Tap product to add to cart, adjust qty, see total, complete sale which deducts stock and records profit
  - Acceptance: Given "Coke Mismo" stock 24 When tindera taps it, sets qty 2, and presses "Benta ₱30" Then sale saved, stock becomes 22, sales log shows ₱30 revenue / ₱6 tubo, daily total updates

- [ ] **F3 - Utang / Credit Tracking (Listahan)** — Record sale as utang to customer, track balance per customer, mark as paid (partial/full), history per customer
  - Acceptance: Given customer "Aling Nena" has 0 balance When tindera sells ₱50 as utang to her Then Aling Nena balance = ₱50, total utang increases by ₱50. When she pays ₱30 Then balance = ₱20 and payment is logged

- [ ] **F4 - Daily Sales & Tubo Dashboard** — Home screen shows today: total benta, tubo, number of transactions, utang total; history by day (last 7/30 days)
  - Acceptance: Given 3 sales today totaling ₱150 revenue / ₱40 tubo and ₱50 utang When tindera opens app Then dashboard shows "Benta: ₱150 | Tubo: ₱40 | Utang: ₱50" accurately

- [ ] **F5 - Low-Stock Alert (Paubos na)** — Products at or below threshold are highlighted on inventory and dashboard, count of low-stock items visible
  - Acceptance: Given Coke threshold=5 and stock=3 When viewing inventory Then Coke card is highlighted red with "Paubos na!" and dashboard shows "3 items paubos"

- [ ] **F6 - Data Persistence Offline** — All data stored in IndexedDB on device, survives refresh/close, works without internet, export to CSV option
  - Acceptance: Given tindera adds products and sales offline When she closes browser and reopens Then all data still present, no data loss

## Features: Out of Scope (NOT v1)
- Barcode scanner / hardware printer / receipt printer
- GCash/Maya payment integration (cash only for v1)
- Cloud sync / multi-device / multi-store / login system
- Barcode scanning (manual add only)
- User authentication / roles (single user per device)
- Supplier / purchase order management
- Expense tracking beyond puhunan
- Sales analytics charts beyond daily totals

## Edge Cases & Error States
- Invalid input: Price, cost, stock must be ≥0; name required, max 50 chars; qty cannot exceed stock; show Tagalog error: "Lagyan ng pangalan" / "Kulang ang stock"
- Dependency fails: No internet = app still works fully (offline-first). IndexedDB fails = fallback to localStorage with warning, never lose sale in progress
- First use (empty state): Show friendly empty state with "Wala pang paninda - Magdagdag ng unang produkto" + big + button + 3 sample products option
- Stock negative prevention: Cannot sell more than stock, button disabled with "Kulang sa stock" message
- Delete product with sales history: Soft delete (hide but keep history) or block delete with "May benta na ito, i-archive na lang?" confirmation
- Utang overpay: Cannot pay more than balance, show "Sobra sa utang" error
- Browser storage full: Show warning and offer CSV export + clear old data
