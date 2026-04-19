-- Stock of finite charity barrels in the Main Hall.
-- Decrements per item taken. Default: 20 gowns, 10 mixed clothing pieces.
ALTER TABLE players ADD COLUMN IF NOT EXISTS barrel_stock jsonb
  DEFAULT '{"gowns": 20, "charityClothes": 10}'::jsonb NOT NULL;
