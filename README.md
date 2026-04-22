# Noon PLP Scraper (Playwright)

A lightweight frontend + backend tool that accepts a Noon PLP URL, collects PDP links from the listing wrapper, scrapes PDP details, and exports to Excel.

## Features

- Input Noon PLP URL from browser UI.
- Extract product URLs inside:
  - `.ProductListDesktop-module-scss-module__okqu8G__layoutWrapper`
- Scrape per PDP:
  - Canonical URL (`link[rel='canonical']`)
  - Overview
  - Specifications
  - Image URLs
  - Noon price
  - MRP
- Export `.xlsx` with sheets: `products`, `images`, `errors`.
- Reliability controls: concurrency and randomized delays.

## Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

Open: `http://localhost:3000`

## Notes

- Keep scraping compliant with Noon terms and applicable laws.
- CSS module class names can change; update selectors in `src/scraper.js` if needed.
