-- Core schema. PostGIS and postgis_raster are created by db/setup.ts (superuser).

CREATE TABLE city (
	slug text PRIMARY KEY,
	name text NOT NULL,
	region text NOT NULL,
	center geometry(Point, 4326) NOT NULL,
	bbox geometry(Polygon, 4326) NOT NULL
);

-- geoBoundaries ADM1 (regions)
CREATE TABLE region (
	shape_id text PRIMARY KEY,
	name text NOT NULL,
	geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX region_geom_idx ON region USING gist (geom);

-- geoBoundaries ADM2 (MMDAs); city_slug is set for districts of the five study areas
CREATE TABLE district (
	shape_id text PRIMARY KEY,
	name text NOT NULL,
	region text,
	city_slug text REFERENCES city (slug),
	area_km2 double precision,
	geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX district_geom_idx ON district USING gist (geom);
CREATE INDEX district_city_idx ON district (city_slug);

-- Points of interest from OpenStreetMap (polygons reduced to a point on surface)
CREATE TABLE poi (
	osm_type char(1) NOT NULL CHECK (osm_type IN ('n', 'w', 'r')),
	osm_id bigint NOT NULL,
	category text NOT NULL CHECK (category IN ('health', 'school', 'market', 'water')),
	kind text NOT NULL,
	name text,
	tags jsonb NOT NULL DEFAULT '{}',
	geom geometry(Point, 4326) NOT NULL,
	PRIMARY KEY (osm_type, osm_id, category)
);
CREATE INDEX poi_geom_idx ON poi USING gist (geom);
CREATE INDEX poi_geog_idx ON poi USING gist ((geom::geography));
CREATE INDEX poi_category_idx ON poi (category);

-- Long-term indicators per city (district_id NULL) or per district
CREATE TABLE indicator (
	id bigserial PRIMARY KEY,
	city_slug text NOT NULL REFERENCES city (slug),
	district_id text REFERENCES district (shape_id),
	topic text NOT NULL CHECK (topic IN ('flood', 'heat-air', 'services', 'environment')),
	key text NOT NULL,
	period text NOT NULL DEFAULT '',
	value double precision,
	unit text NOT NULL,
	source text NOT NULL,
	computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX indicator_uniq ON indicator (city_slug, coalesce(district_id, ''), key, period);

-- Cache for live API responses (Open-Meteo, FIRMS)
CREATE TABLE api_cache (
	key text PRIMARY KEY,
	payload jsonb NOT NULL,
	fetched_at timestamptz NOT NULL DEFAULT now(),
	expires_at timestamptz NOT NULL
);
