import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

// Regression guard for a real production-only bug: MapLibre's worker script 404'd in the
// built bundle (it worked fine under `vite dev`, which doesn't exercise the same asset
// path as a production build). Deliberately builds and serves the real `dist/` output --
// not the dev server -- since that's the only way this class of bug ever showed up.
//
// Runs as its own project so a full production build doesn't add time to every other
// test run; see the "build-smoke" project in playwright.config.ts.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PREVIEW_PORT = 4174; // distinct from vite's own default preview port, to avoid clashing with a manually-run `npm run preview`
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

let previewProcess: ChildProcess | undefined;

test.beforeAll(async () => {
  test.setTimeout(180_000);

  await new Promise<void>((resolve, reject) => {
    const build = spawn("npm", ["run", "build"], { cwd: ROOT, stdio: "pipe" });
    let stderr = "";
    build.stderr?.on("data", (d) => (stderr += d.toString()));
    build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`production build failed:\n${stderr}`))));
    build.on("error", reject);
  });

  let previewOutput = "";
  previewProcess = spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  previewProcess.stdout?.on("data", (d) => (previewOutput += d.toString()));
  previewProcess.stderr?.on("data", (d) => (previewOutput += d.toString()));

  // Poll the server directly rather than parsing stdout -- more robust across package
  // manager/vite-version output format differences.
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    try {
      const res = await fetch(PREVIEW_URL);
      if (res.ok) ready = true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  if (!ready) throw new Error(`vite preview did not become ready in time. Output so far:\n${previewOutput}`);
});

test.afterAll(() => {
  previewProcess?.kill();
});

test("[CRITICAL] regression: the production build serves MapLibre's worker script without a 404", async ({ page }) => {
  const failedRequests: string[] = [];
  page.on("requestfailed", (req) => failedRequests.push(req.url()));
  page.on("response", (res) => {
    if (res.status() >= 400 && /worker/i.test(res.url())) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(PREVIEW_URL);
  // The map only finishes rendering lines after its worker is up -- a real end-to-end
  // signal that the build's worker asset actually loaded, not just that the page returned 200.
  // (Needs this preview server's origin allowed through the backend's CORS_ORIGINS -- see
  // the "build-smoke.spec.ts" comment on the backend webServer entry in playwright.config.ts.)
  await expect(page.locator(".line-list-header")).toBeVisible({ timeout: 20_000 });

  const workerFailures = failedRequests.filter((f) => /worker/i.test(f));
  expect(workerFailures).toEqual([]);
});
