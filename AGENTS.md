# Project Constitution

## Stack
- Language: TypeScript
- Framework: Vite + React (PWA, mobile-first)
- Database: IndexedDB via Dexie.js (offline-first) + localStorage fallback, no backend for v1
- Hosting/Deployment: Vercel (static PWA) + optional Firebase later
- AI Tools: OpenCode, Muse Spark

## Conventions
- Naming: camelCase for variables/functions, PascalCase for components, kebab-case for files
- File structure: /src/components, /src/pages, /src/db, /src/hooks, /src/utils, /specs
- Testing framework & requirements: Vitest + React Testing Library, verify every task manually in browser
- Error handling pattern: Try/catch with user-friendly Tagalog/English messages, never crash silently, validate all inputs before save
- State management approach: React useState/useEffect + Dexie liveQuery for DB reactivity, no Redux for v1

## Rules (AI must obey)
- Do not add new dependencies without asking
- Do not rewrite existing working code without justification
- Do not generate placeholder/fake data in production paths (use real empty states)
- All generated code must include error handling and input validation
- Mobile-first, must work on phone browser, offline-first (sari-sari stores have unstable internet)
- All money values in PHP (₱) with 2 decimals, all text supports Tagalog + English
- Never delete user sales data, always confirm before delete

## Out of Scope (for this project)
- Barcode scanning hardware integration (v2)
- GCash/Maya online payments (v2, manual cash only for v1)
- Multi-store sync / cloud backend (v2)
- Printer receipt hardware (v2 - v1 exports PDF/image)
- User authentication / multi-user roles (v1 is single store, single device)

## Process
This project follows the Spec -> Plan -> Tasks -> Implement loop defined in the workspace AGENTS.md.
