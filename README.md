# Upkeep Property Maintenance — Website

Full rebuild of upkeeppropertymaintenance.com. Astro static site, 34 pages, deploys to Netlify.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321 (or use the "upkeep" launch config, port 4322)
npm run build    # outputs to dist/
```

## Structure

- `src/data/` drives the content: `trades.js` (8 trade pages), `cities.js` (11 city pages), `turnovers.js` (package tiers), `faqs.js` (FAQ + FAQPage schema), `site.js` (contact info, stats).
- `src/pages/services/[trade].astro` and `src/pages/service-area/[city].astro` generate the SEO pages. Add an entry to the data file and the page, sitemap, and internal links appear automatically.
- LocalBusiness schema is emitted on every page from `src/layouts/Layout.astro`. FAQPage schema on `/faq/`, Service schema on trade pages.

## Deploy (Netlify)

1. Push this folder to a Git repo and connect it to a new Netlify site (build command and publish dir are in `netlify.toml`), or `npx netlify deploy --prod` from this folder.
2. Enable **Netlify Forms** detection (on by default). The work-order form posts as form name `work-order`, with file uploads. Set a notification email in Netlify → Forms → Notifications.
3. Point the `upkeeppropertymaintenance.com` DNS at Netlify, or use Netlify DNS.
4. After DNS cutover, submit the sitemap in Google Search Console: `https://www.upkeeppropertymaintenance.com/sitemap-index.xml`.

## Content rules

- No dashes as clause separators in copy. Commas or periods.
- No fabricated proof: no invented reviews, badges, or press.
- Emergency/24-7 claims were intentionally removed from the old site's copy. Add them back only if the business actually staffs on-call.
