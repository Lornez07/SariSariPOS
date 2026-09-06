# Plan: Sari-Sari Store POS - Core MVP

## Architecture
- **Type:** Offline-first Progressive Web App (PWA), single-page app, no backend server for v1
- **High-level structure:**
  ```
  Phone Browser (PWA)
  ├── React App (Vite)
  │   ├── Pages: Dashboard | Paninda (Inventory) | Benta (POS) | Utang (Credit) | History
  │   ├── Components: ProductCard, Cart, UtangCard, DashboardStats, LowStockBadge
  │   ├── Hooks: useLiveQuery (Dexie), useDailyTotals
  │   └── Utils: currency.js (₱ format), calculations (tubo = price-cost)
  ├── Storage Layer
  │   ├── Dexie.js → IndexedDB (primary) - products, sales, customers, payments
  │   └── localStorage fallback + CSV export/import
  └── Service Worker (vite-plugin-pwa) - cache app shell for offline load
  ```
- **Component relationships:** Pages read/write via Dexie liveQuery (reactive). Sale transaction = atomic Dexie transaction: deduct stock + insert sale + update/insert customer balance. Dashboard aggregates sales by date in-memory (last 30 days is small data).
- **Routing:** React Router, bottom tab nav (mobile thumb-friendly) - 4 tabs: Dashboard, Paninda, Benta, Utang

## Data Model

### Entities
```typescript
// products table
Product {
  id: string (uuid)
  name: string (max 50, required)
  category: string (e.g., "Softdrinks", "Snacks", "Canned", "Load", "Bigas" | custom)
  price: number (>=0, 2 decimals) // presyo benta
  cost: number (>=0, 2 decimals)  // puhunan
  stock: number (integer >=0)
  lowStockThreshold: number (integer >=0, default 5)
  isArchived: boolean (soft delete)
  createdAt: Date, updatedAt: Date
}

// sales table (each transaction)
Sale {
  id: string (uuid)
  items: SaleItem[] // snapshot at time of sale
  totalRevenue: number
  totalProfit: number // sum((price-cost)*qty)
  paymentType: 'cash' | 'utang'
  customerId?: string // if utang
  customerName?: string // denormalized for quick display
  createdAt: Date
}
SaleItem {
  productId: string
  name: string // snapshot
  price: number
  cost: number
  qty: number
  subtotal: number
}

// customers table (utang per person)
Customer {
  id: string (uuid)
  name: string (unique, required)
  balance: number (>=0, current utang total)
  createdAt: Date, updatedAt: Date
}

// payments table (utang payments history)
Payment {
  id: string (uuid)
  customerId: string
  amount: number (>0, <= balance at time)
  createdAt: Date
}
```

### Storage Approach
- **Dexie.js schema v1:** `products: 'id, name, category, isArchived'`, `sales: 'id, createdAt, paymentType, customerId'`, `customers: 'id, name'`, `payments: 'id, customerId, createdAt'`
- **No backend v1:** All data local to device. Meets offline-first and zero hosting cost. v2 can add Firebase Supabase sync.
- **Data safety:** Dexie transactions ensure atomicity. On storage quota error, catch and prompt export CSV.

## API / Interface Design

No REST API for v1 (local DB). Key function signatures (src/db & src/utils):

```typescript
// db.ts
db.products.add(product): Promise<string>
db.products.update(id, changes): Promise<number>
db.products.where('isArchived').equals(0).toArray()

// saleService.ts
createSale(items: CartItem[], paymentType: 'cash'|'utang', customerName?: string): Promise<Sale>
// - validates stock >= qty, else throw "Kulang sa stock: {name}"
// - in transaction: decrement products.stock, add Sale, update Customer.balance
addUtangPayment(customerId: string, amount: number): Promise<void>
// - validates amount <= balance, else throw "Sobra sa utang"

getDailyTotals(date: Date): Promise<{revenue, profit, transactionCount, utangTotal}>
getLowStockProducts(): Promise<Product[]>
exportToCSV(): Promise<string> // products + sales
```

### UI Interface
- **Dashboard:** Cards: "Benta Ngayon ₱X", "Tubo ₱Y", "Utang Lahat ₱Z", "Paubos: N items" + 7-day list (date | benta | tubo)
- **Paninda:** Grid of ProductCard (name, price, stock bar, tubo badge), + button -> Add/Edit modal, search + category filter, Paubos toggle
- **Benta:** Product grid (tap to add), Cart bottom sheet (qty +/- , total, toggle Cash/Utang, if Utang -> customer select/input), "Benta ₱X" button disabled if cart empty or stock insufficient
- **Utang:** Customer list (name | balance | last transaction), tap -> detail (sales list + payments list + "Bayad" input), total utang header
- **Common:** BottomNav, currency formatter `formatPeso(150) => "₱150.00"`, Tagalog error toasts

## Dependencies
- **Core:** `react@18`, `react-router-dom`, `dexie`, `dexie-react-hooks`, `vite`, `typescript`
- **UI:** `tailwindcss` (rapid mobile styling), `lucide-react` (icons), `sonner` or custom toast
- **PWA:** `vite-plugin-pwa` + `workbox-window` (offline cache)
- **Utils:** `uuid` (or crypto.randomUUID), `date-fns` (date grouping)
- **Dev:** `vitest`, `@testing-library/react`, `eslint`
- **No external APIs for v1** - eliminates PAGASA/internet dependency risks. Currency/price is manual input.

## Risks
| Risk | Mitigation |
|------|------------|
| **Data loss if user clears browser data** | Prominent "Export CSV" button on Dashboard + Settings; warn on first use: "Huwag i-clear ang browser data"; v2 will add cloud backup |
| **Tindera not tech-savvy, app too complex** | 2-tap sale flow, large buttons (min 44px), Tagalog labels, empty states with + button, test with real tindera, limit categories to dropdown |
| **Stock goes negative on race condition** | Dexie transaction with validation inside transaction; UI disables + button when qty == stock |
| **Phone storage quota exceeded** | Catch QuotaExceededError, prompt export + delete old sales (>30 days) option, keep sales lightweight (no images) |
| **No internet = PWA not installable first time** | App is static site on Vercel, loads once then cached; instruct to "Add to Home Screen" while online once |
| **Utang balance drift (bug)** | Balance is computed as sum(utang sales) - sum(payments) on recalc function + nightly reconcile check on app start |
| **Performance with many sales (1000+)** | Index on createdAt, paginate history (20 per page), dashboard aggregates only last 30 days in-memory |

## Stack Justification
- **Why Vite+React vs Next.js:** No SSR needed (offline POS), Vite is faster dev, smaller bundle for slow PH mobile data. Next.js adds server complexity we don't need for v1 static PWA.
- **Why Dexie/IndexedDB vs localStorage vs Firebase:** localStorage is 5MB limit + synchronous (blocking). Firebase requires internet + cost + auth complexity. Dexie gives 50MB-1GB, async, indexed queries, offline-first, zero cost, perfect for sari-sari store with unstable internet. Matches AGENTS.md offline-first rule.
- **Why Tailwind:** Rapid mobile-first styling, consistent spacing, no CSS file bloat - critical for vibe coder to iterate quickly with AI. Alternative (plain CSS) slower.
- **Why PWA vs Native Android:** Native requires Android Studio + Play Store + APK install friction for tindera. PWA = open link, "Add to Home Screen" in 5 seconds, works on any Android/iPhone browser, zero install barrier, instant updates via Vercel deploy. Aligns with user's VS Code/web skills.
- **Why TypeScript:** Catches price/cost/stock type errors at build time, prevents silent ₱ bugs. Essential for money calculations.
