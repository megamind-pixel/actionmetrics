# ActionMetrics — Kenya Education Platform

Full production-grade stack as per architecture diagram:

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State    | Zustand (auth) + React Query (server state) |
| Charts   | Recharts |
| Forms    | React Hook Form + Zod |
| Backend  | Node.js + Express + TypeScript |
| ORM      | Prisma |
| Database | PostgreSQL (Supabase-ready) |
| Auth     | JWT + bcrypt, role-based (SUPER / ADMIN / VIEWER) |

---

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ (or a free Supabase project)

---

### 1 — Database

#### Option A: Local PostgreSQL
```bash
psql -U postgres -c "CREATE DATABASE actionmetrics;"
```
Set `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/actionmetrics"
```

#### Option B: Supabase (recommended for deployment)
1. Create a free project at https://supabase.com
2. Copy the **Connection string** (Settings → Database → URI)
3. Paste it as `DATABASE_URL` in `backend/.env`

---

### 2 — Backend

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, etc.

# Run Prisma migration (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the first SUPER admin account
npm run db:seed
# → creates admin@actionmetrics.ke / Admin1234!

# Start dev server
npm run dev
# → API running at http://localhost:4000
```

---

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

Open http://localhost:5173 and sign in with:
- **Email:** admin@actionmetrics.ke
- **Password:** Admin1234!

---

## Project Structure

```
actionmetrics/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        ← DB schema (4 models + enums)
│   ├── src/
│   │   ├── index.ts             ← Express app entry
│   │   ├── lib/
│   │   │   ├── prisma.ts        ← Prisma singleton
│   │   │   ├── auth.ts          ← JWT / bcrypt / normalise helpers
│   │   │   └── seed.ts          ← First admin seed script
│   │   ├── middleware/
│   │   │   └── index.ts         ← authenticate, requireRole, validate, errorHandler
│   │   ├── routes/
│   │   │   ├── auth.ts          ← Login, register, admins
│   │   │   ├── institutions.ts
│   │   │   ├── students.ts
│   │   │   ├── results.ts       ← Single + bulk CSV upload
│   │   │   └── analytics.ts     ← Overview, levels, institutions, subjects, trends, individual
│   │   ├── schemas/index.ts     ← Zod schemas
│   │   └── types/index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx              ← Router + QueryClient
    │   ├── index.css            ← Tailwind + component classes
    │   ├── lib/
    │   │   ├── api.ts           ← Axios + JWT interceptor + auto-logout
    │   │   └── utils.ts         ← fmt, grade, levelColor, initials…
    │   ├── store/
    │   │   └── auth.ts          ← Zustand auth store (persisted)
    │   ├── hooks/
    │   │   └── useApi.ts        ← All React Query hooks
    │   ├── types/index.ts
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx
    │   │   ├── layout/
    │   │   │   ├── Layout.tsx   ← Sidebar + Outlet
    │   │   │   └── PageHeader.tsx
    │   │   └── ui/index.tsx     ← Spinner, Empty, Alert, StatCard, Modal, Field, GradePill
    │   └── pages/
    │       ├── auth/LoginPage.tsx
    │       ├── OverviewPage.tsx
    │       ├── institutions/InstitutionsPage.tsx
    │       ├── students/StudentsPage.tsx
    │       ├── results/ResultsPage.tsx
    │       ├── individual/IndividualPage.tsx
    │       ├── analytics/AnalyticsPage.tsx
    │       ├── reports/ReportsPage.tsx
    │       └── settings/SettingsPage.tsx
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## API Reference

All routes require `Authorization: Bearer <token>` except `/api/auth/login`.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/auth/me | any | Current admin profile |
| POST | /api/auth/register | SUPER | Create admin |
| GET | /api/auth/admins | SUPER | List all admins |
| DELETE | /api/auth/admins/:id | SUPER | Remove admin |
| GET | /api/institutions | any | List with student count + avg |
| POST | /api/institutions | ADMIN | Create |
| DELETE | /api/institutions/:instId | SUPER | Delete (cascades) |
| GET | /api/students | any | List with mean score |
| GET | /api/students/:stuId | any | Single student |
| POST | /api/students | ADMIN | Create (inline new institution supported) |
| DELETE | /api/students/:stuId | ADMIN | Delete |
| GET | /api/results | any | List (filter: ?stuId=&year=&term=) |
| POST | /api/results | ADMIN | Single result entry |
| POST | /api/results/bulk | ADMIN | Bulk CSV upload (JSON array) |
| DELETE | /api/results/:id | ADMIN | Delete result |
| GET | /api/analytics/overview | any | Dashboard counters + activity |
| GET | /api/analytics/levels | any | Avg per level |
| GET | /api/analytics/institutions | any | Rankings (?type=) |
| GET | /api/analytics/subjects | any | Subject averages |
| GET | /api/analytics/trends | any | Term/year trends |
| GET | /api/analytics/distribution | any | Score band counts |
| GET | /api/analytics/individual/:stuId | any | Full student profile |

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub → connect repo in Vercel
# Set VITE_API_URL env var if backend is on a different domain
```

### Backend → Railway or Render
1. Push `backend/` to GitHub
2. Create a new Web Service, set root to `backend/`
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npm start`
5. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
6. Run seed once: `npm run db:seed`

### Database → Supabase
- Free tier covers the entire app
- Use the Supabase connection string as `DATABASE_URL`
- Prisma migrations work directly against Supabase PostgreSQL

---

## CSV Upload Format

```csv
student_id,subject,score,score_type,term,year
STU-00001,Mathematics,78,percent,Term 1,2024
STU-00001,English,85,percent,Term 1,2024
STU-00002,Calculus,3.5,gpa,Semester 1,2024
```
