import { describe, expect, it } from 'vitest';
import { geoServerAccess, isPublicGeoServerRequest } from './geoserver-access.ts';

const allowed = (path: string, query = '', method = 'GET') =>
	isPublicGeoServerRequest(method, path, new URLSearchParams(query));

describe('isPublicGeoServerRequest', () => {
	it('forwards the read-only map and feature services', () => {
		expect(allowed('/ghana/wms', 'service=WMS&request=GetMap&layers=ghana:flood')).toBe(true);
		expect(allowed('/ghana/wms', 'request=GetLegendGraphic&layer=ghana:heat')).toBe(true);
		expect(allowed('/ghana/wfs', 'service=WFS&request=GetFeature&typeNames=ghana:poi')).toBe(true);
		expect(allowed('/ghana/ows', 'service=WFS&request=GetCapabilities')).toBe(true);
		expect(allowed('/ghana/gwc/service/wmts', 'request=GetCapabilities')).toBe(true);
		expect(allowed('/ghana/gwc/service/wmts/rest/ghana:flood/raster/EPSG:3857/10/1/1')).toBe(true);
		expect(allowed('/ghana/wms', '', 'HEAD')).toBe(true);
	});

	it('keeps the global endpoints closed, which list GeoServer demo layers', () => {
		expect(allowed('/ows', 'service=WFS&request=GetCapabilities')).toBe(false);
		expect(allowed('/wms', 'service=WMS&request=GetCapabilities')).toBe(false);
		expect(allowed('/gwc/service/wmts', 'request=GetCapabilities')).toBe(false);
		expect(allowed('/topp/wms', 'request=GetMap')).toBe(false);
	});

	it('keeps the admin interface and REST API local', () => {
		expect(allowed('')).toBe(false);
		expect(allowed('/')).toBe(false);
		expect(allowed('/web/')).toBe(false);
		expect(allowed('/rest/workspaces')).toBe(false);
		expect(allowed('/gwc/rest/layers')).toBe(false);
		expect(allowed('/j_spring_security_check')).toBe(false);
		expect(allowed('/ghana/wms/../../rest')).toBe(false);
	});

	it('refuses requests that change data, in any spelling', () => {
		expect(allowed('/ghana/wfs', 'service=WFS&request=Transaction')).toBe(false);
		expect(allowed('/ghana/wfs', 'REQUEST=transaction')).toBe(false);
		expect(allowed('/ows', 'request=LockFeature')).toBe(false);
		expect(allowed('/ows', 'request=GetFeatureWithLock')).toBe(false);
		expect(allowed('/ows', 'request=CreateStoredQuery')).toBe(false);
		expect(allowed('/ghana/wfs', 'request=GetFeature', 'POST')).toBe(false);
		expect(allowed('/ghana/wms', 'request=GetMap', 'PUT')).toBe(false);
	});

	it('refuses remote and inline styles, which make GeoServer fetch other URLs', () => {
		expect(allowed('/ghana/wms', 'request=GetMap&SLD=http://example.org/x.sld')).toBe(false);
		expect(allowed('/ghana/wms', 'request=GetMap&sld_body=%3CStyledLayerDescriptor/%3E')).toBe(
			false
		);
	});
});

describe('geoServerAccess', () => {
	const q = new URLSearchParams();
	const publicOnly = geoServerAccess(false);
	const withAdmin = geoServerAccess(true);

	it('keeps the admin interface closed by default', () => {
		expect(publicOnly('GET', '/web/', q)).toBe(false);
		expect(publicOnly('POST', '/j_spring_security_check', q)).toBe(false);
		expect(publicOnly('GET', '/ghana/wms', new URLSearchParams('request=GetMap'))).toBe(true);
	});

	it('opens the admin pages and login when switched on', () => {
		expect(withAdmin('GET', '/web/', q)).toBe(true);
		expect(withAdmin('GET', '', q)).toBe(true);
		expect(withAdmin('POST', '/j_spring_security_check', q)).toBe(true);
		expect(withAdmin('POST', '/web/wicket/page', q)).toBe(true);
		expect(withAdmin('GET', '/openlayers3/ol.js', q)).toBe(true);
	});

	it('never forwards the REST API', () => {
		expect(withAdmin('GET', '/rest/workspaces', q)).toBe(false);
		expect(withAdmin('PUT', '/rest/security/self/password', q)).toBe(false);
		expect(withAdmin('GET', '/rest', q)).toBe(false);
		expect(withAdmin('GET', '/REST/about', q)).toBe(false);
		expect(withAdmin('GET', '/gwc/rest/layers', q)).toBe(false);
	});
});
