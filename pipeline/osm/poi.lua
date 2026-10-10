-- osm2pgsql flex style: facilities used for the "Services & Access" indicators.
-- Areas and lines are reduced to their centroid; one object may count in several categories.

local pois = osm2pgsql.define_table({
    name = 'osm_poi_import',
    ids = { type = 'any', type_column = 'osm_type', id_column = 'osm_id' },
    columns = {
        { column = 'category', type = 'text', not_null = true },
        { column = 'kind', type = 'text', not_null = true },
        { column = 'name', type = 'text' },
        { column = 'tags', type = 'jsonb' },
        { column = 'geom', type = 'point', projection = 4326, not_null = true },
    }
})

local health_amenity = { hospital = true, clinic = true, doctors = true }
local health_care = {
    hospital = true, clinic = true, centre = true, doctor = true,
    birthing_centre = true, health_post = true
}
local water_amenity = { drinking_water = true, water_point = true }
local water_man_made = { water_well = true, water_tap = true }

-- Returns a list of { category, kind } pairs for an object's tags
local function classify(tags)
    local found = {}
    if health_amenity[tags.amenity] then
        found[#found + 1] = { 'health', tags.amenity }
    elseif health_care[tags.healthcare] then
        found[#found + 1] = { 'health', tags.healthcare }
    end
    if tags.amenity == 'school' then
        found[#found + 1] = { 'school', 'school' }
    end
    if tags.amenity == 'marketplace' then
        found[#found + 1] = { 'market', 'marketplace' }
    end
    if water_amenity[tags.amenity] then
        found[#found + 1] = { 'water', tags.amenity }
    elseif water_man_made[tags.man_made] then
        found[#found + 1] = { 'water', tags.man_made }
    end
    return found
end

local function insert(object, geom)
    for _, c in ipairs(classify(object.tags)) do
        pois:insert({
            category = c[1],
            kind = c[2],
            name = object.tags.name,
            tags = object.tags,
            geom = geom,
        })
    end
end

function osm2pgsql.process_node(object)
    if #classify(object.tags) > 0 then
        insert(object, object:as_point())
    end
end

function osm2pgsql.process_way(object)
    if #classify(object.tags) == 0 then return end
    if object.is_closed then
        insert(object, object:as_polygon():centroid())
    else
        insert(object, object:as_linestring():centroid())
    end
end

function osm2pgsql.process_relation(object)
    if object.tags.type == 'multipolygon' and #classify(object.tags) > 0 then
        insert(object, object:as_multipolygon():centroid())
    end
end
