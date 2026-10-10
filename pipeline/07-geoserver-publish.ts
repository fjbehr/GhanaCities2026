/**
 * Publishes the data as OGC services in GeoServer (workspace "ghana") via the REST API:
 * PostGIS layers, raster mosaics, SLD styles and one layer group per topic.
 * Re-running rebuilds the workspace from scratch.
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dbParams, DERIVED, requireEnv, ROOT } from './lib/env.ts';
import { GHSL_EPOCHS } from './lib/tiles.ts';

const WS = 'ghana';
const base = requireEnv('GEOSERVER_URL');
const user = requireEnv('GEOSERVER_USER');
const password = requireEnv('GEOSERVER_PASSWORD');
let auth = basic(user, password);

function basic(u: string, p: string) {
	return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

type Body = { json: unknown } | { xml: string } | { sld: string } | { text: string };

async function rest(method: string, route: string, body?: Body, okStatus: number[] = []) {
	const headers: Record<string, string> = { Authorization: auth, Accept: 'application/json' };
	let payload: string | undefined;
	if (body && 'json' in body)
		[headers['Content-Type'], payload] = ['application/json', JSON.stringify(body.json)];
	if (body && 'xml' in body) [headers['Content-Type'], payload] = ['application/xml', body.xml];
	if (body && 'sld' in body)
		[headers['Content-Type'], payload] = ['application/vnd.ogc.sld+xml', body.sld];
	if (body && 'text' in body) [headers['Content-Type'], payload] = ['text/plain', body.text];

	const res = await fetch(`${base}/rest/${route}`, { method, headers, body: payload });
	if (!res.ok && !okStatus.includes(res.status)) {
		throw new Error(`${method} ${route}: ${res.status} ${(await res.text()).slice(0, 400)}`);
	}
	return res;
}

const xmlEscape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Replaces the factory admin password with GEOSERVER_PASSWORD from .env */
async function ensureCredentials() {
	const probe = await fetch(`${base}/rest/about/version.json`, {
		headers: { Authorization: auth }
	});
	if (probe.ok) return;
	if (probe.status !== 401) throw new Error(`GeoServer not reachable at ${base} (${probe.status})`);

	auth = basic('admin', 'geoserver');
	const factory = await fetch(`${base}/rest/about/version.json`, {
		headers: { Authorization: auth }
	});
	if (!factory.ok) throw new Error('GEOSERVER_USER/GEOSERVER_PASSWORD from .env are rejected');
	if (user !== 'admin') throw new Error('Set GEOSERVER_USER=admin to replace the default password');
	await rest('PUT', 'security/self/password', { json: { newPassword: password } });
	auth = basic(user, password);
	// The user store reloads asynchronously; wait until the new password is accepted
	for (let i = 0; i < 20; i++) {
		const check = await fetch(`${base}/rest/about/version.json`, {
			headers: { Authorization: auth }
		});
		if (check.ok) break;
		await new Promise((r) => setTimeout(r, 500));
	}
	console.log('replaced the default admin password with GEOSERVER_PASSWORD');
}

/** Capabilities and links use the public /geoserver address behind the site's proxy */
async function proxySettings() {
	const settings = await (await rest('GET', 'settings.json')).json();
	settings.global.settings.proxyBaseUrl = '${X-Forwarded-Proto}://${X-Forwarded-Host}/geoserver';
	settings.global.useHeadersProxyURL = true;
	settings.global.settings.useHeadersProxyURL = true;
	await rest('PUT', 'settings', { json: settings });
}

async function style(name: string, sld: string) {
	await rest('POST', `workspaces/${WS}/styles?name=${name}`, { sld });
}

function poiStyle(title: string, shape: string, color: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer><Name>poi</Name><UserStyle><Title>${xmlEscape(title)}</Title><FeatureTypeStyle>
    <Rule><Title>${xmlEscape(title)}</Title>
      <PointSymbolizer><Graphic><Mark><WellKnownName>${shape}</WellKnownName>
        <Fill><CssParameter name="fill">${color}</CssParameter></Fill>
        <Stroke><CssParameter name="stroke">#ffffff</CssParameter><CssParameter name="stroke-width">1.5</CssParameter></Stroke>
      </Mark><Size>12</Size></Graphic></PointSymbolizer>
    </Rule>
    <Rule><MaxScaleDenominator>25000</MaxScaleDenominator>
      <TextSymbolizer><Label><ogc:PropertyName>name</ogc:PropertyName></Label>
        <Font><CssParameter name="font-family">SansSerif</CssParameter><CssParameter name="font-size">11</CssParameter></Font>
        <LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint><Displacement><DisplacementX>9</DisplacementX><DisplacementY>0</DisplacementY></Displacement></PointPlacement></LabelPlacement>
        <Halo><Radius>2</Radius><Fill><CssParameter name="fill">#ffffff</CssParameter></Fill></Halo>
        <Fill><CssParameter name="fill">#0f172a</CssParameter></Fill>
      </TextSymbolizer>
    </Rule>
  </FeatureTypeStyle></UserStyle></NamedLayer>
</StyledLayerDescriptor>`;
}

const POIS = [
	{ name: 'poi_health', title: 'Health facilities', shape: 'cross', color: '#dc2626' },
	{ name: 'poi_school', title: 'Schools', shape: 'triangle', color: '#7c3aed' },
	{ name: 'poi_market', title: 'Markets', shape: 'square', color: '#b45309' },
	{
		name: 'poi_water',
		title: 'Water points (incomplete in OSM)',
		shape: 'circle',
		color: '#0284c7'
	}
];

async function featureType(name: string, view: string, title: string, abstract: string) {
	await rest('POST', `workspaces/${WS}/datastores/postgis/featuretypes`, {
		json: { featureType: { name, nativeName: view, title, abstract, srs: 'EPSG:4326' } }
	});
}

async function setStyles(layer: string, defaultStyle: string, extra: string[] = []) {
	await rest('PUT', `layers/${WS}:${layer}`, {
		json: {
			layer: {
				defaultStyle: { name: `${WS}:${defaultStyle}` },
				styles: { style: extra.map((s) => ({ name: `${WS}:${s}` })) }
			}
		}
	});
}

// On Windows GeoServer can keep mosaic files open after its store is deleted, so every run
// publishes from a fresh folder and earlier ones are removed when no longer locked.
const RUN = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

async function removeOldRuns(name: string) {
	const parent = path.join(DERIVED, 'geoserver', name);
	for (const old of await readdir(parent).catch(() => [] as string[])) {
		if (old === RUN) continue;
		await rm(path.join(parent, old), { recursive: true, force: true }).catch(() =>
			console.log(`  kept ${name}/${old} (still locked by GeoServer; removed on a later run)`)
		);
	}
}

/**
 * Copies a product's city GeoTIFFs into data/derived/geoserver/<name>/<run> and publishes
 * them as one ImageMosaic layer. GeoServer writes its index files into that folder.
 */
async function mosaic(name: string, title: string, abstract: string, timeFromFilename = false) {
	const src = path.join(DERIVED, 'rasters', name);
	const dir = path.join(DERIVED, 'geoserver', name, RUN);
	await mkdir(dir, { recursive: true });
	for (const f of (await readdir(src)).filter((f) => f.endsWith('.tif'))) {
		await copyFile(path.join(src, f), path.join(dir, f));
	}
	if (timeFromFilename) {
		// e.g. accra_1975.tif → 1975-01-01 (the extractor sees the name without extension)
		await writeFile(path.join(dir, 'timeregex.properties'), 'regex=[0-9]{4}\n');
		await writeFile(
			path.join(dir, 'indexer.properties'),
			[
				'TimeAttribute=time',
				'Schema=*the_geom:Polygon,location:String,time:java.util.Date',
				'PropertyCollectors=TimestampFileNameExtractorSPI[timeregex](time)'
			].join('\n') + '\n'
		);
	}

	await rest(
		'PUT',
		`workspaces/${WS}/coveragestores/${name}/external.imagemosaic?configure=all&coverageName=${name}`,
		{
			// GeoServer on Windows resolves a plain path, but not a file:///C:/ URL
			text: dir.split(path.sep).join('/')
		}
	);
	const dimension = timeFromFilename
		? `<metadata><entry key="time"><dimensionInfo><enabled>true</enabled><presentation>LIST</presentation><units>ISO8601</units><defaultValue><strategy>FIXED</strategy><referenceValue>2020-01-01T00:00:00.000Z</referenceValue></defaultValue></dimensionInfo></entry></metadata>`
		: '';
	const coverage = `<coverage><title>${xmlEscape(title)}</title><abstract>${xmlEscape(abstract)}</abstract><enabled>true</enabled>${dimension}</coverage>`;
	// GeoServer rewrites its config folder here; on Windows a scanner briefly holding the new
	// folder makes that fail with AccessDenied, so retry a few times
	for (let attempt = 1; ; attempt++) {
		try {
			await rest('PUT', `workspaces/${WS}/coveragestores/${name}/coverages/${name}`, {
				xml: coverage
			});
			break;
		} catch (error) {
			if (attempt >= 5 || !String(error).includes('Unable to move')) throw error;
			await new Promise((r) => setTimeout(r, 2000));
		}
	}
	await setStyles(name, name);
}

async function layerGroup(name: string, title: string, layers: [string, string][]) {
	const published = layers
		.map(([l]) => `<published type="layer"><name>${WS}:${l}</name></published>`)
		.join('');
	const styles = layers.map(([, s]) => `<style><name>${WS}:${s}</name></style>`).join('');
	await rest('POST', `workspaces/${WS}/layergroups`, {
		xml: `<layerGroup><name>${name}</name><title>${xmlEscape(title)}</title><mode>SINGLE</mode><publishables>${published}</publishables><styles>${styles}</styles></layerGroup>`
	});
}

await ensureCredentials();
await proxySettings();

// Fresh workspace (removes stores, layers, styles and groups of a previous run)
await rest('DELETE', `workspaces/${WS}?recurse=true`, undefined, [404]);
// Drop cached readers, so files of the deleted mosaics are released where possible
await rest('POST', 'reset');
await rest('POST', 'workspaces', { json: { workspace: { name: WS } } });

const db = dbParams();
await rest('POST', `workspaces/${WS}/datastores`, {
	json: {
		dataStore: {
			name: 'postgis',
			connectionParameters: {
				entry: [
					['dbtype', 'postgis'],
					['host', db.host],
					['port', db.port],
					['database', db.database],
					['schema', 'public'],
					['user', db.user],
					['passwd', db.password],
					['Expose primary keys', 'true'],
					['Estimated extends', 'false']
				].map(([k, v]) => ({ '@key': k, $: v }))
			}
		}
	}
});

const styleDir = path.join(ROOT, 'geoserver', 'styles');
for (const file of (await readdir(styleDir)).filter((f) => f.endsWith('.sld'))) {
	await style(path.basename(file, '.sld'), await readFile(path.join(styleDir, file), 'utf8'));
}
for (const p of POIS) await style(p.name, poiStyle(p.title, p.shape, p.color));
console.log('workspace, datastore and styles ready');

await featureType(
	'district',
	'gs_district',
	'Districts (MMDAs) with indicators',
	'geoBoundaries ADM2 (CC BY 4.0) with population (WorldPop), access to facilities (OpenStreetMap), low-lying areas (Copernicus DEM), land cover (ESA WorldCover) and built-up area (GHSL) per district.'
);
await setStyles('district', 'district_health_access', ['district_outline']);
// Same data with outline style as default, for clients that cannot pick a WMS style
await featureType(
	'district_boundaries',
	'gs_district',
	'District boundaries (MMDAs)',
	'geoBoundaries ADM2 (CC BY 4.0) for the five study areas, with all district indicators as attributes.'
);
await setStyles('district_boundaries', 'district_outline');
await featureType(
	'study_area',
	'gs_study_area',
	'Study areas',
	'The built-up metropolitan area analysed for each city.'
);
await setStyles('study_area', 'study_area');
for (const p of POIS) {
	await featureType(
		p.name,
		`gs_${p.name}`,
		p.title,
		'OpenStreetMap contributors (ODbL). Mapping completeness varies between cities.'
	);
	await setStyles(p.name, p.name);
}
console.log('vector layers published');

await mosaic(
	'population',
	'Population 2025 (100 m)',
	'WorldPop R2025A constrained estimates, residents per 100 m cell (CC BY 4.0).'
);
await mosaic(
	'low_lying',
	'Low-lying areas',
	'Cells at least 5 m below the mean elevation within ~500 m, derived from Copernicus DEM GLO-30. The DEM is a surface model that includes buildings and trees; treat as an indication, not a flood map.'
);
await mosaic(
	'surface_water',
	'Surface water occurrence 1984–2021',
	'JRC Global Surface Water v1.4: share of observations with water (Copernicus/Landsat, free use with attribution).'
);
await mosaic(
	'built',
	`Built-up area ${GHSL_EPOCHS[0]}–${GHSL_EPOCHS.at(-1)}`,
	'GHSL GHS-BUILT-S R2023A, built-up surface per ~90 m cell (CC BY 4.0). Use TIME=1975…2030; 2030 is a projection.',
	true
);
await mosaic(
	'heat',
	'Hotter or cooler than the city average',
	'Dry-season daytime land surface temperature (Landsat 8/9 Collection 2, Dec–Mar 2024/25 and 2025/26, ~10:30 local time) as °C difference from the median of each city. Courtesy of the U.S. Geological Survey, via Microsoft Planetary Computer.'
);
// Served locally: the Terrascope WorldCover WMS was not reliably reachable
await mosaic(
	'landcover',
	'Land cover 2021 (10 m)',
	'ESA WorldCover 2021 v200 (CC BY 4.0), cut to the five study areas.'
);
for (const name of ['population', 'low_lying', 'surface_water', 'built', 'landcover', 'heat']) {
	await removeOldRuns(name);
}
console.log('raster layers published');

await layerGroup('flood', 'Flood & Rain', [
	['low_lying', 'low_lying'],
	['surface_water', 'surface_water'],
	['district_boundaries', 'district_outline']
]);
await layerGroup('heat_air', 'Heat & Air', [
	['heat', 'heat'],
	['district_boundaries', 'district_outline']
]);
await layerGroup('services', 'Services & Access', [
	['district', 'district_health_access'],
	...POIS.slice(0, 3).map((p) => [p.name, p.name] as [string, string])
]);
await layerGroup('environment', 'Environment & Land Use', [
	['landcover', 'landcover'],
	['built', 'built'],
	['district_boundaries', 'district_outline']
]);
console.log('layer groups published');

// Tile caching: GeoWebCache creates a tile layer per published layer by default
const gwc = await fetch(`${base}/gwc/rest/layers.json`, { headers: { Authorization: auth } });
const cached: string[] = gwc.ok ? await gwc.json() : [];
console.log(
	`GeoWebCache tile layers in ${WS}: ${cached.filter((l) => l.startsWith(`${WS}:`)).length}`
);
