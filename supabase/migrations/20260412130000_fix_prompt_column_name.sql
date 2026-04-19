-- Fix column name to match prod: prompt → prompt_used
ALTER TABLE scene_image_cache RENAME COLUMN prompt TO prompt_used;
ALTER TABLE grok_imagine_error_log RENAME COLUMN prompt TO prompt_used;
