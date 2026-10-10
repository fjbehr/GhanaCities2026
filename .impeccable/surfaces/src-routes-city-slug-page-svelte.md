---
version: 1
slug: "src-routes-city-slug-page-svelte"
primary_target: "src/routes/city/[slug]/+page.svelte"
related_targets: []
---

# City page (/city/[slug])

Mode: Operate. Confirmed by the user 2026-10-10.

## Job and outcome
- Residents (primary, phone, mobile data): within seconds, know whether anything in their city needs attention today and what to do.
- Decision-makers (secondary, often desktop): find the district table, method and downloads within one scroll.

## Structure
- Status area: city name, last update; alert banner only when a level is reached ("Not an official warning — check GMet / NADMO" + link); value tiles: feels-like + UV, air quality (PM2.5), rain next 24 h, Saharan dust, river discharge (GloFAS).
- Topic tabs: Flood & Rain · Heat & Air · Services & Access · Environment. Each: indicator cards with "What this means", one chart (e.g. 7-day rain, PM2.5 history), map panel.
- Map on demand: light static preview first; Masterportal loads only on tap; "Open full map" links to /map with the tab's layers.
- "For decision-makers" per tab: sortable district table, method note, CSV/GeoJSON downloads, WMS/WFS URLs, named data limitations.
- Layout: one column on phones; two columns from ~900 px (status + tiles left, tabs + map right); district table full width below. Wide screens use space side by side, never stretched phone layouts.

## States and ranges
- Loading: last cached values with skeletons. Stale: prominent "updated 3 h ago". Source down: tile says "Not available right now" + last value. Calm day: "Nothing unusual today", never an empty area. Harmattan season: dust tile moves up. FIRMS key missing: fire layer hidden, note on /data.
- 1 to ~16 districts per city.

## Constraints
- Levels from fixed, openly documented thresholds (defined in plan step 8, published on /data); colour always paired with word + icon.
- All copy centralised for later Twi / Ga / Dagbani.
- Freely licensed city photos must be sourced with attribution; none may be invented.
- Open: site name (working title "Ghana Cities"), exact typeface.

## Direction contract
THESIS: The city's conditions as a calm, impeccably built weather-and-air app: the category standard played straight, refusing GIS-portal layer lists and alarmist dashboards.
OWN-WORLD: Light slate-tinted ground, white cards with soft elevation, one blue accent for action and selection, a single IQAir-style level scale (good → hazardous) always shown with word and icon; one workhorse sans; Ghana present only through photos, local terms and place names.
STORY: The resident sees today's situation and one plain sentence of advice; the decision-maker scrolls once to districts, method and data, and leaves with a download or a WMS URL.
FIRST VIEWPORT: Desktop: header (wordmark, five cities, Map / Data / About); left column city name, update time, alert banner, 2×2+ value tiles; right column topic tabs over the map preview with "Tap to load map". Phone: header, city + time, alert banner, tiles in two columns, tabs.
FORM: category standard (canon card), chosen over the bolder hand; sketch .impeccable/mocks/decision/canon-desktop.html (phone: canon.html); seed key ba03671e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
