#!/usr/bin/env node
/**
 * Writes dist/version.json with the commit this build was built from, so the
 * CI production-smoke job (.github/workflows/regression.yml) can confirm
 * Render actually finished deploying the pushed commit, not just that *some*
 * version of the static site is being served.
 *
 * RENDER_GIT_COMMIT is set automatically by Render on every build
 * (https://render.com/docs/environment-variables#all-runtimes) -- no extra
 * Render-side configuration needed. Vite only embeds build-time env vars
 * prefixed VITE_ into the bundle itself, so this writes a plain static file
 * instead, read directly at request time rather than baked into the JS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function currentCommit() {
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
}

fs.writeFileSync(path.join(ROOT, "dist", "version.json"), JSON.stringify({ commit: currentCommit() }));
