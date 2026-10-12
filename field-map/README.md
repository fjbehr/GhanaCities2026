# Ghana Field Map

A simple, independent map for people in rural Ghana, especially farmers. It is a
[Masterportal](https://www.masterportal.org) (version 3.27 LTS) configuration and consists of
static files only: **no application server and no database**. All map content comes from
OGC web services (WMS, WMTS): the Ghana Cities GeoServer and public services from NASA,
ISRIC, EOX, terrestris and OpenStreetMap.

What people can do with it:

- find their place (GPS button, search for a village or town);
- switch on maps of rain, green plants, soil moisture, fires, soil quality, clinics, schools,
  markets, water points and borders;
- tap the map to read a value or a name;
- measure the area of a field in hectares;
- read the coordinates of a point in GPS coordinates, the Ghana National Grid, UTM or another
  coordinate system used in Africa;
- share a map link.

A help page inside the map ("Help: how to use this map") explains each map in plain words.

## Files

| File                               | What it contains                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `index.html`                       | The page; loads Masterportal from `mastercode/`                                                  |
| `config.js`                        | Global settings: coordinate systems (EPSG), paths to the other files, language                   |
| `config.json`                      | The portal: start view, menus and tools, help text, layer folders                                |
| `resources/services.template.json` | Every map layer (WMS/WMTS). `{{GEOSERVER}}` stands for the address of the Ghana Cities GeoServer |
| `resources/rest-services.json`     | The place search (Komoot Photon)                                                                 |
| `resources/style_v3.json`          | Styles for vector layers (none used)                                                             |
| `resources/logo.svg`               | Logo and browser icon                                                                            |
| `build.ts`                         | Makes a ready-to-host copy in `dist/` (see below)                                                |

## Build and host

```bash
npm run field-map -- --geoserver https://your-domain/geoserver
```

This writes `field-map/dist/`: the files above, `resources/services.json` with the GeoServer
address filled in, and the Masterportal code (`mastercode/`, downloaded once from the
official release). Copy `dist/` to any static web host (a plain web space, nginx, Apache,
GitHub Pages). Without `--geoserver` it uses `http://localhost:3000/geoserver` for testing.

The map must be opened through a web server (`http://` or `https://`), not as a local file.
For a quick local test: `npx http-server field-map/dist` and open the address it prints.

The Ghana Cities website must send a CORS header for its GeoServer responses, so that a map on
another web address may read them (needed for tapping on a place). It does so since the
version that added this map; all other services used here send it already.

## Map layers and sources

| Folder                           | Layer                                                 | Service                            | Source and licence                                                                                                           |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Base maps                        | Street map, Relief map                                | WMS (terrestris OSM-WMS, TOPO-WMS) | © OpenStreetMap contributors (ODbL); service by terrestris GmbH & Co. KG                                                     |
| Base maps                        | Satellite                                             | WMTS (EOX)                         | Sentinel-2 cloudless 2024 by EOX IT Services GmbH, contains modified Copernicus Sentinel data (CC BY-NC-SA 4.0)              |
| Rain, plants, fire               | Rain (latest day)                                     | WMTS (NASA GIBS)                   | GPM IMERG precipitation rate, NASA                                                                                           |
| Rain, plants, fire               | Green plants (last 8 days)                            | WMTS (NASA GIBS)                   | MODIS Terra NDVI, NASA                                                                                                       |
| Rain, plants, fire               | Soil moisture (latest day)                            | WMTS (NASA GIBS)                   | SMAP L4 root-zone soil moisture, NASA                                                                                        |
| Rain, plants, fire               | Fires (latest day)                                    | WMS (NASA GIBS)                    | VIIRS NOAA-20 active fires, NASA FIRMS                                                                                       |
| Soil (top 5 cm)                  | Acidity, organic carbon, nitrogen, clay               | WMS (ISRIC)                        | SoilGrids 2.0, ISRIC – World Soil Information (CC BY 4.0)                                                                    |
| Clinics, schools, markets, water | four layers, whole of Ghana                           | WMS (Ghana Cities GeoServer)       | © OpenStreetMap contributors (ODbL)                                                                                          |
| Borders                          | Regions, districts (all 260)                          | WMS (Ghana Cities GeoServer)       | geoBoundaries (CC BY 4.0)                                                                                                    |
| Only around the 5 big cities     | rainwater, water, land cover, buildings, heat, people | WMS (Ghana Cities GeoServer)       | Copernicus DEM, JRC Global Surface Water, ESA WorldCover, GHSL, Landsat (USGS), WorldPop – see the Ghana Cities `/data` page |

Place search: [Komoot Photon](https://photon.komoot.io) with OpenStreetMap data.

### Sources and licences

The footer and the help page name all sources. Two of them restrict use:
**EOX Sentinel-2 cloudless** is for non-commercial use only (CC BY-NC-SA 4.0), and the free
**terrestris** and **Komoot Photon** services are meant for moderate use. For heavy traffic,
host your own OSM WMS and geocoder or use a commercial plan.

## Coordinate systems (EPSG)

The map is drawn in Web Mercator (EPSG:3857). The coordinates tool can show and convert to:

- **World:** WGS 84 latitude/longitude (EPSG:4326, in degrees-minutes-seconds and in
  decimal degrees), Web Mercator (EPSG:3857)
- **Ghana:** Accra / Ghana National Grid in feet (EPSG:2136), Leigon / Ghana Metre Grid
  (EPSG:25000), Accra / TM 1 NW (EPSG:2137), Accra latitude/longitude (EPSG:4168),
  WGS 84 / UTM zones 30N and 31N (EPSG:32630, 32631)
- **Africa, WGS 84 / UTM:** zones 28N–38N (EPSG:32628–32638) and 33S–36S (EPSG:32733–32736)
- **Other national systems:** Nigeria Minna West/Mid/East Belt (EPSG:26391–26393),
  Côte d'Ivoire Abidjan 1987 / UTM 29N (EPSG:2043), Senegal Yoff / UTM 28N (EPSG:31028),
  Kenya/Tanzania Arc 1960 / UTM 37N and 37S (EPSG:21097, 21037), South Africa
  Hartebeesthoek94 (EPSG:4148)

All definitions are proj4 strings from the EPSG registry ([epsg.io](https://epsg.io)).
Masterportal lists WGS 84 first, then all UTM zones, then the other systems. To add one,
copy its definition from `https://epsg.io/<code>.proj4` into `namedProjections` in
`config.js`, with a `+title=` name in front.

## Changing the map

- **Rename or reorder layers:** names in `resources/services.template.json`, folders and order
  in `config.json` → `layerConfig`.
- **Add a WMS layer:** copy a WMS entry in `services.template.json`, give it a new `id`, `url`
  and `layers`, then add `{ "id": "<new id>", "visibility": false }` to a folder in
  `config.json`.
- **Help text:** `config.json` → `mainMenu` → `about` → `abstractText` (HTML).
- **Start view:** `config.json` → `mapView` → `startCenter` (EPSG:3857 metres) and
  `startZoomLevel`.

Run `npm run field-map -- --geoserver …` again after every change.

## Limits

- The map needs an internet connection; nothing works offline.
- "Latest day" layers show the newest image NASA has processed, usually one to two days old.
  Satellite rain estimates cover large squares and can miss single showers.
- Soil maps are model estimates for 250 m squares, not soil tests.
- Clinics, schools, markets and especially water points are only as complete as
  OpenStreetMap.
- The city maps of Ghana Cities cover only the five study areas.
- Masterportal's own buttons and messages are in English; Twi, Ga or Dagbani would need
  Masterportal language files and a font with the letters Ɛ, Ɔ and Ŋ.
