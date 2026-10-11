---
name: Ghana Cities
description: Live conditions and open data for five Ghanaian cities, presented as a calm weather-and-air app.
colors:
  bg: "#f2f5f8"
  surface: "#ffffff"
  surface-sunk: "#e9eef3"
  line: "#dbe2ea"
  line-strong: "#c3ccd7"
  ink: "#0f172a"
  ink-2: "#475569"
  ink-3: "#586579"
  ink-on-accent: "#ffffff"
  accent: "#1d4ed8"
  accent-hover: "#1e40af"
  accent-wash: "#eaf1ff"
  accent-wash-hover: "#dbe7ff"
  selection: "#c7d8ff"
  calm: "#166534"
  calm-wash: "#e9f7ee"
  watch: "#854d0e"
  watch-wash: "#fef6dc"
  act: "#9a3412"
  act-wash: "#ffeedd"
  severe: "#991b1b"
  severe-wash: "#fdeaea"
  watch-mark: "#ca8a04"
  act-mark: "#ea580c"
  series-1: "#2563eb"
  series-1-soft: "#93b4f5"
  series-2: "#be185d"
  hotter: "#c2410c"
  cooler: "#2563eb"
  map-built-up: "#5b5f66"
  map-boundary: "#334155"
typography:
  display:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 1.6rem + 2.6vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  title-sm:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  body:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-lg:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
  mono:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  focus: "4px"
  sm: "8px"
  md: "14px"
  pill: "999px"
spacing:
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "0.75rem"
  s4: "1rem"
  s5: "1.5rem"
  s6: "2rem"
  s7: "3rem"
  s8: "4.5rem"
  gutter: "clamp(1rem, 0.6rem + 2vw, 2rem)"
  page: "76rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.ink-on-accent}"
  button-secondary:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-secondary-hover:
    backgroundColor: "{colors.accent-wash-hover}"
    textColor: "{colors.accent-hover}"
  button-on-media:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1rem"
  button-copy:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
  nav-link:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.75rem"
  nav-link-hover:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
  nav-link-current:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
  tab-track:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.pill}"
    padding: "0.25rem"
  tab:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1rem"
  tab-current:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  level-badge-calm:
    backgroundColor: "{colors.calm-wash}"
    textColor: "{colors.calm}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.2em 0.6em 0.2em 0.45em"
  level-badge-watch:
    backgroundColor: "{colors.watch-wash}"
    textColor: "{colors.watch}"
    rounded: "{rounded.pill}"
  level-badge-act:
    backgroundColor: "{colors.act-wash}"
    textColor: "{colors.act}"
    rounded: "{rounded.pill}"
  level-badge-severe:
    backgroundColor: "{colors.severe-wash}"
    textColor: "{colors.severe}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "1rem"
  value-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: "1rem"
  alert-banner-watch:
    backgroundColor: "{colors.watch-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "1rem 1.5rem"
  alert-banner-act:
    backgroundColor: "{colors.act-wash}"
    rounded: "{rounded.md}"
  alert-banner-severe:
    backgroundColor: "{colors.severe-wash}"
    rounded: "{rounded.md}"
  note:
    backgroundColor: "{colors.accent-wash}"
    rounded: "{rounded.md}"
    padding: "1rem 1.5rem"
  service-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.5rem 0.5rem 0.75rem"
---

# Design System: Ghana Cities

## Overview

**Creative North Star: "The Outdoor Forecast"**

Ghana Cities looks and behaves like a well-made weather and air-quality app, the category standard played straight. A light, slightly slate-tinted ground holds white cards with soft elevation; one blue accent marks what can be pressed or what is selected; and a single fixed level scale (calm, watch, act, severe) carries every judgement the site makes about conditions. Nothing on the page is decorative alarm. Colour that means "attention" is rationed to the levels, and the levels never travel alone: each one is a word, an icon shape and a colour together.

The world is built for reading outdoors on a phone in bright sun: one highly legible workhorse sans (Atkinson Hyperlegible Next), generous body leading (1.55), big tabular-feeling values, text contrast at 4.5:1 or better everywhere including the quietest ink. Density is moderate. Phones get a single column with tiles two-up; desktops use their width side by side (status left, topic and map right) rather than stretching the phone layout. Ghana appears through freely licensed city photos with credits, local terms and place names, not through flags, kente patterns or national colours.

Specialist material (district tables, method notes, downloads, WMS/WFS URLs) lives in the same world, one scroll below the resident view, set as calm tables and inset rows rather than a GIS portal's layer lists.

**Key Characteristics:**
- Light slate ground (bg), white surfaces, soft two-layer shadows; flat tonal fills for wells and tracks.
- One blue accent for action, links, selection and focus; nothing else is blue in the chrome.
- Four-step level scale, always colour + icon shape + word; tinted wash behind dark level text.
- One variable sans for everything; monospace only for service URLs.
- Pill-shaped controls (999px), 14px cards, 8px small containers.
- Map and chart colours obey the same restraint: data series never borrow level colours.

## Colors

A cool, near-neutral slate palette with a single saturated blue, plus a reserved four-step level scale and a separate, validated pair of chart series colours.

### Primary
- **Signal Blue** (accent): links, primary buttons, current nav item text, focus rings, caret, the brand mark disc. Also recoloured into the embedded Masterportal map viewer so the map chrome reads as part of the site.
- **Deep Signal Blue** (accent-hover): hover state for links and filled buttons.
- **Blue Mist** (accent-wash): current nav pill, secondary buttons, copy buttons, explanatory note panels, table row hover.
- **Blue Mist Pressed** (accent-wash-hover): hover state of Blue Mist buttons.
- **Selection Blue** (selection): text selection background only.

### Neutral
- **Harmattan Slate** (bg): page ground; tinted rather than white so white cards lift without heavy shadows.
- **Paper White** (surface): cards, tiles, header, footer, tables, the current tab pill.
- **Well Slate** (surface-sunk): tab track, nav hover, photo and map placeholders, the area beyond map tiles.
- **Hairline** (line): row dividers, card internal rules, inset borders on map panel and service rows.
- **Firm Hairline** (line-strong): table header rule, section break above "For decision-makers", diverging-chart axis.
- **Night Ink** (ink): headings, values, primary text.
- **Slate Ink** (ink-2): secondary text, ledes, nav and tab rest state, captions.
- **Quiet Ink** (ink-3): tertiary metadata, timestamps, tick labels, tile icons. Its 5.40:1 on the ground is the floor; nothing lighter is used for text.
- **On-Accent White** (ink-on-accent): text on filled blue.

### Level scale (status)
- **Calm Green** on **Calm Wash** (calm / calm-wash): "Nothing unusual", good air.
- **Watch Amber** on **Watch Wash** (watch / watch-wash): moderate air, rain expected, river higher than usual; also the stale-data warning strip.
- **Act Rust** on **Act Wash** (act / act-wash): heavy rain, dangerous heat, unhealthy for some.
- **Severe Red** on **Severe Wash** (severe / severe-wash): very heavy rain, extreme heat, unhealthy air.

Each level text colour reads 6.3 to 7.2:1 on its own wash. The level-scale bars use brighter mid-steps for the two middle levels, **Watch Mark** (watch-mark) and **Act Mark** (act-mark), so the four bars read as a ramp; they never carry text.

### Data series
- **Series Blue** (series-1): primary measured series (monthly rain columns, bar lists).
- **Series Blue Soft** (series-1-soft): a column with a note (e.g. a month still in progress).
- **Series Magenta** (series-2): reference series (long-term normal line and dots).
- **Hotter Orange** / **Cooler Blue** (hotter / cooler): the two sides of diverging heat bars.

Both pairs passed all six dataviz validator checks.

### Map
- **Built-up Grey** (map-built-up): land-cover built-up class, used instead of ESA WorldCover's red.
- **Boundary Slate** (map-boundary): district outlines in every map style and legend.

### Named Rules
**The Reserved Levels Rule.** Calm, watch, act and severe colours mean a level and nothing else. They are never chart series, decoration, category colours or brand accents.

**The Never Alone Rule.** A level is always colour plus icon shape (circle-check, circle-alert, triangle-alert, octagon-alert) plus a word. Compact slots use the reading's short word ("Moderate", "Unhealthy for some"); they never drop to colour only.

**The One Blue Rule.** Signal Blue is for action, selection and focus. If an element is blue in the chrome, it can be pressed or is the current choice.

**The No Alarm Map Rule.** Map styles share the site's restraint: built-up land is neutral grey, not red, and alarm hues on maps are reserved for real hazard gradients (the heat diverging scale) or point symbols.

## Typography

**Display Font:** Atkinson Hyperlegible Next Variable (with system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Atkinson Hyperlegible Next Variable (same stack)
**Label/Mono Font:** ui-monospace, Cascadia Mono, Consolas (service URLs and code only)

**Character:** One self-hosted variable sans (OFL) chosen for letterform clarity outdoors and at small sizes; hierarchy comes from size steps and weight (600 to 750), never from a second display face.

### Hierarchy
- **Display** (700, clamp(2.25rem, 1.6rem + 2.6vw, 3.25rem), 1.15, -0.025em): page titles only (city name, home intro, Data, About). Drops to 1.875rem on phones under 30rem on home.
- **Headline** (700, 2rem, line-height 1, -0.02em): big values in tiles and findings rows; section headings on the Data page.
- **Title** (700, 1.5rem, 1.15): section headings, alert banner headline, city card names.
- **Title small** (700, 1.1875rem): sub-sections, topic names, download group headings; city card names on phones; the wordmark at 750.
- **Body** (400, 1rem, 1.55): running text, measure 60 to 75ch.
- **Body large** (400, 1.1875rem): ledes, topic summaries, alert advice (max 52ch), About prose (line-height 1.6).
- **Label** (600 to 650, 0.8125rem): tile labels, badges, legends, table text, captions, footer. Chart ticks drop to 11px and level-scale words to 0.75rem; photo credits to 0.6875rem.

Interactive text (nav, tabs, buttons) is weight 600 to 650 at body size. Headings use balanced wrapping; paragraphs use pretty wrapping. Tables and chart ticks use tabular numerals.

### Named Rules
**The One Voice Rule.** Every role uses Atkinson Hyperlegible Next. Monospace appears only where users copy machine strings.

**The Sentence Case Rule.** No uppercase labels, no tracked-out small caps, no eyebrow text above headings. Labels are sentence case with their icon.

## Layout

Content sits in a centred wrap of min(100% minus two gutters, 76rem); the gutter scales from 1rem to 2rem. Spacing follows an eight-step scale from 0.25rem to 4.5rem (s1 to s8); s3 to s5 do most work inside components, s6 to s7 between page regions, s8 above the topics band, the decision-maker block and the footer.

Breakpoints are content-driven, in rem: 30rem (phone compaction of tiles, findings and home intro), 34rem (tab row becomes full-width scroller), 40rem (city cards switch from thumbnail rows to photo-top cards), 60rem (header goes to one row; downloads and the decision-maker block go two-column), 64rem (city page two-column), 80rem (five city cards across).

- **Header:** wordmark and tools on the first row, the city pills as a horizontally scrolling second row that fades at the right edge; from 60rem a single row of brand, cities, tools.
- **City page:** one column on phones in the order now, topic, outlook; from 64rem a grid of minmax(20rem, 26rem) and 1fr with status and outlook left, topic tabs and map right, and the district table full width below a firm hairline.
- **Value tiles:** always two columns; a wide tile spans both.
- **Home cards:** auto-fill at min 17rem, five across from 80rem; on phones each card becomes a 6.5rem photo thumbnail beside its figures so two cities fit the first screen.
- **Findings rows:** value column (min 6.5rem) beside its sentence, hairline between rows; stacked under 30rem.

## Elevation & Depth

A hybrid: soft ambient shadows lift white surfaces off the tinted ground, while wells and tracks use flat tonal fills (Well Slate) and inset 1px hairlines. There are only two shadow levels, both cool-tinted from Night Ink.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px rgb(15 23 42 / 0.05), 0 4px 14px -4px rgb(15 23 42 / 0.08)`): cards, tiles, alert banner, chart panel, tables, the current tab pill.
- **Raised** (`box-shadow: 0 2px 4px rgb(15 23 42 / 0.06), 0 12px 28px -8px rgb(15 23 42 / 0.16)`): hovered city card, the floating "Load interactive map" button, chart tooltips.
- **Inset hairline** (`box-shadow: inset 0 0 0 1px #dbe2ea`): map panel frame, WMS/WFS service rows, endpoint rows.

### Named Rules
**The Two Lifts Rule.** Surfaces rest at Resting; only things that float over other content or respond to hover use Raised. There is no third level and no hard offset shadow.

## Shapes

Gently rounded, app-like forms. Cards, tiles, banners, panels and tables use 14px corners; small containers (service rows, tooltips, warning strips, skip link, photo credit tab) use 8px; every control (buttons, nav links, tabs, tab track, badges) is a full pill (999px). Focus outlines take a 4px radius. Chart columns round only their top corners (3px keys, bar ends 4px). Photos are clipped by their card's radius. Dividers are 1px hairlines; the one heavier rule is the 2px Night Ink top border on home topic entries.

## Components

### Buttons
Pill-shaped, confident, never outlined.
- **Shape:** full pill (999px).
- **Primary:** Signal Blue fill, white text, weight 650, padding 0.75rem 1.5rem; hover darkens to Deep Signal Blue over 0.2s ease-out.
- **Secondary:** Blue Mist fill with Signal Blue text; hover to Blue Mist Pressed.
- **On media:** white pill with Raised shadow and leading icon ("Load interactive map"), sitting on a faint dark gradient at the map's foot; hover lifts 1px.
- **Copy:** small Blue Mist pill (label size, 0.25rem 0.75rem) at the end of each service row.
- **Focus:** 3px Signal Blue outline, 2px offset, everywhere.

### Chips (level badges)
- **Style:** pill, label size at 650, level text colour on its wash, 16px Lucide icon whose shape encodes the level.
- **State:** on value tiles only when the reading is above calm; on city cards and in the calm banner state the calm badge carries the plain headline (e.g. "Air quality: good").

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** Paper White on Harmattan Slate.
- **Shadow Strategy:** Resting; city cards go to Raised and rise 2px when their title link is hovered, over 0.3s ease-out.
- **Border:** none; internal sections divide with a Hairline.
- **Internal Padding:** 1rem (tiles, scale, outlook), 1.5rem (chart panel), 1rem 1.5rem (banner, note).
- **City card:** 3:2 photo with a credit tab bottom-right, name (whole card is the link), region, headline level badge, then a hairline-topped definition list of feels-like, rain and air with small icons.

### Value tile
Label row (18px icon in Quiet Ink, label in Slate Ink at 600), a Headline value, then either a level badge or one detail line. Phones under 30rem tighten padding to 0.75rem and the value to 1.5rem.

### Alert banner
Appears only when a level is reached: level wash background, Resting shadow, 26px level icon in the level colour beside a Title headline, Body-large advice, and a fine-print line naming GMet and NADMO as the official source. On calm days it collapses to a calm badge plus the not-official line.

### Level scale
A white panel with four equal segments separated by 2px gaps; inactive segments sit at 35% opacity, the current one is full strength, 10px tall, with its word in Night Ink at 700 and its icon in the level colour.

### Navigation
- **Header:** white bar with a hairline bottom; nav links are Slate Ink pills at 600, hover to Well Slate fill and Night Ink, current page to Blue Mist with Signal Blue text.
- **Topic tabs:** segmented control: Well Slate pill track with 0.25rem padding; tabs at 650 in Slate Ink; the current tab becomes a white pill with Resting shadow. On narrow screens the row scrolls with faded edges and centres the current tab.

### Tables
White, 14px, Resting shadow, horizontal scroll wrapper; label-size text, hairline rows, sticky header with a Firm Hairline, right-aligned tabular numbers, Blue Mist row hover. Sortable headers are plain text buttons with a small arrow; the sorted column goes to Night Ink.

### Charts and map legend
Charts sit in a white panel: bold caption, inline legend keys, hairline gridlines, Quiet Ink 11px ticks, a raised tooltip, and a "Show as table" disclosure in Signal Blue. Map previews are 16:10, 14px, inset hairline, with a legend of swatches below that use the same colours as the GeoServer styles.

## Do's and Don'ts

### Do:
- **Do** pair every level with its icon shape and word; use the reading's short form in badges and table cells.
- **Do** keep text at Quiet Ink (#586579) or darker; it is the lightest ink that clears 4.5:1 on the ground.
- **Do** use series-1 / series-2 for measured vs. reference series and hotter / cooler for diverging values.
- **Do** make every control a pill and every card 14px, on Paper White with the Resting shadow.
- **Do** keep Ghana's presence to credited, freely licensed photos, local terms and place names.
- **Do** show stale or missing data in place (watch-wash strip, "Not available right now") rather than hiding the tile.
- **Do** honour reduced motion; motion is limited to 0.2 to 0.3s ease-out colour, shadow and 1 to 2px lift transitions.

### Don't:
- **Don't** use calm, watch, act or severe colours for chart series, categories or decoration.
- **Don't** show a level by colour alone.
- **Don't** introduce a second accent hue in the chrome, or blue on anything that is not interactive or selected.
- **Don't** colour built-up land or ordinary map features red.
- **Don't** add uppercase eyebrows, kickers or tracked labels above headings.
- **Don't** add a third shadow level or hard offset shadows.
- **Don't** add a second display typeface; hierarchy comes from the step scale and weight.
