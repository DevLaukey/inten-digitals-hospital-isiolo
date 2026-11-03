# Hospital POS

Patient billing and point of sale for a hospital, built with Next.js 14 (App Router) and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and sign in with a demo account, for example `admin@hospital.test` with the password `demo1234`. The login page lists the others.

## Demo mode

No database is connected yet. Data is sample data held in the browser's `localStorage`, and login is a stand-in with one shared password. **Do not deploy this or enter real patient data until a database and real authentication are connected.**

To start over, clear the site's local storage in the browser.

## What's included

| Route | Purpose | Roles |
| --- | --- | --- |
| `/dashboard` | Takings, outstanding balances, low stock | Admin, Cashier |
| `/billing` | Point of sale: build a bill and take payment | All except Doctor |
| `/bills` | Bill list, printable receipts, payments, voids | Admin, Cashier, Receptionist, Pharmacist, Lab |
| `/patients` | Registration, insurance, billing history | All |
| `/catalogue` | Services and drugs, prices, stock | Admin, Pharmacist |
| `/reports` | Collections by department and payment method | Admin |
| `/staff` | Staff accounts and roles | Admin |

Hospital name and receipt details are in `config/hospital.js`. The brand colour is in `tailwind.config.js`.

## Subscription and pausing

- **Reminders are automatic.** A daily job (`/api/cron/subscription-reminders`) emails both the vendor and the hospital 14, 7, 3 and 1 days before the end date. After the end date, only the vendor is told.
- **Pausing is manual.** The end date passing never locks the app. The vendor pauses it at `/vendor`, which sets `is_paid` to false and sends all staff to a "Service paused" page. Recording a renewal there reactivates the app.
- **If the status can't be read** (for example during a database outage), the app stays open.

Setup: copy the settings from `.env.example`, and run `docs/subscription.sql` on the new database. `vercel.json` schedules the job on Vercel (06:00 UTC, 09:00 in Nairobi). On any other host, have a scheduler call that URL daily with the header `Authorization: Bearer <CRON_SECRET>`.

Run the reminder logic tests with `npm test`.

## Connecting the new database

Only two files need to change:

- `lib/store.js`: all data access. Every function is already async, so each can be reimplemented against the database while keeping the same signature.
- `lib/auth.js`: login and session. Replace it with Supabase Auth.

`config/supabase.js` is not used yet. Point `.env.local` at the new project before using it.

The role checks in `lib/constants.js` only control what the UI shows. Enforce access in the database as well (for example with row level security), and move `createBill`, `recordPayment` and `voidBill` into transactions on the server.
