# Seller Settlement Dashboard

**Amazon + Meesho month-end financial reports → clear seller dashboard**

Upload your Amazon Seller Central settlement / Date Range reports and Meesho Payment Statement Excel files. Instantly see the numbers that matter for a solo seller:

- Gross Sales & Net Settlement
- Total Fees + Shipping (with % of sales)
- Returns / RTO amount & rate
- TCS (reclaimable) & TDS deducted
- Fee breakdown pie chart
- Daily sales vs settlement trend
- SKU-level performance (worst first so you can act)

## Features

- **100% browser-side** — your data never leaves your device
- Auto-detects Amazon vs Meesho report format
- Supports multiple files (combine Amazon + Meesho)
- Modern, clean UI focused on what sellers care about at month-end

## How to run

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Supported reports

### Amazon (India)
- Settlement Report Flat File / Flat File V2
- Date Range Transaction report (CSV / tab-delimited)

### Meesho
- Payment Statement / Payout Report (XLSX / CSV)

## Tech

- React 18 + TypeScript + Vite
- SheetJS (xlsx) for Excel parsing
- Recharts for charts
- Lucide icons

## Privacy

All parsing and calculations happen in the browser. No backend, no analytics, no data upload.

---

Built for Indian solo sellers who want to understand their real numbers every month-end.
