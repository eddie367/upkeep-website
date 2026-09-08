// Writes src/data/lastmod.json, one entry per page under src/pages, keyed by
// the page's path relative to src/pages, valued YYYY-MM-DD. The sitemap's
// serialize hook in astro.config.mjs reads it to emit <lastmod>.
//
// Dates are computed HERE, at commit time, and committed alongside the pages,
// not at build time. Netlify builds from a clone whose git history is not
// guaranteed to be deep enough for `git log` to answer truthfully, and a wrong
// lastmod is a false freshness signal, which is worse than none.
//
// Where a date comes from, in order:
//   1. The file's last commit, when it has one and that commit is not the
//      repo's root commit.
//   2. The date already recorded for it, when its only commit is the root
//      commit. An initial import is not an edit, so a repo that was just
//      `git init`ed keeps the dates its pages already carried.
//   3. The file's mtime, when it has no commit at all (just written, or the
//      site is not a git repo). mtime is stable across runs, so a page that
//      sits uncommitted is not re-dated every time this runs.
//
// Run it before committing any page change. The article worker runs it after
// it writes a new article page. Never edit lastmod.json by hand.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = join(ROOT, "src", "pages");
const OUT = join(ROOT, "src", "data", "lastmod.json");

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

const IS_GIT = (() => {
  try {
    git("rev-parse", "--is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
})();

const ROOT_COMMITS = IS_GIT ? new Set(git("rev-list", "--max-parents=0", "HEAD").split("\n").filter(Boolean)) : new Set();
const RECORDED = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const mtimeOf = (file) => statSync(file).mtime.toISOString().slice(0, 10);

function dateFor(file, key) {
  if (!IS_GIT) return mtimeOf(file);
  const line = git("log", "-1", "--format=%H %as", "--", relative(ROOT, file));
  if (!line) return mtimeOf(file);
  const [hash, date] = line.split(" ");
  if (ROOT_COMMITS.has(hash) && RECORDED[key]) return RECORDED[key];
  return date;
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
for (const file of walk(PAGES).sort()) {
  const key = relative(PAGES, file);
  map[key] = dateFor(file, key);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
console.log(`lastmod.json: ${Object.keys(map).length} pages (${IS_GIT ? "git history" : "file mtime"})`);
