// Search and social helpers shared by every page (added 11/13/26 after an Ahrefs audit
// flagged 51 long titles, 41 long descriptions, missing social tags and 12 service pages
// whose business record had no address).
import { site } from './site.js';
import { cities } from './cities.js';

const BRAND = ' | Upkeep Property Maintenance';
const SHORT = ' | Upkeep';

// <title> for search results, 60 characters max. The H1 and social title keep the full text.
// Order: as written, short brand, no brand, the part before a question mark, colon or
// parenthesis, then a cut at the last whole word that fits.
export function seoTitle(title) {
  const t = String(title).trim();
  if (t.length <= 60) return t;
  const base = t.endsWith(BRAND) ? t.slice(0, -BRAND.length) : t.split(' | ')[0];
  if ((base + SHORT).length <= 60) return base + SHORT;
  if (base.length <= 60) return base;
  const m = base.match(/^(.{20,59}?\?)\s/) || base.match(/^(.{20,60}?)(?::\s|,\s|\s\()/);
  if (m) return (m[1] + SHORT).length <= 60 ? m[1] + SHORT : m[1];
  return base.slice(0, 61).replace(/\s+\S*$/, '').replace(/[,;:]$/, '');
}

// Meta description, 155 characters max: keep whole sentences when they fit, otherwise end
// at the last comma, otherwise cut at the last whole word.
export function metaDesc(description) {
  const d = String(description || '').trim();
  if (d.length <= 155) return d;
  const head = d.slice(0, 156);
  const stop = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '));
  if (stop >= 70) return d.slice(0, stop + 1);
  // no sentence fits: end at the last comma so it still reads as a finished thought
  const comma = head.lastIndexOf(', ');
  if (comma >= 90) return d.slice(0, comma) + '.';
  return d.slice(0, 153).replace(/\s+\S*$/, '').replace(/[,;:]$/, '') + '…';
}

// One complete business record, used on every page and as the provider on service pages.
export const business = {
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${site.url}/#business`,
  name: site.name,
  url: `${site.url}/`,
  logo: `${site.url}/email-logo.png`,
  image: `${site.url}/og-image.png`,
  description: 'Property maintenance for property managers, landlords and homeowners across Nashville and Middle Tennessee: repairs, unit turnovers and seasonal upkeep across twelve trades.',
  telephone: '+1-615-732-3499',
  email: site.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'US',
  },
  areaServed: cities.map((c) => `${c.name} TN`),
  openingHours: 'Mo-Fr 07:00-18:00',
  priceRange: '$$',
  sameAs: ['https://www.facebook.com/UpKeepPropertyMaintenance'],
};
