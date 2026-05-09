// ============================================================
// Sprint G3 -- Doc-graph + launch-readiness file watcher.
//
// Watches the canonical doc surface and re-runs the two generators
// (build-doc-graph + launch-readiness) on every change. Keeps the
// derived artifacts (docs/doc-graph.{json,md}, docs/launch-readiness.md)
// always-fresh during development.
//
// Run alongside `next dev`:
//   npm run dev:all      <-- runs `next dev` + `docs:watch` together
// Or standalone:
//   npm run docs:watch
//
// Debounces 300ms so editor saves that fire multiple events run the
// generators once. Errors in the generators are logged; the watcher
// keeps going. Exits cleanly on SIGINT.
// ============================================================

import path from "node:path";
import { spawn } from "node:child_process";
import chokidar from "chokidar";

const REPO_ROOT = process.cwd();

const WATCH_PATHS = [
  "DOC_MAP.md",
  "EDGE_VECTORS.md",
  "LAUNCH_CRITERIA.md",
  "GAME_DESIGN.md",
  "KARMA_SYSTEM.md",
  "MODULE_SYSTEM.md",
  "SORCERY.md",
  "ADVENTURE_MODULES_PLAN.md",
  "Public_Domain_Rules.md",
  "lore/**/*.md",
];

const IGNORED = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.git/**",
  "**/.venv/**",
  "docs/doc-graph.json",
  "docs/doc-graph.md",
  "docs/doc-graph.mmd",
  "docs/launch-readiness.md",
  "docs/hydration.md",
  "docs/topic-routes.md",
  "docs/work-queue.json",
  "docs/work-queue.md",
];

const DEBOUNCE_MS = 300;

// ── Pretty logging ─────────────────────────────────────────────

const TAG = "[docs:watch]";

function log(msg: string): void {
  process.stdout.write(`${TAG} ${msg}\n`);
}

function logError(msg: string): void {
  process.stderr.write(`${TAG} ${msg}\n`);
}

// ── Generator runner ───────────────────────────────────────────

function runScript(scriptPath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsx", scriptPath], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) {
        logError(`${scriptPath} exited with ${code}`);
        if (err) logError(err.trim());
        if (out) logError(out.trim());
      } else {
        // Surface the script's own headline log line.
        const headline = out.trim().split(/\r?\n/).pop() ?? "";
        if (headline) log(headline);
      }
      resolve(code ?? 1);
    });
  });
}

let regenerating = false;
let pendingRebuild = false;

async function regenerate(reason: string): Promise<void> {
  if (regenerating) {
    pendingRebuild = true;
    return;
  }
  regenerating = true;
  log(`regenerating (${reason})...`);
  const t0 = Date.now();
  // Cascade: graph -> launch-readiness -> hydration -> topic-routes -> work-queue -> validate
  // (validate is non-fatal here; it logs errors but the watcher keeps running)
  const graphCode = await runScript("scripts/build-doc-graph.ts");
  if (graphCode === 0) {
    await runScript("scripts/launch-readiness.ts");
    await runScript("scripts/build-hydration.ts");
    await runScript("scripts/build-topic-routes.ts");
    await runScript("scripts/build-work-queue.ts");
    await runScript("scripts/validate-docs.ts");
  } else {
    logError("graph:build failed; skipping downstream generators");
  }
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  regenerating = false;
  if (pendingRebuild) {
    pendingRebuild = false;
    void regenerate("queued change");
  }
}

// ── Debounced trigger ──────────────────────────────────────────

let debounceHandle: NodeJS.Timeout | null = null;
let lastChangedFiles: Set<string> = new Set();

function scheduleRegenerate(filePath: string): void {
  lastChangedFiles.add(filePath);
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => {
    const files = [...lastChangedFiles].sort();
    lastChangedFiles = new Set();
    debounceHandle = null;
    const summary =
      files.length === 1
        ? path.relative(REPO_ROOT, files[0])
        : `${files.length} files`;
    void regenerate(summary);
  }, DEBOUNCE_MS);
}

// ── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("starting watcher...");
  log(`watching: ${WATCH_PATHS.join(", ")}`);

  // Initial sync: regenerate once at startup so the artifacts are fresh
  // even if the user pulled new commits or edited files while the
  // watcher was off.
  await regenerate("startup");

  const watcher = chokidar.watch(WATCH_PATHS, {
    cwd: REPO_ROOT,
    ignored: IGNORED,
    ignoreInitial: true, // don't fire 'add' for every existing file
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });

  watcher.on("change", (rel) => scheduleRegenerate(path.join(REPO_ROOT, rel)));
  watcher.on("add", (rel) => scheduleRegenerate(path.join(REPO_ROOT, rel)));
  watcher.on("unlink", (rel) => scheduleRegenerate(path.join(REPO_ROOT, rel)));
  watcher.on("error", (e) => logError(`watcher error: ${String(e)}`));

  log("ready -- editing any watched markdown file will rebuild the graph + report");

  process.on("SIGINT", () => {
    log("shutting down");
    void watcher.close().then(() => process.exit(0));
  });
}

void main();
