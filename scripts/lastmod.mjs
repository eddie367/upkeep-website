// Writes src/data/lastmod.json, one entry per page under src/pages, keyed by
// the page's path relative to src/pages, valued YYYY-MM-DD. The sitemap's
// serialize hook in astro.config.mjs reads it to emit <lastmod>.
//
// Dates are computed HERE, at commit time, and committed alongside the pages,
// not at build time. Netlify builds from a clone whose git history is not
// guaranteed to be deep enough for `git log` to answer truthfully, and a wrong
// lastmod is a false freshness signal, which is worse than none.
//
// Run it before committing any page change. The article worker runs it after
// it writes a new article page. Never edit lastmod.json by hand.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = join(ROOT, "src", "pages");
const OUT = join(ROOT, "src", "data", "lastmod.json");

const IS_GIT = (() => {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
})();

const today = new Date().toISOString().slice(0, 10);

function dateFor(file) {
  if (IS_GIT) {
    const out = execFileSync("git", ["log", "-1", "--format=%as", "--", relative(ROOT, file)], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    // A page with no history yet is one being committed now, so today is true.
    return out || today;
  }
  // No git here, so the file's own mtime is the only record of when it last
  // changed. True while the directory is edited in place, wrong the moment
  // it is copied somewhere. Move this site into git and this branch goes away.
  return statSync(file).mtime.toISOString().slice(0, 10);
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(astro|md|mdx)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

if (!existsSync(PAGES)) {
  console.error(`no pages dir at ${PAGES}`);
  process.exit(1);
}

const map = {};
for (const file of walk(PAGES).sort()) map[relative(PAGES, file)] = dateFor(file);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
console.log(`lastmod.json: ${Object.keys(map).length} pages dated from ${IS_GIT ? "git history" : "file mtime"}`);
