// Smoke test for lib/voice/effectTags + lib/voice/segmentText.
// Run: npx tsx scripts/voice/smoke-effect-tags.ts

import {
  TAG_REFERENCE,
  countCharsForTTS,
  stripTags,
  validateTags,
} from "../../lib/voice/effectTags";
import { TARGET_MAX, segmentForTTS } from "../../lib/voice/segmentText";

let pass = 0;
let fail = 0;

function assert(cond: boolean, label: string, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ok    ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? "  → " + detail : ""}`);
  }
}

function section(name: string) {
  console.log(`\n— ${name}`);
}

section("validateTags: clean input");
{
  const text = "She listened. <whisper>It is a secret.</whisper> [pause] Then she ran.";
  const r = validateTags(text);
  assert(r.ok, "no issues on clean input");
  assert(r.issues.length === 0, "empty issues array");
  assert(r.charsForTTS === text.length, "char count matches input length");
}

section("validateTags: typo suggestions");
{
  const r = validateTags("<loud>NEVER</loud> say it.");
  assert(!r.ok, "marked invalid");
  assert(r.issues.length === 2, "two issues (open + close)", String(r.issues.length));
  assert(r.issues[0].kind === "did-you-mean", "open is did-you-mean");
  assert(r.issues[0].suggestion === "<emphasis>", "suggests <emphasis>", r.issues[0].suggestion);
  assert(r.issues[1].suggestion === "</emphasis>", "close suggests </emphasis>", r.issues[1].suggestion);
}
{
  const r = validateTags("Then [sigh] he turned.");
  assert(!r.ok, "marked invalid");
  assert(r.issues[0].kind === "did-you-mean", "did-you-mean");
  assert(r.issues[0].suggestion === "[breath]", "suggests [breath]", r.issues[0].suggestion);
}

section("validateTags: unknown tags with no suggestion");
{
  const r = validateTags("<garbage>x</garbage> [example]");
  assert(!r.ok, "marked invalid");
  const kinds = r.issues.map((i) => i.kind).sort();
  assert(
    JSON.stringify(kinds) === JSON.stringify(["unknown-inline", "unknown-wrapping", "unknown-wrapping"]),
    "kinds: unknown-inline + 2× unknown-wrapping",
    JSON.stringify(kinds),
  );
}

section("validateTags: unclosed wrapping");
{
  const r = validateTags("<whisper>oops");
  assert(!r.ok, "marked invalid");
  assert(r.issues[0].kind === "unclosed-wrapping", "unclosed-wrapping");
}

section("validateTags: stray closing");
{
  const r = validateTags("text </whisper> more");
  assert(!r.ok, "marked invalid");
  assert(r.issues[0].kind === "stray-closing", "stray-closing");
}

section("validateTags: nested wrappers");
{
  const r = validateTags("<slow><soft>goodnight</soft></slow>");
  assert(r.ok, "nesting accepted");
}
{
  const r = validateTags("<slow><soft>bad</slow></soft>");
  assert(!r.ok, "interleaved-not-nested rejected");
  assert(
    r.issues.some((i) => i.kind === "stray-closing"),
    "stray-closing reported",
  );
}

section("stripTags");
{
  const text = "She <whisper>knew</whisper> the answer. [pause] Then spoke.";
  const stripped = stripTags(text);
  assert(stripped === "She knew the answer. Then spoke.", "tags removed cleanly", JSON.stringify(stripped));
}
{
  // Unknown tags stay so the user can see them
  const text = "She <garbage>x</garbage> spoke.";
  const stripped = stripTags(text);
  assert(stripped.includes("<garbage>"), "unknown tag preserved", stripped);
}
{
  // Paragraph breaks preserved
  const text = "Para one <whisper>a</whisper>.\n\nPara two [pause] end.";
  const stripped = stripTags(text);
  assert(stripped === "Para one a.\n\nPara two end.", "paragraph break preserved", JSON.stringify(stripped));
}

section("countCharsForTTS");
{
  const text = "<whisper>hi</whisper>";
  assert(countCharsForTTS(text) === text.length, "tags count toward TTS budget");
}

section("TAG_REFERENCE");
{
  const inlineCount = TAG_REFERENCE.filter((t) => t.kind === "inline").length;
  const wrapCount = TAG_REFERENCE.filter((t) => t.kind === "wrapping").length;
  assert(inlineCount === 6, "6 inline entries", String(inlineCount));
  assert(wrapCount === 6, "6 wrapping entries", String(wrapCount));
}

section("segmentForTTS: short text passes through");
{
  const text = "A short scene.\n\nWith two paragraphs.";
  const r = segmentForTTS(text);
  assert(r.segments.length === 1, "single segment", String(r.segments.length));
  assert(r.segments[0].text === text, "unchanged");
}

section("segmentForTTS: splits at horizontal rule");
{
  const para = "Lorem ipsum. ".repeat(800); // ~10,400 chars
  const text = para + "\n\n---\n\n" + para; // ~20,800 chars total
  const r = segmentForTTS(text);
  assert(r.segments.length === 2, "splits in two", String(r.segments.length));
  assert(r.boundariesUsed[0] === "hr", "boundary kind is hr", r.boundariesUsed[0]);
  assert(r.segments.every((s) => s.chars <= TARGET_MAX), "all under cap");
}

section("segmentForTTS: splits at heading");
{
  const para = "Lorem ipsum. ".repeat(800);
  const text = para + "\n\n## Chapter 2\n\n" + para;
  const r = segmentForTTS(text);
  assert(r.segments.length === 2, "splits in two");
  assert(r.boundariesUsed[0] === "heading", "boundary kind is heading", r.boundariesUsed[0]);
}

section("segmentForTTS: refuses to split inside wrapping tag");
{
  // Build text where the only valid char-budget split would land
  // inside a long wrapping tag. The splitter must fall back to a
  // safe boundary outside the wrap.
  const lead = "Para one. ".repeat(1000); // ~10,000 chars
  const longWrap = "<whisper>" + "x ".repeat(3000) + "</whisper>"; // ~6018 chars wrapped
  const tail = " Tail paragraph.";
  const text = lead + "\n\n" + longWrap + "\n\n" + tail;
  // Total ~16,034 chars; the only para break safely outside the wrap
  // is between lead and longWrap (at ~10,000) — splitter should use it.
  const r = segmentForTTS(text);
  assert(r.segments.length >= 2, "split occurred");
  for (const seg of r.segments) {
    const v = validateTags(seg.text);
    assert(v.ok, `segment ${seg.index} self-balanced`, JSON.stringify(v.issues));
  }
}

section("segmentForTTS: throws when no boundary fits");
{
  // One giant un-breakable paragraph.
  const text = "x".repeat(TARGET_MAX + 1000);
  let threw = false;
  try {
    segmentForTTS(text);
  } catch {
    threw = true;
  }
  assert(threw, "throws on un-splittable input");
}

console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
