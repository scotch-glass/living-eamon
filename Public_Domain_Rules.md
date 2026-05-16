---
id: public_domain_rules
title: Public Domain Rules
role: legal
canonical_for: [ip-framework, safe-harbor-strategy, howard-pd-timeline, trademark-restrictions, always-safe-corpus]
visibility: creator
status: active
last_updated: 2026-04-30
cross_refs: [GAME_DESIGN.md, lore/hyborian-pd/MODULE_PLAN.md, EDGE_VECTORS.md]
questions_total: 10
questions_answered: 9
questions_open: 1
edge_vector_ids: [EV-public_domain_rules-002]
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [PD-SAFETY]

**Q:** What's the three-bucket model for Howard's catalogue?
**A:** **Bucket A — currently US-PD:** the Always-Safe Corpus (Hyborian Age essay + 3 Kull stories + 2 Phantagraph poems) plus 15 *Weird Tales* 1934–1936 stories moved to Bucket A by the project's 2026-04-30 non-renewal audit (Iron Shadows in the Moon, Queen of the Black Coast, The Devil in Iron, People of the Black Circle, A Witch Shall Be Born, Jewels of Gwahlur, Beyond the Black River, Shadows in Zamboula, The Hour of the Dragon, Red Nails, Haunter of the Ring, Grisly Horror / Moon of Zambebwei, Black Canaan, Black Hound of Death, Fire of Asshurbanipal). **Bucket B — copyright-protected pending audit or 95-year unlock:** 1932–1933 *Weird Tales* Conan stories (Phoenix on the Sword 2028, Tower of the Elephant 2029, etc.). **Bucket C — trademark-protected forever:** Conan, Cimmerian, Hyborian, Hyboria — never lift, regardless of any underlying story's PD status. `[high]`
↔ relates to: §1.2 (the three buckets), §8 Future PD Calendar, GAME_DESIGN.md top-of-file tables (name-by-name lookup)

### [PD-SAFETY]

**Q:** What's the critical distinction between trademark and copyright for this project?
**A:** Trademark rights **do not expire**. Even after copyright lapses on a story, brand-enforcement rights on character names, titles, and iconographic marks continue indefinitely. Conan Properties Inc. (Cabinet Entertainment / Heroic Signatures) actively enforces the marks **CONAN**, **Conan the Barbarian**, **HYBORIA / HYBORIAN AGE**, **CIMMERIAN / CIMMERIANS / CIMMERIA**, and **"Hyborian"** as a marketing adjective. These are forbidden in titles, character names, branding, marketing, splash, login, register, board, updates, legal, nav, meta tags — **forever, regardless of underlying story PD status**. The trademark scrub is project-wide for all player-facing surfaces; internal code identifiers like `sceneTone: "aquilonian"` stay safe because they are enums, not player-facing names. `[high]`
↔ relates to: §2 Trademark vs Copyright, §6.1 Trademark-protected forever, feedback_no_hyborian_in_marketing.md

### [PD-SAFETY]

**Q:** What is the "inspired by" customization discipline that every adventure module must follow?
**A:** Six rules per Scotch's standing directive (2026-04-30): (1) **The player IS the hero** — where Howard's stories starred Conan, Living Eamon recasts the role for the player character. Not a name-swap, but a replacement of the protagonist function with PICSSI-driven decisions. (2) **Original prose in Howard's voice register** — newly written in Howard's vocabulary and atmospheric register; we do not reprint or closely paraphrase his sentences. (3) **Heavy plot mutation** — multi-ending PICSSI branches, ally NPCs that live or die based on player choice, faction puzzles where Howard had a single thread. (4) **Trademark scrub** — Conan / Cimmerian / Hyborian removed from all module prose; the 1936 essay's other kingdoms (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, Turan, Hyrkania, Vendhya) remain safe in narrative. (5) **Atlantean wonder-tech accents** — pre-Cataclysmic gunpowder, steam-engines, energy-crystal devices, automata, beam-weapons appear as dormant or revered-as-magic relics. (6) **Disclaimers** — module README cites "Inspired by [title] (Robert E. Howard, *Weird Tales* [date])". `[high]`
↔ relates to: §4.4 Customization Discipline, ADVENTURE_MODULES_PLAN.md (per-module mapping), project_pd_expansion_2026-04-30.md

### [PD-SAFETY]

**Q:** What is the Always-Safe Corpus and what does it unlock?
**A:** Six works requiring **zero ongoing legal review**, freely usable in full text + characters + locations + plot elements + prose. **The Hyborian Age** (essay, *The Phantagraph* 1936) — full setting skeleton: geography, migrations, cataclysms, kingdoms, peoples; no characters; verified non-renewal per Project Gutenberg research. **The Shadow Kingdom** (*Weird Tales* Aug 1929) — Kull, Atlantis, Valusia, Serpent-Men, the "Ka nama kaa lajerama" anti-shibboleth. **The Mirrors of Tuzun Thune** (*Weird Tales* Sept 1929) — Tuzun Thune, mirror chamber, pre-human magic concepts. **Kings of the Night** (*Weird Tales* Nov 1930) — Bran Mak Morn, Picts, time-bridging ritual. **Always Comes Evening** (poem, *The Phantagraph* Aug 1936) and **Song at Midnight / Man, the Master** (poem, *The Phantagraph* Aug 1940) — Howard-voice quotable atmospheric material. The essay's kingdom names (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, Turan, Hyrkania, Vendhya) are PD and usable in narrative prose. The three Kull stories are the Thurian-Age anchor for the Mirrors of Tuzun Thune launch trilogy. `[high]`
↔ relates to: §5 Always-Safe Corpus, project_pd_expansion_2026-04-30.md, GAME_DESIGN.md top-of-file tables

### [PD-SAFETY]

**Q:** What's the upcoming PD calendar — when do Bucket B stories enter Bucket A?
**A:** Two unlock dates absent earlier non-renewal confirmation. **2028:** *The Phoenix on the Sword* + *The Scarlet Citadel* (1932 *Weird Tales* issues) enter PD on the 95-year clock; this also unlocks **Thoth-Amon** as a named character. **2029:** the 1933 Conan corpus — *The Tower of the Elephant*, *Black Colossus*, *Rogues in the House*, *The Slithering Shadow*, *The Pool of the Black One*, *The Frost-Giant's Daughter / Gods of the North* — enters PD; this also unlocks **Yag-Kosha** as a named character (though the project's working stance treats him as already-usable via the 1934 *Queen of the Black Coast* description). **2027 review** (per §3.2): verify *Weird Tales* 1932 + 1933 issue non-renewal status, which would move those stories to Bucket A early. **Trademark restrictions persist forever regardless of any unlock** — Conan / Cimmerian / Hyborian remain forbidden in 2028, 2029, and all future years. Living Eamon adopts a non-renewal-friendly stance for content sourcing; this is project policy, not legal advice. `[high]`
↔ relates to: §3.2 Future PD calendar, §8 Future PD Calendar (US), §6.2 Bucket B specifics

### [PD-SAFETY]

**Q:** Why is "Cimmerian" treated as forbidden when Cimmeria-the-place is technically copyright-PD via the 1936 essay?
**A:** Project policy treats Cimmerian / Cimmerians / Cimmeria as **trademark-radioactive** because they are the strongest Conan-brand markers in the popular mind, even though the underlying *Hyborian Age* essay is PD. The risk model isn't strict copyright validity — it's brand-enforcement litigation cost and consumer-confusion risk. Cabinet Entertainment / CPI's enforcement portfolio targets exactly these brand markers; even a legally-defensible use creates legal-defense exposure that the project chooses not to take. Use synonyms in narrative ("highland barbarian," "mountain folk," "northern hill-clans," "highland warriors of the cold reaches"). The same reasoning explains why "Aquilonia" is OK in narrative prose but never in marketing slogans — the brand association is too tight even when the legal case is solid. Crom's people in PANTHEON.md are framed as "northern hill-clans" specifically to honor this discipline. `[high]`
↔ relates to: §2.1 Protected Trademarks, §4.1 player-facing DO NOT USE, lore/pantheon/PANTHEON.md (Crom entry framing)

### [ARCHITECTURE]

**Q:** Which systems and surfaces consume this document at design and runtime?
**A:** Six surfaces. (a) **Every Claude session** — CLAUDE.md item 5 in the rehydration stack instructs reading this file before any design work; this doc has authority to reject trademark-infringing or pre-PD feature requests. (b) **`ADVENTURE_MODULES_PLAN.md`** — each of the 18 modules cites its source story and PD-status reasoning per §1.2. (c) **`MODULE_SYSTEM.md` `module.json` schema** — the optional `publicDomainSource` field documents per-module provenance ("Robert E. Howard, 'Skulls in the Stars' — US public domain since 2025-01-01"). (d) **GAME_DESIGN.md top-of-file tables** — name-by-name Safe Harbor / Radioactive lookup; supersedes any other doc on individual term status. (e) **Marketing pages + meta tags** — splash, board, login, register all run trademark-scrub before deploy per §9 compliance checklist. (f) **PANTHEON.md** — the Howard-PD frame for Crom and the Thurian aliases is anchored here. No runtime consumer in code (this is a legal/design-process doc, not a runtime-loaded data source). `[high]`
↔ relates to: §9 Compliance Checklists, CLAUDE.md (item 5 of stack), GAME_DESIGN.md, MODULE_SYSTEM.md §4.5 module.json

### [PD-SAFETY]

**Q:** Is the non-renewal position legally binding for third parties (e.g., a Steam Workshop module author or a community contributor)?
**A:** **No.** §1.2 states explicitly: "This is the project's adopted policy, not legal advice; third parties should run their own review." The 2026-04-30 expansion adopted the non-renewal-friendly stance for *Weird Tales* 1934–1936 issues based on the conventional scholarly view that those issues were not issue-renewed and Howard's individual contributions were not separately renewed. That stance is sufficient for the project's content-sourcing decisions, but anyone publishing under the Living Eamon brand is held to it (via repo policy + the §9 checklist), and anyone publishing independently must run their own audit. Steam Workshop / Itch.io community uploads, if they ever happen (per `MODULE_SYSTEM.md` modding-friendliness rationale), would need a contributor agreement that names Public_Domain_Rules.md as the binding policy AND a per-upload PD-status declaration in module.json. Without that, a hostile-actor module could expose the project to indemnity claims it can't satisfy. `[high]`
↔ relates to: §1.2 (project policy not legal advice), §9 Compliance Checklists, MODULE_SYSTEM.md §4.5 (publicDomainSource field), EV-module_system-002 (community contract migration)

### [INK-AUTHORING]

**Q:** Is there an automated check that flags PD-violation candidates in module prose before commit?
**A:** A `tools/pd-lint/` script walks all `.ink` files + `module.json` + module READMEs and scans for the §2.1 trademark list (Conan / Cimmerian / Hyborian / Cimmeria / Hyboria) plus the Bucket B character lookup table from §6.2. The lint runs in `prebuild` alongside `validate-modules` + `gpe:all --strict`. Implementation details (Aquilonia handling, per-rule allowlists, marketing-vs-prose context tagging) are deferred to the tooling sprint. `[high]`
↔ relates to: §9 Compliance Checklists, MODULE_SYSTEM.md §3 prebuild hooks, GAME_DESIGN.md top-of-file Safe Harbor / Radioactive tables

### [PD-SAFETY]

**Q:** What does the 2027 non-renewal audit for *Weird Tales* 1932–1933 issues actually entail — who runs it, what sources, what would move stories early?
**A:** Medium. §3.2 declares "2027 review: verify *Weird Tales* 1932 issue non-renewal" but no methodology, sourcing strategy, or who-does-the-work is specified. Best guess for the methodology: same approach as the 2026-04-30 audit that moved 1934–1936 stories — search the U.S. Copyright Office renewal records (Catalog of Copyright Entries, 1959–1962 windows for 1932–1933 first-publications), Project Gutenberg's existing Howard research notes, and the standing scholarly consensus on *Weird Tales* renewal practices. The audit needs to verify both (a) the magazine issue was not issue-renewed and (b) Howard's individual contributions were not separately renewed (Howard died 1936 and his estate's renewal practices are uneven). Recommendation: schedule the audit in `LAUNCH_CRITERIA.md` Tier 2 with a 2027-Q1 calendar trigger; results go into a new §11 (Document History) entry plus a Bucket A migration if confirmed. `[medium]` → see [EV-public_domain_rules-002](EDGE_VECTORS.md#ev-public_domain_rules-002)
↔ relates to: §3.2 Future PD calendar, §8 Future PD Calendar (US), §10 Authority & Governance, project_pd_expansion_2026-04-30.md (audit precedent)

---

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

**Decision (2026-04-30):** Living Eamon adopts the **non-renewal
position** for the relevant *Weird Tales* 1934–1936 issues. Those
issues were not issue-renewed, and Howard's individual contributions
were not separately renewed. The conventional scholarly view is that
those stories are in the United States public domain. Living Eamon
treats them as such for content-sourcing purposes. This is the
project's adopted policy, not legal advice; third parties should run
their own review.

Howard's works therefore fall into three buckets:

**Bucket A — currently in US public domain** (verified non-renewal of original magazine copyright):

*Already-PD via Phantagraph non-renewal:*
- **"The Hyborian Age"** (essay, serialized across *The Phantagraph* Feb, Aug, and Oct–Nov 1936 issues). *The Phantagraph* was a tiny amateur fan publication; under the 1909 Copyright Act, material appearing there without proper notice and renewal automatically entered PD. No renewal occurred. Project Gutenberg hosts the full text with explicit confirmation that exhaustive research found no US registration or renewal. **Freely usable in full.**
- **"Always Comes Evening"** (poem, *The Phantagraph* Aug 1936 issue). Same status. Freely usable.
- **"Song at Midnight"** / **"Man, the Master"** (poem, *The Phantagraph* Aug 1940 issue, posthumous publication of earlier work). Same status. Freely usable.

*Already-PD via Weird Tales 1929–1930 non-renewal:*
- **"The Shadow Kingdom"** (Kull story, *Weird Tales* Aug 1929). Issue copyright was not renewed; story entered PD. Freely usable.
- **"The Mirrors of Tuzun Thune"** (Kull story, *Weird Tales* Sept 1929). Same status. Freely usable.
- **"Kings of the Night"** (Kull / Bran Mak Morn, *Weird Tales* Nov 1930). Same status. Freely usable.

*Already-PD via Weird Tales 1934–1936 non-renewal* (project-adopted 2026-04-30):
- **"Iron Shadows in the Moon" / "Shadows in the Moonlight"** (*Weird Tales* Apr 1934)
- **"Queen of the Black Coast"** (*Weird Tales* May 1934)
- **"The Haunter of the Ring"** (Conrad & Kirowan occult story, *Weird Tales* Jun 1934)
- **"The Devil in Iron"** (*Weird Tales* Aug 1934)
- **"The People of the Black Circle"** (*Weird Tales* Sep–Nov 1934, three-part serial)
- **"A Witch Shall Be Born"** (*Weird Tales* Dec 1934)
- **"The Grisly Horror" / "Moon of Zambebwei"** (Southern gothic, *Weird Tales* Feb 1935)
- **"Jewels of Gwahlur" / "Teeth of Gwahlur"** (*Weird Tales* Mar 1935)
- **"Beyond the Black River"** (*Weird Tales* May–Jun 1935, two-part serial)
- **"Shadows in Zamboula" / "Man-Eaters of Zamboula"** (*Weird Tales* Nov 1935)
- **"The Hour of the Dragon"** (*Weird Tales* Dec 1935 – Apr 1936, five-part serial — the only full-length Conan novel Howard wrote)
- **"Black Canaan"** (Southern gothic, *Weird Tales* Jun 1936)
- **"Red Nails"** (*Weird Tales* Jul–Oct 1936, three-part serial — published shortly after Howard's death in June 1936)
- **"Black Hound of Death"** (Southern gothic, *Weird Tales* Nov 1936)
- **"The Fire of Asshurbanipal"** (desert / Lovecraftian, *Weird Tales* Dec 1936)

These unlock the named characters (Bêlit, Valeria, Olivia, Yasmina, Salome,
Taramis, Bît-Yakin, Muriela, Balthus, Tascela, Acheron, Xaltotun, Heart of
Ahriman, Pelias, Yag-Kosha, etc.), settings (Vendhya, Khauran, Vilayet
Sea, Black Coast, Zamboula, Xuchotl), and plot elements of all 15 stories
for use in Living Eamon prose, NPC names, and module narrative — subject
to the **trademark restrictions in §2 and the customization discipline
in §4.4** (Conan / Cimmerian / Hyborian still scrubbed; player replaces
Conan as protagonist where Howard used him; "inspired by" framing for
all module derivations).

**Bucket B — copyright-protected pending non-renewal verification or 2028+ unlock:**

Howard's earlier-published Conan stories (1932–1933 *Weird Tales* issues)
are not yet covered by the project's 2026-04-30 non-renewal audit. They
remain in Bucket B until either:
- non-renewal is verified for those specific *Weird Tales* issues (in
  which case they would move to Bucket A), or
- the 95-year clock unlocks them automatically (2028 for the 1932
  stories, 2029 for the 1933 stories).

Affected stories include: *The Phoenix on the Sword* (1932), *The Scarlet
Citadel* (1932), *The Tower of the Elephant* (1933), *Black Colossus*
(1933), *The Slithering Shadow* (1933), *The Pool of the Black One*
(1933), *Rogues in the House* (1933), *The Frost-Giant's Daughter* /
*Gods of the North* (1934, March issue — pending audit confirmation).

Specific unique elements only attested in these stories (e.g., Yag-Kosha
appears in *Tower of the Elephant* 1933 — wait until 2029 unless that
1933 issue's non-renewal is confirmed) should be scoped per source
verification.

**Bucket C — trademark-protected forever:**

See §2. Trademark-protected character / setting marks (Conan, Cimmerian,
Hyboria) **never** lift, regardless of any underlying story's PD status.

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

### 3.1 Current posture (as of 2026-04-30)

**Player-facing branding:**
- Game title: **"Living Eamon"** (no reference to Conan, Hyboria, or Howard in the title itself)
- Setting: **Aurelion** (invented city) and **Valus, the City of Wonders** (canonical Thurian-Age capital of Valusia)
- Narrative frame: sword-and-sorcery, Thurian Age, Howard-voice
- Disclaimer footer: "Inspired by works by Robert E. Howard now in the public domain. Not affiliated with Conan Properties Inc."

**Content sourcing:**
- Draw freely from the "Always Safe Corpus" (§5) and the **expanded
  Bucket A** in §1.2 (Howard's *Weird Tales* 1929–1930 + 1934–1936
  stories per the project's adopted non-renewal position).
- **Hyborian-era kingdoms and peoples** named in the 1936 essay
  (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, Turan,
  Hyrkania, Vendhya, Vanaheim, Asgard, etc.) are public domain and
  usable in narrative prose.
- **Newly available** as of 2026-04-30: named characters and settings
  from the 15 Bucket A *Weird Tales* 1934–1936 stories — Bêlit,
  Valeria, Olivia, Yasmina, Salome, Taramis, Bît-Yakin, Muriela,
  Balthus, Tascela, Acheron, Xaltotun, Heart of Ahriman, Pelias,
  Khauran, Vendhya, the Vilayet Sea, Black Coast, Zamboula, Xuchotl,
  etc. Subject to **§4.4 customization discipline** (heavy
  re-imagining, "inspired by" framing, player replaces Conan as
  protagonist where Howard used him).
- **Trademark forbidden** regardless of copyright status: "Conan,"
  "Conan the Barbarian," "Cimmerian," "Cimmerians," "Hyboria,"
  "Hyborian Age," "Hyborian" as marketing adjective (see §2.1).
  These are **scrubbed from all module prose, lore, and marketing**,
  even when the underlying source story is PD.

**Why this works:**
- The expanded Bucket A gives us 15 additional adventure-module
  candidates, each with rich settings + non-Conan characters that
  Living Eamon can foreground.
- The "inspired by" customization discipline (§4.4) ensures each
  module is a substantial Living Eamon original rather than an
  adaptation — replacing Conan with the player as protagonist is
  the design pillar, not a nitpicked substitution.
- CPI's trademark portfolio constrains *branding*, not *use* — we
  obey it in marketing while using the underlying PD lore in the
  game.
- The full module roster and per-module customization plans live in
  [`ADVENTURE_MODULES_PLAN.md`](ADVENTURE_MODULES_PLAN.md).

### 3.2 Future PD calendar (1932–1933 stories)

The 1932–1933 Conan stories (still in §1.2 Bucket B) are scheduled
to enter PD on the 95-year clock starting 2028, OR could move to
Bucket A earlier if the project's non-renewal audit extends to
their *Weird Tales* issues. Action items:

- **2027 review:** verify *Weird Tales* 1932 issue non-renewal (would
  unlock *The Phoenix on the Sword*, *The Scarlet Citadel* early).
- **2027 review:** verify *Weird Tales* 1933 issue non-renewal (would
  unlock *The Tower of the Elephant*, *Black Colossus*, *Rogues in
  the House*, *The Slithering Shadow*, *The Pool of the Black One*,
  etc., early — and Yag-Kosha as a named character).
- **2028 fallback:** absent earlier non-renewal confirmation, the
  1932 stories enter PD on the 95-year clock; 1933 stories follow
  in 2029.

Trademark restrictions (§2) persist forever regardless of unlock.

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
- "Aurelion," "Valus, the City of Wonders" (Thurian-Age canonical)
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

### 4.4 Story Content & Adventure Design (Customization Discipline)

Every Living Eamon adventure module is **inspired by** its Howard
source — not an adaptation. Standing directive (Scotch, 2026-04-30):

> *"It's also best that we customize these stories significantly for
> our use in an adventure module. so we can say 'inspired by' these
> stories. … We use a lot of the same words, style, language and
> descriptions but we don't reprint it word-for-word."*

**The customization rules:**

1. **The player IS the hero.** Where Howard's stories starred Conan,
   Living Eamon's adaptations recast the role for the player character.
   This is the design pillar — not a name swap, but a replacement of
   the protagonist function with the player's PICSSI-driven decisions.
2. **Original prose in Howard's voice register.** Module text is
   newly written in Howard's vocabulary and atmospheric register
   (spare Anglo-Saxon, Frazetta-shadowed imagery, lone-hero tone).
   We do not reprint Howard's sentences. We do not closely paraphrase
   his prose.
3. **Heavy plot mutation.** Each module's plot diverges substantially
   from its source — multi-ending PICSSI branches, ally NPCs that
   live or die based on player choice, faction puzzles where Howard
   had a single thread.
4. **Trademark scrub.** "Conan," "Cimmerian," "Hyborian" are removed
   from all module prose. The 1936 essay's other kingdom names
   (Aquilonia, Stygia, Nemedia, Zamora, Koth, Shem, Kush, Turan,
   Hyrkania, Vendhya) remain safe in narrative.
5. **Atlantean wonder-tech accents.** Living Eamon's Atlantis is the
   age of wonders (canon as of 2026-04-30) — pre-Cataclysmic tech
   (gunpowder, steam-engines, energy-crystal devices, automata,
   beam-weapons) appears as dormant, broken, or revered-as-magic
   relics in module ruins. This is a Living Eamon worldbuilding
   layer atop Howard's source material.
6. **Disclaimers.** Each module's README cites its source story as
   "Inspired by [title] (Robert E. Howard, *Weird Tales* [date])"
   and notes the project's PD-status reasoning per §1.2.

**Safe:**
- Adapting any Bucket A story (§1.2) into a Living Eamon module per
  the rules above.
- Using PD-safe character names and settings as NPCs, locations, and
  Chronicle entries.
- Citing Howard in adventure intros ("Inspired by [title], Robert E.
  Howard, 1934").

**Unsafe:**
- Reproducing Bucket B story content before that story moves to
  Bucket A.
- Verbatim or close-paraphrase prose from any source.
- Naming a module after a copyrighted Conan story title verbatim
  (use a derivative title; see ADVENTURE_MODULES_PLAN.md §3 for the
  Living Eamon module-name conventions).
- Using "Conan," "Cimmerian," "Hyborian" / "Hyboria" in any
  player-facing or marketing surface (forever — trademark, not
  copyright).

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

## § 6 — What Is NOT Public Domain

Two categories of restriction remain after the 2026-04-30 PD expansion:

### 6.1 Trademark-protected forever (§2)

"Conan," "Conan the Barbarian," "Cimmerian," "Cimmerians," "Cimmeria,"
"Hyboria," "Hyborian Age," and "Hyborian" as a marketing adjective are
**permanent trademarks** held by Cabinet Entertainment / Heroic
Signatures / Conan Properties Inc. They never enter PD. They are
scrubbed from all Living Eamon module prose, lore, and marketing —
even in adventures derived from Bucket A stories where Howard used
these terms.

### 6.2 Bucket B — copyright-protected pending audit or 95-year unlock

The 1932–1933 *Weird Tales* Conan stories are not yet covered by the
project's adopted non-renewal audit. They remain protected until either
non-renewal is confirmed for those issues OR the 95-year clock unlocks
them (2028 / 2029).

Specifically:

| Element | Source story | Earliest available date |
|---|---|---|
| Yag-Kosha (as a named character) | *The Tower of the Elephant* (Mar 1933) | 2029 (or sooner if 1933 *WT* non-renewal is confirmed) |
| Thoth-Amon | First major appearance *The Phoenix on the Sword* (1932) | 2028 (or sooner if 1932 *WT* non-renewal is confirmed) |
| *The Phoenix on the Sword* / *The Scarlet Citadel* | *Weird Tales* 1932 issues | 2028 (or sooner) |
| *The Tower of the Elephant*, *Black Colossus*, *Rogues in the House*, *The Slithering Shadow*, *The Pool of the Black One*, *The Frost-Giant's Daughter* | *Weird Tales* 1933 issues | 2029 (or sooner) |

**Note:** *Queen of the Black Coast* (May 1934) introduces Bêlit and
Yag-Kosha-as-a-physical-presence, and *Red Nails* (1936) introduces
Valeria, Tascela, and Xuchotl. Those four characters are in Bucket A
(2026-04-30 audit). Yag-Kosha-as-named-figure traces back to *Tower of
the Elephant* (1933 — Bucket B), so a strict reading would defer
Yag-Kosha-as-named until 1933 issue non-renewal is confirmed; a
practical reading (the project's working stance) treats Yag-Kosha as
usable via the 1934 *Queen of the Black Coast* appearance, where the
character is fully described.

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

After the 2026-04-30 expansion, most of Howard's catalogue is already
in Bucket A (§1.2). Only the 1932–1933 stories remain in Bucket B.

| Source year | Howard works | Status |
|---|---|---|
| 1929 | "The Shadow Kingdom," "The Mirrors of Tuzun Thune" | ✅ PD (non-renewal + 95-year) |
| 1930 | "Kings of the Night" | ✅ PD |
| 1932 | "The Phoenix on the Sword," "The Scarlet Citadel" | ⬜ Pending 1932 *WT* non-renewal audit OR 2028 95-year unlock |
| 1933 | 1933 Conan stories ("Tower of the Elephant," "Black Colossus," "The Slithering Shadow," "The Pool of the Black One," "Rogues in the House," etc.) | ⬜ Pending 1933 *WT* non-renewal audit OR 2029 95-year unlock |
| 1934 | "Iron Shadows in the Moon," "Queen of the Black Coast," "The Haunter of the Ring," "The Devil in Iron," "The People of the Black Circle," "A Witch Shall Be Born" | ✅ PD (non-renewal, project audit 2026-04-30) |
| 1935 | "The Grisly Horror," "Jewels of Gwahlur," "Beyond the Black River," "Shadows in Zamboula," "The Hour of the Dragon" (Dec 1935 → Apr 1936 serial) | ✅ PD (non-renewal, project audit 2026-04-30) |
| 1936 | "Black Canaan," "Red Nails," "Black Hound of Death," "The Fire of Asshurbanipal," + 1936 portions of *Hour of the Dragon* serial | ✅ PD (non-renewal, project audit 2026-04-30) |

**Re-check audit each January.** The project's non-renewal audit is the
basis for most of Bucket A; specific story moves should be re-confirmed
annually as scholarship progresses.

Always-PD works (additional to the *Weird Tales* corpus): the *Hyborian
Age* essay + 2 *Phantagraph* poems. See §5.

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

- **April 30, 2026** — **Bucket A expansion via non-renewal audit.** Project adopted the non-renewal position for *Weird Tales* 1934–1936 issues and Howard's individual contributions therein. Fifteen stories moved from Bucket B to Bucket A: ten Conan-era stories (*Iron Shadows in the Moon*, *Queen of the Black Coast*, *The Devil in Iron*, *The People of the Black Circle*, *A Witch Shall Be Born*, *Jewels of Gwahlur*, *Beyond the Black River*, *Shadows in Zamboula*, *The Hour of the Dragon*, *Red Nails*) plus five non-Hyborian late stories (*The Haunter of the Ring*, *The Grisly Horror / Moon of Zambebwei*, *Black Canaan*, *Black Hound of Death*, *The Fire of Asshurbanipal*). Trademark restrictions (Conan / Cimmerian / Hyborian) preserved unchanged — these are permanent regardless of any underlying story's PD status. §4.4 added "inspired by" customization discipline. Cross-document: full per-module roadmap lives in [`ADVENTURE_MODULES_PLAN.md`](ADVENTURE_MODULES_PLAN.md).
- **April 19, 2026** — Consolidated `lore/hyborian-pd/PD_RESEARCH.md` into this file and deleted it. Confirmed via Project Gutenberg research that *The Phantagraph* pieces (Hyborian Age essay + "Always Comes Evening" + "Song at Midnight") have no US copyright registration or renewal and are freely usable. Resolved prior internal contradictions about Aquilonia / Stygia / Nemedia (now confirmed PD via essay). Tightened trademark-radioactive list per project policy.
- **April 18, 2026** — Prior version with split `PD_RESEARCH.md`.

**Last updated:** April 30, 2026
**Next review:** January 1, 2027
