/** City photos from Wikimedia Commons (self-hosted under static/img/cities) */
export interface Photo {
	alt: string;
	author: string;
	license: string;
	licenseUrl: string;
	source: string;
	/** width / height of the stored images */
	ratio: number;
}

export const photos: Record<string, Photo> = {
	accra: {
		alt: 'Office towers in Airport City, Accra, at dusk',
		author: 'Synth85',
		license: 'CC BY-SA 4.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
		source: 'https://commons.wikimedia.org/wiki/File:Accra_Skyline_-_Ghana.jpg',
		ratio: 800 / 533
	},
	kumasi: {
		alt: 'Busy street with taxis and arcaded shops in central Kumasi',
		author: 'ZSM',
		license: 'CC BY-SA 3.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
		source: 'https://commons.wikimedia.org/wiki/File:Kumasi,_Ghana.jpg',
		ratio: 800 / 436
	},
	tamale: {
		alt: 'Row of shops beside a large shade tree on a dusty street in Tamale',
		author: 'Matti Blume',
		license: 'CC BY-SA 4.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
		source: 'https://commons.wikimedia.org/wiki/File:Street,_Tamale_(P1100272-Pano).jpg',
		ratio: 800 / 590
	},
	'sekondi-takoradi': {
		alt: 'Old two-storey houses along a street in Sekondi',
		author: 'Kwameghana',
		license: 'CC BY-SA 4.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
		source:
			'https://commons.wikimedia.org/wiki/File:Residential_houses_in_Secondi_Takoradi_%CC%A0_2.jpg',
		ratio: 800 / 514
	},
	'cape-coast': {
		alt: 'Rooftops of Cape Coast seen from Fort Victoria, with the sea behind',
		author: 'Adam Jones',
		license: 'CC BY-SA 2.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
		source:
			'https://commons.wikimedia.org/wiki/File:View_over_Town_from_Fort_Victoria_-_Cape_Coast_-_Ghana_(4737799143).jpg',
		ratio: 800 / 533
	}
};

export const photoSrc = (slug: string, width: 400 | 800) => `/img/cities/${slug}-${width}.jpg`;
