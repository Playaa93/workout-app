-- Full-text + fuzzy search for foods table

-- 1. pg_trgm for typo-tolerant fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_foods_name_fr_trgm ON foods USING GIN (name_fr gin_trgm_ops);

-- 2. unaccent for accent-insensitive search (roti = rôti)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 3. Custom French text search config with unaccent support
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent') THEN
    CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
    ALTER TEXT SEARCH CONFIGURATION french_unaccent
      ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;
  END IF;
END $$;

-- 4. Generated tsvector column for full-text search (weighted: name A, brand B)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french_unaccent', coalesce(name_fr, '')), 'A') ||
    setweight(to_tsvector('french_unaccent', coalesce(brand, '')), 'B')
  ) STORED;

-- 5. GIN index on the search_vector
CREATE INDEX IF NOT EXISTS idx_foods_search_vector ON foods USING GIN (search_vector);
