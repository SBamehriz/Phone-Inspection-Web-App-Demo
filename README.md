# Phone Inspection Software

A full-stack web app that manages the end-to-end workflow of inspecting used phones — from receiving a bulk order, scanning each device by IMEI, grading its condition and documenting defects, capturing photos, all the way to exporting styled Excel reports.

I built this to demonstrate a realistic business workflow with a clean UI. It runs entirely in-memory (no database setup needed) so you can try it out in under a minute.

## What it does

1. **Order intake** — Create inspection orders with a 12-digit order number, client name, expected device count, and description.
2. **IMEI scanning** — Enter or scan a 15-digit IMEI. The system looks up device info (brand, model, storage, color) and loads it automatically.
3. **Condition grading** — Grade each device (A+ through C) and check off any defects: screen cracks, battery issues, water damage, missing parts, etc.
4. **Photo capture** — Upload inspection images before marking a device as complete. The workflow enforces this step so nothing gets skipped.
5. **Excel reports** — Generate multi-sheet Excel reports per order or across all completed orders. Reports include grade breakdowns, defect analysis, and color-coded cells.

## Tech stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui, React Query, Wouter
- **Backend:** Node.js, Express, Zod validation, session-based auth
- **Reports:** Python (openpyxl + pandas) for styled multi-sheet Excel generation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). Enter any username and password to sign in — the app is configured for demo mode.

For Excel report export, you'll also need Python 3 with two packages:

```bash
pip install openpyxl pandas
```

## Project structure

```
client/          React frontend (pages, components, hooks)
server/          Express API (routes, auth, services)
  services/      IMEI lookup, Excel generation, storage
scripts/         Python script for Excel report formatting
shared/          Zod schemas shared between client and server
```

## Notes

- All data lives in memory and resets when the server restarts.
- Image uploads are simulated in the demo, but the upload-before-completion workflow is fully enforced.
- Copy `.env.example` to `.env` to customize settings like `SESSION_SECRET` for a real deployment.

## License

MIT
