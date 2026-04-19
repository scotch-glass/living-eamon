# Public Domain Rules & Safe Harbor Strategy

**CRITICAL: All Claude sessions must read this document before any design or development work.**

This is the **single canonical source** for Living Eamon's public-domain
strategy. It supersedes general copyright knowledge and must be consulted
before introducing any content, names, locations, items, or mechanics
derived from Robert E. Howard's catalogue.

*This document consolidates the former `lore/hyborian-pd/PD_RESEARCH.md`
as of April 2026. That file has been retired — do not look for it.*

---

## § 1 — The Legal Landscape

### 1.1 European Union
- **Status:** Full public domain across all EU jurisdictions.
- **Timeline:** EU copyright = life of author + 70 years. Howard died 1936; all his works entered PD in 2006–2007.
- **Scope:** Entire Howard catalogue — all Conan and Kull stories, the *Hyborian Age* essay, every character, every location, every plot element, the prose itself.
- **Liability:** Zero copyright risk for EU-facing content. (Trademark risk persists — see §2.)

### 1.2 United States
US copyright for pre-1978 works = 95 years from publication for works
that were properly registered AND renewed. Works published before 1964
without proper notice or without timely renewal entered the public
domain automatically under the 1909 Copyright Act.

Howard's works therefore fall into three buckets:

**Bucket A — currently in US public domain** (verified non-renewal of original magazine copyright):

- **"The Hyborian Age"** (essay, serialized across *The Phantagraph* Feb, Aug, and Oct–Nov 1936 issues). *The Phantagraph* was a tiny amateur fan publication; under the 1909 Copyright Act, material appearing there without proper notice and renewal automatically entered PD. No renewal occurred. Project Gutenberg hosts the full text with explicit confirmation that exhaustive research found no US registration or renewal. **Freely usable in full.**
- **"Always Comes Evening"** (poem, *The Phantagraph* Aug 1936 issue). Same status. Freely usable.
- **"Song at Midnight"** / **"Man, the Master"** (poem, *The Phantagraph* Aug 1940 issue, posthumous publication of earlier work). Same status. Freely usable.
- **"The Shadow Kingdom"** (Kull story, *Weird Tales* Aug 1929). Weird Tales magazine copyright was not renewed; the story entered PD. Freely usable.
- **"The Mirrors of Tuzun Thune"** (Kull story, *Weird Tales* Sept 1929). Same status. Freely usable.
- **"Kings of the Night"** (Kull / Bran Mak Morn, *Weird Tales* Nov 1930). Same status. Freely usable.

**Bucket B — entering US public domain 2028–2032** (95-year rule; copyrights properly renewed):

All Conan short stories and the novel *The Hour of the Dragon*. These
enter PD on their respective 95-year anniversaries. See the future PD
calendar in §8.

**Bucket C — trademark-protected forever:**

See §2.

### 1.3 Other Jurisdictions
- **Canada, UK, Australia:** Generally align with US (95-year or life+50).
- **Japan, South Korea:** Shorter terms (50–60 years).
- **China:** Weaker IP enforcement; not a primary compliance concern.
- **Strategy:** Default to US rules (most restrictive) for all geographies except EU.

---

## § 2 — Trademark vs. Copyright (CRITICAL DISTINCTION)

**Trademark rights DO NOT expire.** Even after copyright lapses on a
story, brand-enforcement rights on character names, titles, and
iconographic marks continue indefinitely.

### 2.1 Protected Trademarks (Conan Properties Inc.)

Conan Properties Inc. actively monitors and enforces the following,
regardless of PD status of any underlying story:

| Mark | Usage Risk |
|---|---|
| **CONAN** | ✗ FORBIDDEN in titles, character names, branding, marketing |
| **Conan the Barbarian** | ✗ FORBIDDEN in any player-facing name |
| **HYBORIA / HYBORIAN AGE** | ✗ FORBIDDEN in titles, game names, branding, marketing |
| **CIMMERIAN** (adjective / people) | ✗ FORBIDDEN project-wide per project policy — iconic Conan-brand marker |
| **CIMMERIANS** | ✗ FORBIDDEN same as above |
| "Conan universe" (colloquial) | ✗ Avoid in promotional material |
| "Hyborian" as a marketing adjective | ✗ FORBIDDEN in splash / login / register / board / updates / legal / nav / meta tags |

**These apply FOREVER.** Even when the underlying stories enter PD,
the marks remain protected.

### 2.2 Safe Internal Usage

- Referencing the "Hyborian Age" setting in code comments, design docs, and memory = zero risk.
- Attributing inspiration to Robert E. Howard in internal docs = fair use.
- Creating **derivative settings inspired by Howard** (Aurelion, Thurian Base, Living Eamon) = safe.
- Internal code identifiers like `sceneTone: "aquilonian"` or `tone: "aquilonian"` are internal enums, not player-facing names — allowed.

---

## § 3 — The Safe Harbor Strategy for Living Eamon

### 3.1 Phase 1: Pre-2028 (Current)

**Player-facing branding:**
- Game title: **"Living Eamon"** (no reference to Conan, Hyboria, or Howard in the title itself)
- Setting: **Aurelion** (invented city) and **Ostavar** (invented city)
- Narrative frame: sword-and-sorcery, Thurian Age, Howard-voice
- Disclaimer footer: "Based on works by Robert E. Howard now in the public domain. Not affiliated with Conan Properties Inc."

**Content sourcing (Phase 1):**
- Draw freely from the "Always Safe Corpus" (§5).
- **Hyborian-era kingdoms and peoples** named in the 1936 essay (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, Turan, Hyrkania, Vanaheim, Asgard, etc.) are **public domain and usable** — the essay's copyright lapsed via *The Phantagraph* non-renewal.
- **Avoid entirely:** Any Conan story's unique characters (Conan, Bêlit, Valeria, Thoth-Amon, Yag-Kosha, Xaltotun, etc.), Conan-only locations (Tarantia, Python), Conan-unique artifacts (Heart of Ahriman), and any story-title quotation from stories not yet PD. See §6.
- **Trademark forbidden** regardless of copyright status: "Conan," "Conan the Barbarian," "Cimmerian," "Cimmerians," "Hyboria," "Hyborian Age," "Hyborian" as marketing adjective (see §2.1).

**Why this works:**
- The essay + 3 Kull stories + 2 poems give us the full geography, migrations, cataclysms, named kingdoms, peoples, and pre-Cataclysmic lore — enough to build an entire world.
- Kull, Tuzun Thune, Bran Mak Morn are full-body PD characters we can use by name.
- CPI's trademark portfolio constrains *branding*, not *use* — we obey it in marketing while using the underlying PD lore in the game.

### 3.2 Phase 2: Post-2028 (Hyborian Modules)

**Timeline:** January 1, 2028, and annually through 2032, as individual
Conan stories enter US public domain.

**Player-facing expansion:**
- **Modular unlock:** Hyborian-era (Conan-era) content appears as new playable saga modules.
- **Branding:** "Living Eamon — Age of the Lion" or similar. Never "Conan" anything in the brand.
- **Content:** Named Conan-era protagonists from newly-PD stories; Tarantia; *Hour of the Dragon* material after 2031.

**Legal gating:**
- Verify each story's renewal status 6 months before using.
- Keep disclaimer: "Based on works by Robert E. Howard now in the public domain in [jurisdiction]. Not affiliated with Conan Properties Inc."
- "Conan," "Hyboria," "Hyborian Age," "Cimmerian" stay out of marketing forever (trademark).

**Technical implementation:**
- Feature-flagged modules: `enableHyborianaModules` or similar.
- Modules unlock only when PD status is verified for the year.

---

## § 4 — Concrete Dev Rules

### 4.1 Player-Facing Content (website, game title, marketing, meta tags, alt text)

❌ **DO NOT USE:**
- "Conan" (any form)
- "Cimmerian" / "Cimmerians" / "Cimmeria" (trademark-adjacent; Cimmeria-the-place is copyright-PD but we avoid for brand reasons)
- "Hyboria" / "Hyborian Age"
- "Hyborian" as marketing adjective
- "Tarantia," "Acheron," "Xaltotun," "Python," "Heart of Ahriman" (still copyrighted)
- Character names from Conan short stories (Thoth-Amon, Bêlit, Valeria, Yag-Kosha, etc. — until their story enters PD)

✅ **USE INSTEAD:**
- "Living Eamon"
- "Aurelion," "Ostavar" (invented)
- "Thurian Age," "the age before the Cataclysm"
- Sword-and-sorcery, Howard's sword-and-sorcery tales
- Kingdoms from the essay (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, etc. — safe in player-facing narrative prose and room copy; just **not** as marketing slogans)
- "Inspired by Robert E. Howard's public-domain works" in disclaimers

### 4.2 Internal Code & Design Documents

✅ **OK (zero risk):**
- Referencing Howard's works in comments, design docs, git history.
- Using "Hyborian Age" in internal memory and CLAUDE_CONTEXT.md.
- Attributing setting inspiration to Howard.
- Internal enum values like `sceneTone: "aquilonian"`.

❌ **AVOID (sloppy, bad precedent):**
- Using Conan-specific character names in code before copyright clears.
- Hard-coding "Tarantia" pre-2028 anywhere.
- Merging trademark-protected content into main branch.

### 4.3 Item, NPC, and Location Naming

**If the name comes from a Howard source:**
1. Check the Safe Harbor / Radioactive tables in `GAME_DESIGN.md` (authoritative).
2. If Safe Harbor: use it freely, cite the source in code comment or module README.
3. If Radioactive (trademark or not-yet-PD): invent a derivative name or wait until it enters PD.

**Examples:**
- "Tuzun Thune" (wizard from *Mirrors of Tuzun Thune*, 1929) = PD, use freely.
- "Aquilonia" (kingdom from essay, 1936) = PD, use freely in narrative prose. Not in marketing titles.
- "Conan of Cimmeria" = trademark-forbidden forever. Never use.
- "Tarantia" = copyright-protected until the relevant Conan story enters PD (2028+). Don't use.
- "Aurelion's Grand Artificer" (Living Eamon original) = always safe.

### 4.4 Story Content & Adventure Design

**Safe:**
- Adapt the 3 Thurian-Age PD story plots into adventure modules.
- Use essay geography + invent new NPCs, quests, and outcomes.
- Cite Howard in adventure intros ("In the tradition of Robert E. Howard").

**Unsafe:**
- Reproducing Conan short-story plots before copyright clears.
- Naming adventures after copyrighted Conan stories.
- Verbatim prose from non-PD works.

---

## § 5 — The "Always Safe" Corpus

These six works require zero ongoing legal review and are freely usable
in full (text, characters, locations, plot elements, prose). Cite them
by source in module READMEs.

| Work | First publication | Type | Notes |
|---|---|---|---|
| **The Hyborian Age** (essay) | *The Phantagraph*, Feb / Aug / Oct–Nov 1936 | Worldbuilding essay | Full setting skeleton — geography, migrations, cataclysms, kingdoms, peoples. No characters. |
| **The Shadow Kingdom** | *Weird Tales*, Aug 1929 | Kull short story | Kull, Atlantis, Valusia, Serpent-Men, "Ka nama kaa lajerama" phrase. |
| **The Mirrors of Tuzun Thune** | *Weird Tales*, Sept 1929 | Kull short story | Tuzun Thune, mirror chamber, pre-human magic concepts. |
| **Kings of the Night** | *Weird Tales*, Nov 1930 | Kull / Bran Mak Morn | Bran Mak Morn, Picts, time-bridging ritual. |
| **Always Comes Evening** (poem) | *The Phantagraph*, Aug 1936 | Poem | Howard-voice atmospheric quotation material. |
| **Song at Midnight** / **Man, the Master** (poem) | *The Phantagraph*, Aug 1940 | Poem (posthumous) | Same — quotable atmospheric material. |

**See `GAME_DESIGN.md` top-of-file tables for the detailed
name-by-name Safe Harbor lookup.**

---

## § 6 — What Is NOT Public Domain (Yet)

**All Conan short stories** and the novel **The Hour of the Dragon**
(1935–1936) remain under US copyright. They enter PD progressively
starting January 1, 2028, per the 95-year rule.

Specifically forbidden until the stated year:

| Element | Source story | Earliest US PD date |
|---|---|---|
| Conan (character) | Any Conan story | 2028 |
| Thoth-Amon | Conan stories | 2028+ |
| Bêlit | *Queen of the Black Coast* (1934) | 2030 |
| Valeria | *Red Nails* (1936) | 2032 |
| Yag-Kosha | *The Tower of the Elephant* (1933) | 2029 |
| Tarantia (Aquilonia's capital city) | Conan stories | 2028+ |
| **Acheron** (as named empire) | *The Hour of the Dragon* (1935–1936) | 2031 |
| **Xaltotun** | *The Hour of the Dragon* | 2031 |
| **Heart of Ahriman** | *The Hour of the Dragon* | 2031 |
| **Python** (Acheronian capital) | *The Hour of the Dragon* | 2031 |
| *The Hour of the Dragon* (novel title) | 1935–1936 | 2031 |

**Pre-2031 substitutions** (recorded in `MODULE_PLAN.md` and this doc):
- Acheron → **Thurian** (pre-Cataclysmic age; PD via essay + 3 stories)
- Xaltotun → **Tuzun Thune** (PD via *Mirrors*)
- Heart of Ahriman → **mirror chamber** (PD via *Mirrors*)
- Tarantia → any invented Living Eamon city name (we use Ostavar)

The essay gives the **skeleton**; the protected Conan stories flesh it
out with protected expression. We use the skeleton now, the flesh after
2028.

---

## § 7 — FAQ & Edge Cases

**Q: Can I use "Aquilonia" in player-facing room descriptions?**
A: Yes. The kingdom is PD via the 1936 essay. Use it freely in room
prose and item descriptions. Just don't use it as a marketing title or
slogan (per trademark caution — Aquilonia is iconically Conan-branded).

**Q: Can I use "Cimmeria" or "Cimmerian"?**
A: No, in player-facing content. Cimmeria-the-place is copyright-PD
via the essay, but the project policy treats "Cimmerian" / "Cimmerians" /
"Cimmeria" as trademark-radioactive because they are the strongest
Conan-brand markers in the popular mind. Use a synonym ("highland
barbarian," "mountain folk") in narrative.

**Q: Can I advertise Living Eamon as "a Conan-like game"?**
A: No. Marketing risk. Use "Inspired by classic sword & sorcery" or
"In the tradition of Robert E. Howard's sword-and-sorcery tales."

**Q: What if a PD story has a character also referenced in non-PD stories?**
A: Use only the PD-story incarnation. Example: If a detail about Kull
appears only in a 1934 Conan flashback, don't use that detail. Only use
what's in the three PD Kull stories.

**Q: What if Conan Properties sues us?**
A: The Safe Harbor strategy is designed to prevent this. But if it happens:
1. The "Living Eamon" brand is clean (no Conan IP in title).
2. Thurian-Age / essay-sourced content is defensible (PD).
3. Disclaimer + public availability of sources protect fair use.
4. Scotch has final legal authority on all responses.

---

## § 8 — Future PD Calendar (US)

Works published 1929 entered US PD January 1, 2025; works published
1930 entered January 1, 2026; etc. (95-year rule for pre-1978 works.)

| Year | Eligible Howard works | Status |
|---|---|---|
| 2025 (already PD) | "The Shadow Kingdom" (1929), "The Mirrors of Tuzun Thune" (1929) | ✅ Use freely |
| 2026 (already PD) | "Kings of the Night" (1930) | ✅ Use freely |
| 2028 | First Conan stories: "The Phoenix on the Sword," "The Scarlet Citadel" (1932) | ⬜ Unlock 2028 |
| 2029 | 1933 Conan stories: "Tower of the Elephant," "Black Colossus," "The Slithering Shadow," "The Pool of the Black One," "Rogues in the House," etc. | ⬜ Unlock 2029 |
| 2030 | 1934 Conan stories: "Queen of the Black Coast," "The Devil in Iron," "The People of the Black Circle," "A Witch Shall Be Born," "Jewels of Gwahlur," "Beyond the Black River" | ⬜ Unlock 2030 |
| 2031 | 1935 Conan stories: "Shadows in Zamboula," "The Hour of the Dragon" (serialized Dec 1935 – Apr 1936) — finally unlocks Acheron, Xaltotun, Heart of Ahriman, Python | ⬜ Unlock 2031 ⭐ |
| 2032+ | "Red Nails" (1936) and remaining late stories | ⬜ Unlock 2032+ |

**Re-check renewal status each January.** Some stories may have been
renewed and remain protected through life+95; others lapsed via
non-renewal. Verify each work the year before using it.

Always-PD works not on this calendar (already freely usable): essay +
3 Kull stories + 2 *Phantagraph* poems. See §5.

---

## § 9 — Compliance Checklists

### Before Each New Claude Session
- [ ] Claude has read this file and `GAME_DESIGN.md` top-of-file tables (rehydration per `CLAUDE_CONTEXT.md`).
- [ ] Any new location/NPC names checked against the Safe Harbor / Radioactive tables.
- [ ] No Conan-trademarked term used in player-facing content.

### Before Each Public Deployment (Vercel push)
- [ ] No trademark violations in player-facing pages (CONAN, HYBORIA, HYBORIAN AGE, CIMMERIAN).
- [ ] Disclaimer present where PD Howard content is used.
- [ ] Feature flags ready for 2028 unlock.

### Before Each Adventure Module Launch
- [ ] Source material verified in §1.2 Bucket A or §8 calendar.
- [ ] NPC and location names spot-checked against tables in `GAME_DESIGN.md`.
- [ ] If Hyborian-era story content: verify the source story's PD year has passed.
- [ ] Attribution in module README header.
- [ ] Legal review by Scotch (non-technical, final authority).

---

## § 10 — Authority & Governance

**Legal authority:** Scotch (founder, non-technical) has final sign-off
on any IP decisions that touch marketing, branding, public-facing
content, or content-sourcing decisions.

**Claude authority:** This document is binding for all content design
and development decisions. Cite this document when rejecting
trademark-infringing or pre-PD feature requests.

**Review cadence:** Reviewed annually (January) to reflect new PD
entries and legal changes. Also re-reviewed whenever new research
changes the PD status of any existing entry.

---

## § 11 — Document History

- **April 19, 2026** — Consolidated `lore/hyborian-pd/PD_RESEARCH.md` into this file and deleted it. Confirmed via Project Gutenberg research that *The Phantagraph* pieces (Hyborian Age essay + "Always Comes Evening" + "Song at Midnight") have no US copyright registration or renewal and are freely usable. Resolved prior internal contradictions about Aquilonia / Stygia / Nemedia (now confirmed PD via essay). Tightened trademark-radioactive list per project policy.
- **April 18, 2026** — Prior version with split `PD_RESEARCH.md`.

**Last updated:** April 19, 2026
**Next review:** January 1, 2027
