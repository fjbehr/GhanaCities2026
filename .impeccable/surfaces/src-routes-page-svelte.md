---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/routes/+layout.svelte"]
---

# Home page (/)

Mode: Operate (pick a city, glance at its state). Confirmed by the user 2026-10-10. Shares the world of the city page brief (.impeccable/surfaces/src-routes-city-slug-page-svelte.md).

## Job and outcome
- A resident finds their city and sees its live snapshot without a click; a decision-maker finds the way to data and downloads.

## Structure
- Header: wordmark, the five cities, Map / Data / About.
- One-sentence intro: what the site is (free open data for five Ghanaian cities, explained plainly).
- Five city cards: freely licensed photo, name, region, live snapshot (feels-like temperature, air level incl. Saharan dust, rain next 24 h) and one alert line when a level is reached. Each card links to /city/[slug].
- Below: the four topics in brief, a "For decision-makers" entry (data, downloads, WMS/WFS), footer with sources and attribution.
- Layout: cards stacked on phones, two columns on tablets, 3 + 2 or five across on desktop.

## States
- Same live-data states as the city page (loading with cached values, stale timestamp, source down per value, calm "Nothing unusual today").
- Photos lazy-load and must never block the live values on slow connections.

## Direction contract
THESIS: Five cities at a glance, the clean weather-app standard played straight, refusing both a GIS portal front door and a donor-report landing page.
OWN-WORLD: As the city page: light slate-tinted ground, white elevated cards, one blue accent, IQAir-style level scale with word and icon, one workhorse sans; Ghana through photos, terms and place names only.
STORY: The visitor recognises their city, sees whether today is ordinary, and taps through; specialists see where the data lives.
FIRST VIEWPORT: Desktop: header, one-line intro, the five city cards in one row or 3 + 2 with photo, values and any alert line visible without scrolling. Phone: header, intro, first two city cards.
FORM: category standard (canon card); sketch .impeccable/mocks/decision/canon-desktop.html as the shared world reference; seed key ba03671e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
