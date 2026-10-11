export const topics = [
	{ slug: 'flood', name: 'Flood & Rain', short: 'Flood & Rain' },
	{ slug: 'heat-air', name: 'Heat & Air', short: 'Heat & Air' },
	{ slug: 'services', name: 'Services & Access', short: 'Services' },
	{ slug: 'environment', name: 'Environment', short: 'Environment' }
] as const;

export type TopicSlug = (typeof topics)[number]['slug'];
