-- Track first visit to the Athenaeum (Zim's intro fires once)
ALTER TABLE players ADD COLUMN IF NOT EXISTS met_zim boolean DEFAULT false;
