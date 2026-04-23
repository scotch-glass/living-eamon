-- Character Creation — store WHICH prescripted memory the hero carries.
--
-- The wizard no longer allows free-text backstory — the player must pick
-- one of the prescripted templates defined in lib/heroBackstories.ts.
-- Storing the template id (not just the text) lets Jane recognize which
-- divine memory the hero holds and weave it into scene narration and
-- side quests.
--
-- players.backstory (text) remains for quick display. The id is the
-- authoritative key into HERO_BACKSTORIES.

alter table public.players
  add column if not exists backstory_template_id text;
