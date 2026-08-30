# MG Bayan Lepas Monthly Charges

A simple staff website for recording each resident's company-stock usage in a calendar layout, saving records online, adding repeating monthly packages, and exporting an individual resident's monthly charges to Excel.

## Recommended setup

Use **GitHub Pages** for the website and **Supabase** for login + database. Both have free plans suitable for getting the first version running. GitHub Pages alone cannot securely provide staff login or a shared database, so Supabase is the backend.

## 1. Create Supabase

1. Go to https://supabase.com and create an account/project.
2. Choose a strong database password and keep it safely.
3. In the project, open **SQL Editor**.
4. Create a new query, paste all contents of `setup.sql`, and click **Run**.
5. Go to **Authentication > Users** and create each staff user with their work email/password.
   - For the first test, create your own account first.
   - Do not turn on public sign-up in the website. Staff accounts should be created by management in Supabase.
6. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` / publishable key
7. Open `index.html` and replace:

```js
const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';
```

The anon key is designed to be used in frontend code. Security is provided by Supabase Row Level Security (RLS). Never put the Supabase service-role key in this website.

## 2. Test locally

The easiest test is with VS Code:

1. Install VS Code.
2. Put `index.html` in a folder.
3. Install the **Live Server** extension.
4. Right-click `index.html` > **Open with Live Server**.
5. Log in with the staff account created in Supabase.
6. Add one test resident, choose the month, and enter quantities in the calendar.

## 3. Publish free with GitHub Pages

1. Create a GitHub account.
2. Create a new repository, e.g. `mg-bayan-lepas-charges`.
3. Upload `index.html` (README is optional; do NOT upload passwords).
4. Open repository **Settings > Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch `main` and folder `/root`, then Save.
7. GitHub will give you a website address. Staff can bookmark it on PCs/tablets/phones.

## Daily staff workflow

1. Log in.
2. Choose **Resident** and **Billing Month**.
3. In the calendar, type the quantity under the exact date the item was used.
4. Each change is saved online automatically.
5. Staff may return later and change or remove quantities.
6. Log out when finished.

## Repeating monthly packages

Open **Monthly Packages**:

1. Select resident.
2. Select package/machine rental/service.
3. Confirm the monthly amount.
4. Choose the start date.
5. Click **Add Monthly Charge**.

The charge is included in every applicable month automatically. Click **Stop** when the resident no longer needs it. The end date is recorded, so old month reports remain intact.

## End-of-month finance workflow

1. Open **Monthly Charges**.
2. Select resident and month.
3. Review the month total.
4. Click **Export Excel**.
5. Repeat for each resident and send the exported `.xlsx` files to Finance.

The exported sheet keeps the familiar calendar-style structure: item, unit, price, day columns, row totals, recurring charges and grand total.

## Important production recommendations

Before using this as the official record system, I recommend these next upgrades:

- Add Admin vs Staff permissions so only Admin can change residents, prices and item master data.
- Add an audit log showing who changed an entry and when.
- Add a month-lock feature so completed months cannot be edited accidentally after Finance closes them.
- Add a one-click **Export All Residents** ZIP for Finance.
- Add automatic database backups / retention policy.
- Use only resident names or internal references necessary for billing. Avoid placing unnecessary medical/clinical notes in this charge system.

## Files

- `index.html` — complete website frontend.
- `setup.sql` — database tables, security policies and the stock/package list taken from the supplied manual form.
