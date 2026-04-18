# Public Domain Rules & Safe Harbor Strategy

**CRITICAL: All Claude sessions must read this document before any design or development work.**

This document establishes the legal framework for using Robert E. Howard's public domain works safely within Living Eamon. It supersedes general copyright knowledge and must be consulted before introducing any new content, names, locations, items, or mechanics derived from Howard's catalogue.

---

## § 1 — The Core Legal Landscape

### 1.1 European Union
- **Status:** Full public domain across all EU jurisdictions
- **Timeline:** EU copyright = life of author + 70 years. Howard died 1936; works entered PD in 2006–2007
- **Scope:** Hyborian Age essay, all Conan and Kull stories, character names, locations, plot elements, prose
- **Liability:** Zero IP risk for EU-facing content

### 1.2 United States
- **Status:** Phased entry starting January 1, 2028
- **Timeline:** US copyright = 95 years from publication
  - **2028:** Works published 1933 enter PD (Conan stories from *Weird Tales*, 1933)
  - **2029–2032:** Progressive rollout (one year of stories per year)
  - **Pre-2028:** RISKY — all Conan/Kull content still under copyright
- **Current risk:** Using Conan IP in US-facing content before 2028 = copyright infringement
- **Safe content until 2028:** Hyborian Age essay + 3 Thurian Age stories (verified non-renewed)
- **Post-2028:** Phased unlock — use the copyright tracking table in `lore/hyborian-pd/PD_RESEARCH.md` annually

### 1.3 Other Jurisdictions
- **Canada, UK, Australia:** Generally align with US (95-year rule or life+50)
- **Japan, South Korea:** Shorter terms (50–60 years)
- **China:** Weaker IP enforcement; not a primary concern for Living Eamon's compliance strategy
- **Strategy:** Default to US rules (most restrictive) for all geographies except EU

---

## § 2 — Trademark vs. Copyright (CRITICAL DISTINCTION)

**Trademark rights DO NOT expire.** Even after copyright lapses, brand enforcement continues indefinitely.

### 2.1 Protected Trademarks (Conan Properties Inc.)

The following marks are actively monitored and enforced by Conan Properties Inc., even for non-infringing uses:

| Mark | Status | Usage Risk |
|------|--------|-----------|
| **CONAN** | Registered trademark | ✗ FORBIDDEN in titles, game names, branding |
| **HYBORIA / HYBORIAN AGE** | Registered trademark | ✗ FORBIDDEN in titles, game names, branding |
| **Conan the Barbarian** | Registered trademark | ✗ FORBIDDEN in any player-facing name |
| "Conan universe" colloquial use | Trademark via usage | ✗ Avoid in promotional material |

**These apply FOREVER.** Even when the underlying stories enter PD, the marks remain protected.

### 2.2 Safe Internal Usage

- Using Hyborian Age as a **setting reference internally** (code comments, design documents, memory) = zero risk
- Attributing stories to "Robert E. Howard" in internal documentation = protected by fair use
- Creating **derivative worlds inspired by Howard** (Aurelion, Thurian Base, Age of the Lion) = safe

---

## § 3 — The Safe Harbor Strategy for Living Eamon

### 3.1 Phase 1: Pre-2028 (Current — "Living Eamon" / Thurian Base)

**Player-facing branding:**
- Game title: **"Living Eamon"** (no reference to Conan, Hyboria, or Howard)
- Setting: **Aurelion** (invented city) in the Thurian Age
- Internal reference: Thurian Age ruleset, Conan-inspired aesthetics, non-copyright-infringing content

**Content sourcing:**
- Draw exclusively from:
  - *Hyborian Age* essay (world-building, racial histories, geography)
  - *The Shadow Kingdom* (Kull story, fully PD, character names/locations)
  - *The Mirrors of Tuzun Thune* (fully PD)
  - *Kings of the Night* (fully PD, cross-time narrative)
  - Original Living Eamon creations (NPCs, adventures, items)
- **Avoid entirely:** Any Conan story, Conan character names, Conan locations (Aquilonia, Nemedia, Stygia, Tarantia)

**Why this works:**
- Thurian Age is Howard's pre-catastrophe setting with different characters, races, and tone
- Kull and Bran Mak Morn stories are fully PD with zero trademark risk
- Aurelion is invented; Tarantia is trademark-protected
- No licensing agreement needed

### 3.2 Phase 2: Post-2028 ("Age of the Lion" / Hyborian Modules)

**When:** January 1, 2028 (or as stories enter PD annually through 2032)

**Player-facing expansion:**
- **Modular unlock:** "Age of the Lion" content appears as a new playable module/saga
- **Branding:** "Living Eamon: Age of the Lion" or "Living Eamon — Hyborian Era" (NOT "Conan Eamon")
- **Setting:** Tarantia, Aquilonia, and other Hyborian locations (once copyright clears)
- **Characters:** Named Conan-era protagonists from newly-PD stories

**Licensing & legal:**
- Verify copyright status 6 months before launch via `lore/hyborian-pd/PD_RESEARCH.md`
- Add disclaimer: "Based on works by Robert E. Howard, now in the public domain in [jurisdiction]. Not affiliated with Conan Properties Inc."
- Do NOT use "Conan," "Hyboria," or "Hyborian Age" in promotional titles or marketing

**Technical implementation:**
- "Age of the Lion" is a **feature flag** in the code: `enableHyborianaModules` or similar
- Modules activate only when copyright status verified
- Database migrations tie modules to launch date, not retroactive player state

---

## § 4 — Concrete Rules for Living Eamon Development

### 4.1 Player-Facing Content (Website, Game Title, Marketing)

❌ **DO NOT USE:**
- "Conan" (any form)
- "Hyboria" / "Hyborian Age"
- "Tarantia" (before 2028)
- Character names from Conan stories (before their copyright clears)

✅ **USE INSTEAD:**
- "Living Eamon"
- "Aurelion" (invented city)
- Original NPC names or names from Thurian Age stories
- "Inspired by Sword & Sorcery classics" in marketing
- "Based on Robert E. Howard's public domain works" in disclaimers

### 4.2 Internal Code & Design Documents

✅ **OK (zero risk):**
- Referencing Howard's works in comments, design docs, git history
- Using "Hyborian Age" in memory/CLAUDE_CONTEXT.md
- Attributing setting inspiration to Howard
- Tracking PD status in `lore/hyborian-pd/PD_RESEARCH.md`

❌ **AVOID (sloppy, bad precedent):**
- Using Conan story character names in code before copyright clears
- Hard-coding "Tarantia" if using it pre-2028 (use `AURELION_CITY_NAME` const instead)
- Merging trademark-protected content into main branch before 2028

### 4.3 Item, NPC, and Location Naming

**If the name comes from a story:**
1. Check `lore/hyborian-pd/PD_RESEARCH.md` for copyright status
2. If PD: use it freely, document the source
3. If NOT PD: invent a derivative name or wait until it enters PD

**Example:**
- "Tuzun Thune" (the wizard from *Mirrors of Tuzun Thune*) = PD, usable immediately
- "King Conan of Aquilonia" = NOT PD until 2028, **do not use**
- "Aurelion's Grand Artificer" (original) = always safe

### 4.4 Story Content & Adventure Design

**Safe practices:**
- Adapt Thurian Age story plots into adventure modules (all 3 are PD)
- Use Hyborian Age geography + invent new NPCs, quests, and outcomes
- Cite Howard's work in adventure intros ("In the tradition of Robert E. Howard")

**Unsafe practices:**
- Reproducing Conan story plots directly before copyright clears
- Naming adventures after Conan stories
- Wholesale copying prose from non-PD works

---

## § 5 — The "Always Safe" Corpus (Immediately Usable)

These works require zero legal review and are safe to use in entirety:

1. **Hyborian Age essay** — Setting, history, racial profiles, geography
2. **The Shadow Kingdom** (Kull, *Weird Tales* 1929) — Full story, characters, locations, plot
3. **The Mirrors of Tuzun Thune** (Kull, *Weird Tales* 1929) — Full story, characters, plot
4. **Kings of the Night** (Kull/Bran Mak Morn, *Weird Tales* 1930) — Full story, characters, plot

Everything else requires annual verification against `lore/hyborian-pd/PD_RESEARCH.md`.

---

## § 6 — Monitoring & Compliance Checklist

### Before Each New Session
- [ ] Claude has read this file (REHYDRATION instruction in CLAUDE_CONTEXT.md)
- [ ] Any new location names checked against PD_RESEARCH.md
- [ ] Any NPC names from Howard's works verified for copyright status
- [ ] No Conan IP used in player-facing content before 2028

### Before Each Public Deployment (Vercel push)
- [ ] No trademark violations (CONAN, HYBORIA, Hyborian Age)
- [ ] Disclaimer present if using any PD Howard content
- [ ] Code contains no hard-coded Conan-era content before copyright clears
- [ ] Feature flags ready for 2028 Hyborian unlock

### Before Each Adventure Module Launch
- [ ] Source material verified as PD in PD_RESEARCH.md
- [ ] NPC names spot-checked for copyright status
- [ ] If Hyborian content: verify year ≥ 2028
- [ ] Attribution in module header
- [ ] Legal review by Scotch (non-technical, final authority)

---

## § 7 — FAQ & Edge Cases

**Q: Can I use "Aquilonia" in code or memory?**
A: Yes, in internal/hidden content. NO in player-facing titles or marketing before copyright clears. Post-2028, use freely.

**Q: What if a PD story has a character also in non-PD stories?**
A: Use only the incarnation in the PD story. Example: If "King Valusia" appears in both *Shadow Kingdom* (PD) and a 1934 Conan story (not yet PD), reference only the *Shadow Kingdom* version.

**Q: Can I advertise Living Eamon as "a Conan-like game"?**
A: NO. Marketing risk. Use: "Inspired by classic sword & sorcery" or "In the tradition of Sword & Sorcery adventure games."

**Q: What if Conan Properties sues us?**
A: The Safe Harbor strategy is designed to avoid this. But if it happens:
1. Living Eamon brand (trademark, domain, branding) is safe (not infringing)
2. Any Thurian/PD content is defensible
3. Pre-2028 Hyborian modules would be at risk (justification: feature was locked to post-2028)
4. Disclaimers + public availability of sources protect fair use argument

---

## § 8 — Future Calendar (When Things Enter PD)

| Year | Works | Status |
|------|-------|--------|
| Now (2026) | Hyborian Age essay, 3 Thurian stories | ✅ Use freely |
| 2028 | All works published before 1933 | ✅ Use freely |
| 2029–2032 | 1934–1938 works (annual cohorts) | ✅ Unlock as calendar passes |
| 2032+ | Full Howard catalogue | ✅ Unrestricted |

Update `lore/hyborian-pd/PD_RESEARCH.md` each January with new entries as they enter PD.

---

## § 9 — Authority & Governance

**Legal authority:** Scotch (founder/non-technical) has final sign-off on any IP decisions that touch marketing, branding, or public-facing content.

**Claude authority:** This document is binding for all content design and development decisions. Cite this document when rejecting trademark-infringing feature requests.

**Review cadence:** This file is reviewed annually (January) to reflect new PD entries and legal changes.

---

**Last updated:** April 18, 2026  
**Next review:** January 1, 2027  
**Author:** Living Eamon Development Team (Scotch + Claude)
