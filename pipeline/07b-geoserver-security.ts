/**
 * Makes GeoServer read-only for the public: the WFS only answers read requests
 * (service level BASIC, no Transaction/LockFeature), writing data requires the admin
 * role, and stored queries can only be changed by the admin. Safe to re-run; prints the
 * rules before and after.
 */
import { requireEnv } from './lib/env.ts';

const base = requireEnv('GEOSERVER_URL');
const auth =
	'Basic ' +
	Buffer.from(`${requireEnv('GEOSERVER_USER')}:${requireEnv('GEOSERVER_PASSWORD')}`).toString(
		'base64'
	);

async function rest(method: string, route: string, json?: unknown) {
	const res = await fetch(`${base}/rest/${route}`, {
		method,
		headers: {
			Authorization: auth,
			Accept: 'application/json',
			...(json === undefined ? {} : { 'Content-Type': 'application/json' })
		},
		body: json === undefined ? undefined : JSON.stringify(json)
	});
	if (!res.ok)
		throw new Error(`${method} ${route}: ${res.status} ${(await res.text()).slice(0, 300)}`);
	const text = await res.text();
	return text ? JSON.parse(text) : null;
}

/** Operations that change data or server state; only the admin may call them */
const ADMIN_ONLY_OPERATIONS = [
	'wfs.Transaction',
	'wfs.LockFeature',
	'wfs.GetFeatureWithLock',
	'wfs.CreateStoredQuery',
	'wfs.DropStoredQuery'
];

const before = {
	wfs: (await rest('GET', 'services/wfs/settings.json')).wfs.serviceLevel,
	layers: await rest('GET', 'security/acl/layers.json'),
	services: await rest('GET', 'security/acl/services.json')
};
console.log('before:', JSON.stringify(before));

// 1. WFS: read-only service level (GetCapabilities, DescribeFeatureType, GetFeature)
const wfs = await rest('GET', 'services/wfs/settings.json');
wfs.wfs.serviceLevel = 'BASIC';
await rest('PUT', 'services/wfs/settings', wfs);

// 2. Data: everyone may read, only the admin role may write
await rest(before.layers['*.*.w'] === undefined ? 'POST' : 'PUT', 'security/acl/layers', {
	'*.*.w': 'ADMIN'
});

// 3. Services: state-changing WFS operations for the admin only
const missing = ADMIN_ONLY_OPERATIONS.filter((op) => !(op in before.services));
const present = ADMIN_ONLY_OPERATIONS.filter((op) => op in before.services);
const rules = (ops: string[]) => Object.fromEntries(ops.map((op) => [op, 'ADMIN']));
if (missing.length) await rest('POST', 'security/acl/services', rules(missing));
if (present.length) await rest('PUT', 'security/acl/services', rules(present));

const after = {
	wfs: (await rest('GET', 'services/wfs/settings.json')).wfs.serviceLevel,
	layers: await rest('GET', 'security/acl/layers.json'),
	services: await rest('GET', 'security/acl/services.json')
};
console.log('after: ', JSON.stringify(after));
if (after.wfs !== 'BASIC' || after.layers['*.*.w'] !== 'ADMIN') {
	throw new Error('GeoServer is not read-only yet');
}
console.log('GeoServer is read-only for anonymous users');
