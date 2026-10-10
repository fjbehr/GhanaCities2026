# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: residents of Accra, Kumasi, Tamale, Sekondi-Takoradi and Cape Coast.** They come with an everyday question — is heavy rain coming, how hot and dusty is it today, how far is the nearest clinic — and need a plain-language answer about their own city, mostly on a phone over mobile data. When the two audiences compete for space (for example the top of a city page), residents win.

**Secondary: decision-makers** — district assemblies (MMDAs), planners, NGOs, journalists and researchers. They need per-district indicators, method notes and downloadable data (CSV, GeoJSON, WMS/WFS) to use in their own reports and GIS. They are served lower on the same pages ("For decision-makers"), not on a separate site.

## Product Purpose

Turn free open geodata (OpenStreetMap, NASA, Copernicus, WorldPop, ESA and others) into understandable, city-specific information on four topics: **Flood & Rain, Heat & Air, Services & Access, Environment & Land Use**. Each figure answers "what is happening?" and "what does this mean for me?".

Success: a resident understands the current situation in their city at a glance; a decision-maker can find, trust and reuse the district figures and the underlying data.

## Positioning

A non-commercial site that brings live conditions, long-term indicators and open OGC services for five Ghanaian cities together in one place, explained in plain language and openly sourced: every number links to its source, licence and method, and the data can be reused directly in other tools.

## Operating Context

- Usage is mobile-first: many visitors use phones on mobile internet with limited bandwidth and data budgets. Pages must stay lightweight and work on slow connections.
- Mobile-first is not mobile-only: the site must look and work equally well as a website on tablets and desktop monitors (decision-makers, offices, presentations). Wider screens use the space for side-by-side reading, not stretched phone layouts.
- Interactive maps run in Masterportal (embedded per city page, also full screen at /map); topic layers are selected per tab via URL parameters.
- Live values (weather, rain, air quality incl. Harmattan Saharan dust, river discharge, fires) come from external APIs and are cached server-side; long-term indicators come from the project's own data pipeline.
- Decision-makers work with spreadsheets and GIS tools (QGIS, ArcGIS) and need stable WMS/WFS URLs and file downloads.

## Capabilities and Constraints

- Pages: home (`/`), city pages (`/city/[slug]`) with topic tabs, full-screen map (`/map`), data sources and methods (`/data`), about (`/about`).
- Core indicator: share of population within 2 km / 5 km (straight-line distance) of a health facility per district; the same for schools, markets and water points. The method is stated openly.
- Data limitations are named on the page (e.g. GloFAS captures small urban rivers such as the Odaw only coarsely).
- Language: English. All copy is kept centrally so Twi, Ga and Dagbani can be added later.
- All software is open source and all data freely licensed; attribution and licence notes are required wherever data is shown.
- Non-commercial use only (some sources, e.g. EOX Sentinel-2 cloudless, require it).
- The NASA FIRMS fire layer stays off until a free map key is configured.
- Initially local development only; no deployment target yet.
- **Open:** the site's name (working title "Ghana Cities").

## Brand Commitments

- Name: not decided yet; use "Ghana Cities" as a working title only.
- Visual direction (chosen 2026-10-10 over several bolder directions): the category standard — a clean weather and air-quality app, executed at full craft, without ironic or "quirky" twists. Quality bar: IQAir / AirVisual (plain-language levels and advice) and Windy / Ventusky (map and data-visualisation craft).
- Ghanaian character comes through content, not styling: photos of the five cities, local terms (Harmattan, Odaw, MMDAs, trotro), real place and district names. No textile patterns, flag colours or other decorative "Ghana" motifs.
- The site is run together with partners in Ghana. No partner names, logos or endorsements exist yet — do not invent them; leave room in /about to credit partners once confirmed.

## Evidence on Hand

- Data sources and licences as listed in the project plan (geoBoundaries, OSM/Geofabrik, Open-Meteo incl. CAMS and GloFAS, CHIRPS, JRC Global Surface Water, Copernicus DEM, NASA MODIS/VIIRS/FIRMS, WorldPop, Google Open Buildings, ESA WorldCover, Copernicus GHSL, EOX Sentinel-2 cloudless).
- No user testimonials, usage figures, press coverage or partner quotes exist. Do not fabricate any.

## Product Principles

1. **Residents first, decision-makers one scroll away.** Lead with the everyday answer; keep the depth reachable on the same page.
2. **Plain language over jargon.** Every figure carries a "what this means" in words a non-specialist understands; technical terms are explained or avoided.
3. **Honest about the data.** Sources, licences, update times, methods and limitations are visible, not buried.
4. **Light enough for a phone on mobile data.** Performance is a feature; nothing heavy loads unless the visitor asks for it.
5. **Open and reusable.** Data, services and code are open; anything shown can be downloaded or consumed in other tools.

## Accessibility & Inclusion

- Mobile-first and usable on small screens (~360–400 px) and slow connections (Slow 4G as the test profile).
- Barrier-free reading: sufficient contrast in bright outdoor light, information never conveyed by colour alone (important for maps and risk levels).
- Copy prepared for translation into Twi, Ga and Dagbani.
