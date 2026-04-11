-- Soft-delete and approval system for scene_image_cache.
-- deleted_at: non-null = soft-deleted (recoverable). Cache checks filter on deleted_at IS NULL.
-- approved: true = user has accepted this image. Cannot be cleared without explicit request.
alter table public.scene_image_cache
  add column if not exists deleted_at timestamptz default null,
  add column if not exists approved boolean not null default false;
