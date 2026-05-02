# The Mirror of Endless Form

*A scrying-glass kept in the highest chamber of the Ma'atic Order's tower. Brass-rimmed, dark as still water. Those who look long enough are said to see the universe assembling itself, scale within scale, without bottom and without top.*

---

The Mirror is a Ma'atic teaching-instrument disguised as a scrying-pool. To gaze into it is to witness the doctrine that **observation sustains Being** in its most viscerally proven form: a single rule, applied without end, generating a coastline so detailed that no zoom ever finds the bottom. The pattern is *real* — there is no painted backdrop, no priestly trick — and the deeper one looks, the more the pattern reveals its own structure repeating, ornamented, never repeating.

The Order calls what the Mirror reveals **the Endless Form.** Outsiders sometimes name it after a long-dead mathematician of another world; the Order's scholars smile and do not correct them, because the name is less important than the lesson: every act of looking is an act of *participation* in what is looked at. The Mirror does not show you the universe. It shows you *that you are part of the seeing.*

Heroes who gaze into the Mirror for a full turn gain a small but lasting boost to Illumination, and a measurable easing of the Outer-Dark thinning effect. Heroes who refuse to look — who declare the Mirror a "trick of priests" — lose Spirituality and slide one step closer to the void. The Mirror does not punish; the void does.

---

## Implementation note (future sprint)

The Mirror's in-game render is a Mandelbrot-set visualization. Two paths considered:

1. **WebGL fragment shader** (~80 lines GLSL) — runs forever in-browser, infinite zoom feels genuinely magical, no asset weight. Recommended.
2. **Pre-rendered video** — simpler to ship; loop a 30–60s zoom sequence. Acceptable fallback.

The actual rendering is a future sprint. This file establishes the lore so the location, the item, and the doctrine are canonical before the mechanic lands.

---

## Cross-references

- `lore/maatic-library/book-of-the-perpetual-mystery.md` — the Order's doctrine companion
- Project memory `project_observation_sustains_being.md`
