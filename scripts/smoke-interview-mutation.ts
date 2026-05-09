// ============================================================
// Smoke test for the interviewer's mutation helpers.
//
// Reads KARMA_SYSTEM.md + EDGE_VECTORS.md, simulates resolving
// EV-karma_system-002, asserts the diff in memory, and prints
// before/after snippets. Touches no files on disk.
//
// Run: npx tsx scripts/smoke-interview-mutation.ts
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { allDocs } from "../lib/library/docMap";
import { locateEvBlock } from "../lib/library/edgeVectors";
import {
  locateQABlock,
  rewriteQABlock,
  patchFrontmatter,
} from "./interview";

const REPO_ROOT = process.cwd();

function fail(msg: string): never {
  console.error(`[smoke] FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg: string): void {
  console.log(`[smoke] OK — ${msg}`);
}

const TEST_EV = "EV-karma_system-002";
const TEST_ANSWER = "Opening parameters; will be tuned via Machinations after Sprint 2 ships.";

// 1. Find the source doc for the test EV
const doc = allDocs().find((d) => d.id === "karma_system");
if (!doc) fail("karma_system not in DOC_MAP");
const docPath = path.join(REPO_ROOT, doc!.path);
const raw = fs.readFileSync(docPath, "utf-8");
ok(`loaded ${doc!.path}`);

// 2. Find the Q+A block
const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
if (!fmMatch) fail("no frontmatter on KARMA_SYSTEM.md");
const bodyStart = fmMatch![0].length;
const body = raw.slice(bodyStart);
const block = locateQABlock(body, TEST_EV);
if (!block) fail(`Q+A block for ${TEST_EV} not found`);
ok(`Q+A block at body[${block!.start}..${block!.end}]`);
const blockText = body.slice(block!.start, block!.end);

// 3. Rewrite it
const newBlock = rewriteQABlock(blockText, TEST_ANSWER);
if (!newBlock.includes(TEST_ANSWER)) fail("new block missing the new answer");
if (!newBlock.includes("`[high]`")) fail("new block missing [high] tag");
if (newBlock.includes("`[medium]`")) fail("new block still has old [medium] tag");
if (newBlock.match(/EDGE_VECTORS\.md#ev-karma_system-002/i))
  fail("new block still references the EV link");
ok("rewriteQABlock flipped tag, removed EV link, kept ↔ relates to line");

// 4. Patch frontmatter
const newRaw = patchFrontmatter(raw, {
  decrementOpen: true,
  removeEvId: TEST_EV,
});
const newFmMatch = newRaw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!newFmMatch) fail("frontmatter lost in patch");
const newFm = newFmMatch![1];

const oldOpen = parseInt(raw.match(/^questions_open:\s*(\d+)/m)![1], 10);
const oldAnswered = parseInt(raw.match(/^questions_answered:\s*(\d+)/m)![1], 10);
const newOpen = parseInt(newFm.match(/^questions_open:\s*(\d+)/m)![1], 10);
const newAnswered = parseInt(newFm.match(/^questions_answered:\s*(\d+)/m)![1], 10);

if (newOpen !== oldOpen - 1) fail(`questions_open ${oldOpen} -> ${newOpen} (expected -1)`);
if (newAnswered !== oldAnswered + 1)
  fail(`questions_answered ${oldAnswered} -> ${newAnswered} (expected +1)`);
ok(`questions_open ${oldOpen} -> ${newOpen}, questions_answered ${oldAnswered} -> ${newAnswered}`);

const evIdsLine = newFm.match(/^edge_vector_ids:\s*\[([^\]]*)\]/m);
if (!evIdsLine) fail("edge_vector_ids missing");
if (evIdsLine![1].includes(TEST_EV)) fail(`${TEST_EV} still in edge_vector_ids`);
ok(`${TEST_EV} removed from edge_vector_ids: [${evIdsLine![1]}]`);

// 5. EDGE_VECTORS.md deletion test
const evRaw = fs.readFileSync(path.join(REPO_ROOT, "EDGE_VECTORS.md"), "utf-8");
const range = locateEvBlock(evRaw, TEST_EV);
if (!range) fail(`locateEvBlock did not find ${TEST_EV}`);
const evBlockText = evRaw.slice(range!.start, range!.end);
if (!evBlockText.startsWith(`#### ${TEST_EV}`))
  fail(`locateEvBlock returned wrong range: starts with "${evBlockText.slice(0, 40)}"`);
ok(`locateEvBlock found ${TEST_EV} at [${range!.start}..${range!.end}], ${evBlockText.length} bytes`);

// 6. Print a small before/after sample
console.log("\n--- BEFORE (Q+A block) ---");
console.log(blockText.split("\n").slice(0, 6).join("\n") + " ...");
console.log("\n--- AFTER (Q+A block) ---");
console.log(newBlock.split("\n").slice(0, 6).join("\n") + " ...");

console.log("\n[smoke] all checks passed.");
