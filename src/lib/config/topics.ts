export const topics = [
	{ slug: 'flood', name: 'Flood & Rain' },
	{ slug: 'heat-air', name: 'Heat & Air' },
	{ slug: 'services', name: 'Services & Access' },
	{ slug: 'environment', name: 'Environment' }
] as const;

export type TopicSlug = (typeof topics)[number]['slug'];
