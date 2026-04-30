// ============================================================
// LIVING EAMON — Quest test runner
//
// Auto-discovers __tests__/quests/*.test.ts and runs each via
// `tsx`. Aggregates pass/fail counts and exits non-zero on any
// failure.
//
// Run:
//   npx tsx scripts/run-quest-tests.ts
//   npm run test:quests
//
// Future sprint test files (e.g. way-of-thoth-progression.test.ts
// from Sprint 8g) are picked up automatically — no runner changes.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TESTS_DIR = path.join(ROOT, "__tests__", "quests");

interface FileResult {
  file: string;
  passed: number;
  failed: number;
  durationMs: number;
  exitCode: number;
  output: string;
}

function discoverTestFiles(): string[] {
  if (!fs.existsSync(TESTS_DIR)) return [];
  return fs
    .readdirSync(TESTS_DIR)
    .filter(f => /\.test\.ts$/.test(f))
    .sort()
    .map(f => path.join(TESTS_DIR, f));
}

// Each test file uses the project's `caseName` idiom which prints
// "  ✓ name" on pass and "  ✗ name" on fail. Tally those marks for
// per-file pass/fail counts. Exit code is the source of truth.
function tally(output: string): { passed: number; failed: number } {
  const lines = output.split("\n");
  let passed = 0;
  let failed = 0;
  for (const line of lines) {
    if (/^\s*✓\s/.test(line)) passed++;
    else if (/^\s*✗\s/.test(line)) failed++;
  }
  return { passed, failed };
}

function runOne(file: string): FileResult {
  const rel = path.relative(ROOT, file);
  const start = Date.now();
  const result = spawnSync("npx", ["tsx", rel], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });
  const durationMs = Date.now() - start;
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  const { passed, failed } = tally(output);
  return {
    file: rel,
    passed,
    failed,
    durationMs,
    exitCode: result.status ?? -1,
    output,
  };
}

function main(): void {
  const files = discoverTestFiles();
  if (files.length === 0) {
    console.error(`No test files found in ${path.relative(ROOT, TESTS_DIR)}`);
    process.exit(1);
  }

  console.log(`[quest-tests] Running ${files.length} suite(s)`);
  console.log("");

  const results: FileResult[] = [];
  for (const f of files) {
    const r = runOne(f);
    results.push(r);
    // Stream the suite's output verbatim so the runner is a
    // transparent multiplexer — no information loss.
    process.stdout.write(r.output);
    if (!r.output.endsWith("\n")) process.stdout.write("\n");
  }

  // ── Aggregate summary ──────────────────────────────────────
  console.log("");
  console.log("=".repeat(60));
  console.log("[quest-tests] Aggregate summary");
  console.log("=".repeat(60));

  let totalPass = 0;
  let totalFail = 0;
  let totalDur = 0;
  let suitesFailed = 0;

  for (const r of results) {
    totalPass += r.passed;
    totalFail += r.failed;
    totalDur += r.durationMs;
    const status = r.exitCode === 0 ? "✓" : "✗";
    if (r.exitCode !== 0) suitesFailed++;
    const counts =
      r.failed > 0
        ? `${r.passed}/${r.passed + r.failed} passed (${r.failed} failed)`
        : `${r.passed}/${r.passed} passed`;
    console.log(
      `  ${status}  ${r.file.padEnd(45)}  ${counts.padEnd(28)}  ${r.durationMs}ms`
    );
  }

  console.log("-".repeat(60));
  const totalCases = totalPass + totalFail;
  const overall =
    suitesFailed === 0
      ? `✓ ${totalPass}/${totalCases} cases · ${results.length}/${results.length} suites · ${totalDur}ms`
      : `✗ ${suitesFailed}/${results.length} suite(s) FAILED · ${totalPass}/${totalCases} cases passed · ${totalDur}ms`;
  console.log(`  ${overall}`);

  process.exit(suitesFailed === 0 ? 0 : 1);
}

main();
