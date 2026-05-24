-- Reset POINTS_EARNED badges that saturated at the smallint floor (-32768) in
-- the legacy (Supabase) system and were imported as orphaned fossils with no
-- corresponding track/vote rows in this database. Safe + idempotent: matches
-- nothing once cleared. Paired with 0001 (smallint -> integer) which prevents
-- the overflow from recurring.
UPDATE "badges" SET "score" = 0 WHERE "name" = 'POINTS_EARNED' AND "score" <= -32000;
