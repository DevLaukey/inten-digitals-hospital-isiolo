# Hospital POS

Patient billing and point of sale for a hospital, built with Next.js and Supabase.

## Setting up

1. Create a Supabase project. In the SQL Editor, run `docs/schema.sql` once, then each file in `docs/migrations` in number order.
2. In Supabase, go to Authentication and turn off "Allow new users to sign up". Staff accounts are created from the app.
3. Copy `.env.example` to `.env.local` and fill it in. Put the same settings in your host's environment settings.
4. Put the hospital's real details in `config/hospital.js`.
5. Install, then create the first administrator. The temporary password is shown once.

   ```bash
   npm install
   npm run create-admin -- admin@example.com "First" "Last"
   ```

6. Run `npm run check-setup`. It lists anything still missing and changes nothing.
7. Start the app with `npm run dev`, sign in, and add services, drugs and staff.

## What's included

| Route | Purpose | Roles |
| --- | --- | --- |
| `/dashboard` | Takings, outstanding balances, low stock | Admin, Cashier |
| `/billing` | Point of sale: build a bill and take payment | All except Doctor |
| `/bills` | Bill list, printable receipts, payments, voids | Admin, Cashier, Receptionist, Pharmacist, Lab |
| `/patients` | Registration, insurance, billing history | All |
| `/catalogue` | Services and drugs, buying and selling prices, stock | Admin, Pharmacist |
| `/reports` | Collections by department and payment method | Admin |
| `/staff` | Staff accounts, roles, password resets | Admin |
| `/audit` | Who changed what | Admin |
| `/account` | Change your own password | All |

Only administrators and cashiers can give a waiver, and only administrators can void a bill. Bills use the selling price. Only administrators and pharmacists can see buying prices.

## How data is protected

The browser talks to Supabase directly using the public key, so `docs/schema.sql` enforces the rules rather than the screens:

- **Row level security** decides what each role can read and change. People who aren't active staff get nothing.
- **Bills can only change through `create_bill`, `record_payment` and `void_bill`.** These run as one transaction and take prices from the catalogue, not the browser.
- **Invoice numbers have no gaps**, and an M-Pesa code can only be used on one bill. Codes are typed in by staff, not checked with M-Pesa.
- **Every change** to patients, the catalogue, bills and staff goes in `audit_log`, which the app can't edit. It doesn't record who viewed a record.

`SUPABASE_SERVICE_ROLE_KEY` bypasses all of this, so it stays on the server. It is used only to create sign-ins (`app/api/staff`) and for the subscription.

Staff are signed out after 30 minutes without activity. New accounts and password resets get a temporary password, and the user must replace it at first sign-in.

## Backups

Check the backup schedule your Supabase plan includes before go-live, and practise a restore. Daily backups need a paid plan.

## Subscription and pausing

- **Reminders are automatic.** A daily job (`/api/cron/subscription-reminders`) emails both the vendor and the hospital 14, 7, 3 and 1 days before the end date. After the end date, only the vendor is told.
- **Pausing is manual.** The end date passing never locks the app. The vendor pauses it at `/vendor`, which sets `is_paid` to false. All staff go to a "Service paused" page and the database stops serving data. Recording a renewal there reactivates the app.
- **If the status can't be read** by the app server (for example during a database outage), the app stays open.

`vercel.json` schedules the job on Vercel (06:00 UTC, 09:00 in Nairobi). On any other host, have a scheduler call that URL daily with the header `Authorization: Bearer <CRON_SECRET>`.

## Development

- `npm test` runs `docs/schema.sql` on an in-memory Postgres and acts as each role, plus the reminder logic tests. No Supabase project is needed.
- `npm run lint` checks the code.

Schema changes go in a new numbered file in `docs/migrations`, because `docs/schema.sql` only runs on an empty database. The tests run the schema and then every migration, in order.
