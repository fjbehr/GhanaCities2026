-- Boundaries for the whole country (not only the five study areas), for map clients that
-- serve rural users: all districts (MMDAs) and the regions.

CREATE VIEW gs_district_all AS
SELECT
	d.shape_id,
	d.name,
	d.region,
	round(d.area_km2::numeric, 1) AS area_km2,
	d.geom
FROM district d;

CREATE VIEW gs_region AS
SELECT r.shape_id, r.name, r.geom FROM region r;
