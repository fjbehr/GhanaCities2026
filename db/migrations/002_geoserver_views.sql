-- Views published by GeoServer (prefix gs_). Districts carry their indicators as
-- attributes, so WMS GetFeatureInfo and WFS downloads include the figures.

CREATE VIEW gs_district AS
SELECT
	d.shape_id,
	d.name,
	d.region,
	d.city_slug,
	round(d.area_km2::numeric, 1) AS area_km2,
	round(max(i.value) FILTER (WHERE i.key = 'population'))::integer AS population,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_2km_health')::numeric, 1) AS health_2km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_5km_health')::numeric, 1) AS health_5km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_2km_school')::numeric, 1) AS school_2km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_5km_school')::numeric, 1) AS school_5km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_2km_market')::numeric, 1) AS market_2km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_within_5km_market')::numeric, 1) AS market_5km_pct,
	round(max(i.value) FILTER (WHERE i.key = 'pop_low_lying')::numeric, 1) AS pop_low_lying_pct,
	round(max(i.value) FILTER (WHERE i.key = 'area_low_lying')::numeric, 1) AS area_low_lying_pct,
	round(max(i.value) FILTER (WHERE i.key = 'area_surface_water')::numeric, 1) AS surface_water_pct,
	round(max(i.value) FILTER (WHERE i.key = 'landcover_built')::numeric, 1) AS built_cover_pct,
	round(max(i.value) FILTER (WHERE i.key = 'landcover_tree')::numeric, 1) AS tree_cover_pct,
	round(max(i.value) FILTER (WHERE i.key = 'built_up_km2' AND i.period = '1975')::numeric, 1) AS built_up_1975_km2,
	round(max(i.value) FILTER (WHERE i.key = 'built_up_km2' AND i.period = '2000')::numeric, 1) AS built_up_2000_km2,
	round(max(i.value) FILTER (WHERE i.key = 'built_up_km2' AND i.period = '2020')::numeric, 1) AS built_up_2020_km2,
	round(max(i.value) FILTER (WHERE i.key = 'built_up_km2' AND i.period = '2030')::numeric, 1) AS built_up_2030_km2,
	d.geom
FROM district d
LEFT JOIN indicator i ON i.district_id = d.shape_id
WHERE d.city_slug IS NOT NULL
GROUP BY d.shape_id;

CREATE VIEW gs_study_area AS
SELECT slug, name, region, bbox AS geom FROM city;

CREATE VIEW gs_poi_health AS
SELECT osm_type || osm_id AS osm_ref, kind, name, geom FROM poi WHERE category = 'health';
CREATE VIEW gs_poi_school AS
SELECT osm_type || osm_id AS osm_ref, kind, name, geom FROM poi WHERE category = 'school';
CREATE VIEW gs_poi_market AS
SELECT osm_type || osm_id AS osm_ref, kind, name, geom FROM poi WHERE category = 'market';
CREATE VIEW gs_poi_water AS
SELECT osm_type || osm_id AS osm_ref, kind, name, geom FROM poi WHERE category = 'water';
