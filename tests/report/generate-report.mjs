#!/usr/bin/env node
/**
 * Merges the Vitest and Playwright JSON reports into one executive-readable
 * go/no-go summary -- test-results/executive-summary.html (for humans) and
 * test-results/executive-summary.json (for CI to read the verdict without
 * re-parsing HTML). Run as the last step of `npm test`.
 *
 * Severity comes from a [CRITICAL]/[MAJOR]/[MINOR] prefix on the test title
 * (see any *.spec.ts / *.test.ts file for the convention) -- titles with no
 * prefix default to MAJOR, so a new test always counts for something.
 *
 * Verdict:
 *   any CRITICAL failure   -> NOT READY FOR PRODUCTION
 *   0 CRITICAL, >=1 MAJOR  -> READY WITH CAUTION
 *   otherwise              -> READY FOR PRODUCTION
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(dirname, "../..");
const RESULTS_DIR = path.join(ROOT, "test-results");
const UNIT_JSON = path.join(RESULTS_DIR, "unit.json");
const E2E_JSON = path.join(RESULTS_DIR, "e2e.json");
const OUT_HTML = path.join(RESULTS_DIR, "executive-summary.html");
const OUT_JSON = path.join(RESULTS_DIR, "executive-summary.json");
const SONAR_DIR = path.join(ROOT, "sonar-summary");
const SONAR_DASHBOARD_URL = "https://sonarcloud.io/project/overview?id=szerszun_kolejowe.ai";

/** @typedef {{ name: string, area: string, severity: "critical"|"major"|"minor", status: "passed"|"failed"|"skipped", message?: string }} TestResult */

function severityOf(title) {
  if (/\[CRITICAL\]/.test(title)) return "critical";
  if (/\[MINOR\]/.test(title)) return "minor";
  return "major"; // explicit [MAJOR] or unprefixed
}

function cleanTitle(title) {
  return title.replace(/^\[(CRITICAL|MAJOR|MINOR)\]\s*/, "");
}

// oxlint-disable-next-line no-control-regex -- intentional: strips ANSI color codes from Playwright error messages
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
function stripAnsi(s) {
  return s == null ? s : s.replace(ANSI_PATTERN, "");
}

/** @returns {TestResult[]} */
function parseVitest() {
  if (!fs.existsSync(UNIT_JSON)) return [];
  const data = JSON.parse(fs.readFileSync(UNIT_JSON, "utf8"));
  /** @type {TestResult[]} */
  const results = [];
  for (const file of data.testResults ?? []) {
    const area = path.relative(ROOT, file.name ?? "unit").replace(/^src\/utils\//, "").replace(/\.test\.ts$/, "");
    for (const assertion of file.assertionResults ?? []) {
      results.push({
        name: cleanTitle(assertion.title),
        area: `unit: ${area}`,
        severity: severityOf(assertion.title),
        status: assertion.status === "passed" ? "passed" : assertion.status === "pending" ? "skipped" : "failed",
        message: assertion.failureMessages?.[0],
      });
    }
  }
  return results;
}

/** @returns {TestResult[]} */
function parsePlaywright() {
  if (!fs.existsSync(E2E_JSON)) return [];
  const data = JSON.parse(fs.readFileSync(E2E_JSON, "utf8"));
  /** @type {TestResult[]} */
  const results = [];

  // Playwright reports `file` already relative to the top-level testDir ("./tests"), e.g.
  // "e2e/i18n.spec.ts" -- just strip the extension, no further path math needed.
  function areaOf(filePath) {
    return (filePath ?? "unknown").replace(/\.spec\.ts$/, "");
  }

  // Only top-level suites carry `file`; nested `describe` blocks don't, so the area is
  // fixed once per file and threaded through the recursion rather than re-read each level.
  function walk(suite, area) {
    const suiteArea = area ?? areaOf(suite.file);
    for (const spec of suite.specs ?? []) {
      const test = spec.tests?.[0];
      if (!test) continue;
      const status = test.status === "expected" || test.status === "flaky" ? "passed" : test.status === "skipped" ? "skipped" : "failed";
      const lastResult = test.results?.at(-1);
      const rawMessage = lastResult?.errors?.[0]?.message ?? lastResult?.error?.message;
      results.push({
        name: cleanTitle(spec.title),
        area: suiteArea,
        severity: severityOf(spec.title),
        status,
        message: status === "failed" ? stripAnsi(rawMessage) : undefined,
      });
    }
    for (const nested of suite.suites ?? []) walk(nested, suiteArea);
  }
  for (const suite of data.suites ?? []) walk(suite);
  return results;
}

/**
 * Reads the gate.json/measures.json the CI workflow downloads from the sonarcloud job's
 * artifact (see .github/workflows/regression.yml). Both files are fetched straight from
 * SonarCloud's own API, so either can be missing (job failed before uploading) or
 * malformed (API hiccup) -- either case degrades to "unavailable", never a report crash.
 * @returns {{ gateStatus: string, bugs: string, vulnerabilities: string, codeSmells: string, securityHotspots: string, coverage: string, dashboardUrl: string } | null}
 */
function parseSonar() {
  const gatePath = path.join(SONAR_DIR, "gate.json");
  const measuresPath = path.join(SONAR_DIR, "measures.json");
  if (!fs.existsSync(gatePath) && !fs.existsSync(measuresPath)) return null;

  let gateStatus = "UNKNOWN";
  try {
    gateStatus = JSON.parse(fs.readFileSync(gatePath, "utf8")).projectStatus?.status ?? "UNKNOWN";
  } catch {
    // Missing or malformed -- leave UNKNOWN rather than fail the whole report.
  }

  const measures = {};
  try {
    const data = JSON.parse(fs.readFileSync(measuresPath, "utf8"));
    for (const m of data.component?.measures ?? []) measures[m.metric] = m.value;
  } catch {
    // Missing or malformed -- leave measures empty.
  }

  return {
    gateStatus,
    bugs: measures.bugs ?? "?",
    vulnerabilities: measures.vulnerabilities ?? "?",
    codeSmells: measures.code_smells ?? "?",
    securityHotspots: measures.security_hotspots ?? "?",
    coverage: measures.coverage != null ? `${measures.coverage}%` : "?",
    dashboardUrl: SONAR_DASHBOARD_URL,
  };
}

const results = [...parseVitest(), ...parsePlaywright()];

if (results.length === 0) {
  console.error("No test results found -- run `npm test` (not the report script alone) first.");
  process.exit(1);
}

const bySeverity = { critical: [], major: [], minor: [] };
for (const r of results) bySeverity[r.severity].push(r);

const failedCritical = bySeverity.critical.filter((r) => r.status === "failed");
const failedMajor = bySeverity.major.filter((r) => r.status === "failed");

let verdict, verdictLabel;
if (failedCritical.length > 0) {
  verdict = "not_ready";
  verdictLabel = "NOT READY FOR PRODUCTION";
} else if (failedMajor.length > 0) {
  verdict = "caution";
  verdictLabel = "READY WITH CAUTION";
} else {
  verdict = "ready";
  verdictLabel = "READY FOR PRODUCTION";
}

const summary = {
  generatedAt: new Date().toISOString(),
  verdict,
  verdictLabel,
  sonar: parseSonar(),
  totals: {
    total: results.length,
    passed: results.filter((r) => r.status === "passed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
  },
  bySeverity: Object.fromEntries(
    Object.entries(bySeverity).map(([sev, list]) => [
      sev,
      { total: list.length, passed: list.filter((r) => r.status === "passed").length, failed: list.filter((r) => r.status === "failed").length },
    ]),
  ),
  failures: results.filter((r) => r.status === "failed"),
};

fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));
fs.writeFileSync(OUT_HTML, renderHtml(summary, results));

console.log(`\nVerdict: ${summary.verdictLabel}`);
console.log(`${summary.totals.passed}/${summary.totals.total} passed, ${summary.totals.failed} failed, ${summary.totals.skipped} skipped`);
console.log(`Report: ${path.relative(ROOT, OUT_HTML)}`);

process.exit(verdict === "not_ready" ? 1 : 0);

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function renderHtml(summary, results) {
  const bannerClass = { not_ready: "banner--bad", caution: "banner--caution", ready: "banner--good" }[summary.verdict];
  const bannerSub = {
    not_ready: "At least one CRITICAL regression test is failing. Do not deploy until this is resolved.",
    caution: "All CRITICAL tests pass, but MAJOR issues were found. Review before deploying.",
    ready: "All CRITICAL and MAJOR tests pass.",
  }[summary.verdict];

  const areaOrder = [...new Set(results.map((r) => r.area))].sort();
  const areaRows = areaOrder
    .map((area) => {
      const inArea = results.filter((r) => r.area === area);
      const passed = inArea.filter((r) => r.status === "passed").length;
      const failed = inArea.filter((r) => r.status === "failed").length;
      return `<tr><td>${esc(area)}</td><td>${inArea.length}</td><td class="pass">${passed}</td><td class="${failed ? "fail" : ""}">${failed}</td></tr>`;
    })
    .join("\n");

  const sonarSection = summary.sonar
    ? (() => {
        const s = summary.sonar;
        const pillClass = { OK: "pill--sonar-ok", ERROR: "pill--sonar-error" }[s.gateStatus] ?? "pill--sonar-unknown";
        return `<h2 class="section">Code quality (SonarCloud)</h2>
  <p><span class="pill ${pillClass}">Quality Gate: ${esc(s.gateStatus)}</span></p>
  <div class="stat-row">
    <div class="stat"><div class="num ${Number(s.bugs) > 0 ? "fail" : ""}">${esc(s.bugs)}</div><div class="label">Bugs</div></div>
    <div class="stat"><div class="num ${Number(s.vulnerabilities) > 0 ? "fail" : ""}">${esc(s.vulnerabilities)}</div><div class="label">Vulnerabilities</div></div>
    <div class="stat"><div class="num">${esc(s.codeSmells)}</div><div class="label">Code smells</div></div>
    <div class="stat"><div class="num ${Number(s.securityHotspots) > 0 ? "fail" : ""}">${esc(s.securityHotspots)}</div><div class="label">Security hotspots</div></div>
    <div class="stat"><div class="num">${esc(s.coverage)}</div><div class="label">Unit test coverage</div></div>
  </div>
  <p class="sonar-link"><a href="${esc(s.dashboardUrl)}">View full analysis on SonarCloud &rarr;</a></p>`;
      })()
    : `<h2 class="section">Code quality (SonarCloud)</h2>
  <p style="color:var(--text-muted);font-size:0.85rem;">Unavailable for this run (the sonarcloud job may not have completed).</p>`;

  const failureRows = ["critical", "major", "minor"]
    .flatMap((sev) => summary.failures.filter((f) => f.severity === sev))
    .map(
      (f) => `<tr>
        <td><span class="pill pill--${f.severity}">${f.severity}</span></td>
        <td>${esc(f.area)}</td>
        <td>${esc(f.name)}</td>
        <td class="msg">${esc((f.message ?? "").split("\n")[0]).slice(0, 200)}</td>
      </tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>kolejowe.ai Test Report</title>
<style>
  :root {
    --bg: #faf8f4; --surface: #fff; --surface-2: #f4f1ea; --border: #e4ded0; --text: #22221f; --text-muted: #6b6457;
    --good-bg: #e4f3e6; --good-fg: #1f6b3a; --good-border: #b9ddbf;
    --caution-bg: #fbf0da; --caution-fg: #8a5c0a; --caution-border: #ecd49f;
    --bad-bg: #f7e9e7; --bad-fg: #a13f33; --bad-border: #ecc5bd;
    --accent: #4a3dc9;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
  .page { max-width: 900px; margin: 0 auto; padding: 2.5rem 1rem 4rem; }
  h1 { font-size: 1.5rem; margin: 0 0 0.3rem; }
  .meta { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
  .banner { border-radius: 12px; padding: 1.3rem 1.6rem; margin-bottom: 2rem; border: 1px solid; }
  .banner--good { background: var(--good-bg); color: var(--good-fg); border-color: var(--good-border); }
  .banner--caution { background: var(--caution-bg); color: var(--caution-fg); border-color: var(--caution-border); }
  .banner--bad { background: var(--bad-bg); color: var(--bad-fg); border-color: var(--bad-border); }
  .banner h2 { margin: 0 0 0.3rem; font-size: 1.3rem; }
  .banner p { margin: 0; font-size: 0.95rem; }
  .stat-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.9rem 1.2rem; flex: 1; min-width: 110px; }
  .stat .num { font-size: 1.6rem; font-weight: 700; }
  .stat .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 2rem; }
  th { text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--surface-2); padding: 0.6rem 0.8rem; }
  td { padding: 0.6rem 0.8rem; border-top: 1px solid var(--border); font-size: 0.86rem; vertical-align: top; }
  .pass { color: var(--good-fg); font-weight: 600; }
  .fail { color: var(--bad-fg); font-weight: 600; }
  .msg { font-family: ui-monospace, monospace; font-size: 0.78rem; color: var(--text-muted); }
  .pill { display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 999px; }
  .pill--critical { background: var(--bad-bg); color: var(--bad-fg); }
  .pill--major { background: var(--caution-bg); color: var(--caution-fg); }
  .pill--minor { background: var(--surface-2); color: var(--text-muted); }
  .pill--sonar-ok { background: var(--good-bg); color: var(--good-fg); }
  .pill--sonar-error { background: var(--bad-bg); color: var(--bad-fg); }
  .pill--sonar-unknown { background: var(--surface-2); color: var(--text-muted); }
  h2.section { font-size: 1.1rem; margin: 2rem 0 0.8rem; }
  .sonar-link { font-size: 0.8rem; margin: 0 0 1rem; }
</style>
</head>
<body>
<div class="page">
  <h1>kolejowe.ai &mdash; Regression Test Report</h1>
  <div class="meta">Generated ${esc(summary.generatedAt)}</div>

  <div class="banner ${bannerClass}">
    <h2>${esc(summary.verdictLabel)}</h2>
    <p>${esc(bannerSub)}</p>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="num">${summary.totals.total}</div><div class="label">Total tests</div></div>
    <div class="stat"><div class="num pass">${summary.totals.passed}</div><div class="label">Passed</div></div>
    <div class="stat"><div class="num ${summary.totals.failed ? "fail" : ""}">${summary.totals.failed}</div><div class="label">Failed</div></div>
    <div class="stat"><div class="num">${summary.totals.skipped}</div><div class="label">Skipped</div></div>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="num ${summary.bySeverity.critical.failed ? "fail" : "pass"}">${summary.bySeverity.critical.passed}/${summary.bySeverity.critical.total}</div><div class="label">Critical passed</div></div>
    <div class="stat"><div class="num ${summary.bySeverity.major.failed ? "fail" : "pass"}">${summary.bySeverity.major.passed}/${summary.bySeverity.major.total}</div><div class="label">Major passed</div></div>
    <div class="stat"><div class="num ${summary.bySeverity.minor.failed ? "fail" : "pass"}">${summary.bySeverity.minor.passed}/${summary.bySeverity.minor.total}</div><div class="label">Minor passed</div></div>
  </div>

  ${sonarSection}

  ${failureRows ? `<h2 class="section">Failures</h2>
  <table>
    <thead><tr><th>Severity</th><th>Area</th><th>Test</th><th>Message</th></tr></thead>
    <tbody>${failureRows}</tbody>
  </table>` : ""}

  <h2 class="section">Results by area</h2>
  <table>
    <thead><tr><th>Area</th><th>Total</th><th>Passed</th><th>Failed</th></tr></thead>
    <tbody>${areaRows}</tbody>
  </table>

  <p style="color:var(--text-muted);font-size:0.8rem;">
    Full Playwright report (traces, screenshots): <code>test-results/playwright-html/index.html</code>
  </p>
</div>
</body>
</html>`;
}
