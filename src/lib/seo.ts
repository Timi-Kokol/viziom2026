import { PROJECTS } from '@/content/projects';

const FALLBACK_SITE_URL = 'https://www.viziom.si';

const toOrigin = (value: string) => {
	const url = new URL(value.startsWith('http') ? value : `https://${value}`);
	if (url.hostname === 'api.viziom.si') return null;
	// Apex 308s to www; Facebook often drops og:image when that URL redirects.
	if (url.hostname === 'viziom.si') return FALLBACK_SITE_URL;
	return `${url.protocol}//${url.host}`.replace(/\/+$/, '');
};

export const getSiteUrl = () => {
	const candidates = [process.env.NEXT_PUBLIC_SITE_URL, FALLBACK_SITE_URL];
	for (const raw of candidates) {
		const value = raw?.trim();
		if (!value) continue;
		try {
			const origin = toOrigin(value);
			if (origin) return origin;
		} catch {
			continue;
		}
	}
	return FALLBACK_SITE_URL;
};

export const SITE = {
	name: 'Viziom',
	legalName: 'VIZIOM, Timi KOKOL, s.p.',
	founder: 'Timi Kokol',
	tagline: 'Custom web experiences',
	kicker: 'Designed. Developed. Optimized.',
	description:
		'Viziom builds custom web experiences for people who value quality — Next.js, WordPress, and WebGL, designed, developed, and optimized. Based in Maribor, working globally.',
	email: 'info@viziom.si',
	phone: '+38640908585',
	phoneDisplay: '+386 40 908 585',
	locale: 'en',
	ogLocale: 'en_US',
	address: {
		street: 'Žoherjeva ulica 31',
		locality: 'Maribor',
		postalCode: '2000',
		country: 'SI',
		countryName: 'Slovenia',
	},
} as const;

export const getMetadataBase = () => new URL(getSiteUrl());

export const getCanonicalUrl = (path = '/') => {
	const base = getSiteUrl();
	if (path === '/') return `${base}/`;
	const trimmed = path.replace(/^\/+|\/+$/g, '');
	return `${base}/${trimmed}/`;
};

export const getJsonLd = () => {
	const url = getCanonicalUrl('/');
	const projects = PROJECTS.map((project, index) => ({
		'@type': 'ListItem' as const,
		position: index + 1,
		name: project.title,
		url: project.url,
	}));

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'ProfessionalService',
				'@id': `${url}#business`,
				name: SITE.name,
				legalName: SITE.legalName,
				url,
				email: SITE.email,
				telephone: SITE.phone,
				image: `${getSiteUrl()}/logo.svg`,
				description: SITE.description,
				areaServed: 'Worldwide',
				priceRange: '$$',
				address: {
					'@type': 'PostalAddress',
					streetAddress: SITE.address.street,
					addressLocality: SITE.address.locality,
					postalCode: SITE.address.postalCode,
					addressCountry: SITE.address.country,
				},
				founder: { '@id': `${url}#person` },
				employee: { '@id': `${url}#person` },
			},
			{
				'@type': 'Person',
				'@id': `${url}#person`,
				name: SITE.founder,
				jobTitle: 'Developer',
				worksFor: { '@id': `${url}#business` },
				email: SITE.email,
				telephone: SITE.phone,
				image: `${getSiteUrl()}/timi-kokol.png`,
				address: {
					'@type': 'PostalAddress',
					addressLocality: SITE.address.locality,
					addressCountry: SITE.address.country,
				},
			},
			{
				'@type': 'WebSite',
				'@id': `${url}#website`,
				name: SITE.name,
				url,
				description: SITE.description,
				inLanguage: 'en',
				publisher: { '@id': `${url}#business` },
			},
			{
				'@type': 'ItemList',
				'@id': `${url}#work`,
				name: 'Selected projects',
				itemListElement: projects,
			},
		],
	};
};
