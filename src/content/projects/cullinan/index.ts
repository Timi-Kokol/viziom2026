import type { Project } from '../types';
import { projectMedia } from '../utils';

const slug = 'cullinan';
const m = (file: string) => projectMedia(slug, file);
const site = 'https://www.thecullinandubai.com/';

export const project: Project = {
	id: '03',
	slug,
	title: 'Cullinan',
	image: m('thumbnail.jpg'),
	url: site,
	caseStudy: {
		heroImage: m('hero.webp'),
		blocks: [
			{
				type: 'intro',
				text: 'A site for a fine steakhouse at Jumeirah Marsa Al Arab — wine, meat and hospitality with a view of the Arabian Gulf, and a digital presence as considered as the room.',
			},
			{
				type: 'cta',
				label: 'Visit website',
				href: site,
			},
			{
				type: 'meta',
				columns: [
					{
						title: 'Tasks',
						items: [
							{ label: 'Custom WordPress theme' },
							{ label: 'ACF block development' },
							{ label: 'GSAP animation' },
							{ label: 'Lenis smooth scroll' },
							{ label: 'Auto-deployment' },
						],
					},
					{
						title: 'Design',
						items: [{ label: 'Redbeerd', href: 'https://www.redbeerd.co.za/' }],
					},
					{
						title: 'Production',
						items: [{ label: 'GTIS', href: 'https://gtis.co.za/' }],
					},
				],
			},
			{
				type: 'video',
				poster: m('video-poster.webp'),
				src: m('hero-video.mp4'),
				alt: 'Walkthrough of The Cullinan dining room at Jumeirah Marsa Al Arab',
				autoplay: true,
				aspect: '16 / 9',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Inspired by the sights, sounds and sensations of new journeys, The Cullinan offers a level of quality and care one rarely experiences. A fine Dubai steakhouse that attends to every detail — travel by way of tradition, and encounter a story of modern luxury. The site had to do the same: arrive with presence, then make a reservation feel inevitable.',
			},
			{
				type: 'image',
				src: m('image-6.webp'),
				alt: 'The Cullinan dining room, set for service with the Gulf beyond the glass',
				aspect: '3 / 2',
			},
			{
				type: 'text',
				columns: 2,
				left: 'Redbeerd’s design is cream, serif, and photographic — a jewel box of wine, meat and hospitality that still has to book a table. I built it as a custom WordPress theme so none of that gets flattened by a template.',
				right: 'ACF blocks for the pages and fields, GSAP for the scroll-tied motion, Lenis for the glide. The team can ship menu, gallery and story without waiting on a developer, and every push deploys itself.',
			},
			{
				type: 'image',
				src: m('design/hero.jpg'),
				alt: 'Figma homepage hero — Discover The Cullinan, Timeless Luxury',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/jewel.jpg'),
				alt: 'A Fine Jewel of a Steakhouse — hospitality module from the homepage design',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'A fine jewel of a steakhouse: connoisseurs of wine, meat and hospitality, bringing a level of service meant to leave a memory. Gourmet dining, a sommelier’s cellar, the bar and lounge — the site treats each of them as a space, not a bullet list.',
			},
			{
				type: 'image',
				src: m('image-1.webp'),
				alt: 'Grilled Cullinan steak with the house butter seal',
				aspect: '3 / 2',
			},
			{
				type: 'text',
				columns: 1,
				text: 'To dine is the great pleasure of life. The menu journeys from shore to sea — meat, seafood and seasonal produce, all of extraordinary quality, with a reputation for steaks that is second to none. An iconic destination for the best meat fare, not a generic fine-dining page.',
			},
			{
				type: 'image',
				src: m('image-4.webp'),
				alt: 'Lobster and ravioli at The Cullinan',
				aspect: '2 / 3',
			},
			{
				type: 'imageRow',
				images: [
					{ src: m('image-3.webp'), alt: 'The Cullinan bar, sunburst screen and spirit shelves' },
					{ src: m('image-7.webp'), alt: 'Tableside drinks service from the Cullinan trolley' },
				],
			},
			{
				type: 'text',
				columns: 1,
				text: 'For those seeking beauty, opulence and the unknown, The Cullinan promises a dining experience like no other. Interiors, décor and handcrafted details borrow from explorers, naturalists and artists — a study of craftsmanship throughout generations, not a theme applied on top.',
			},
			{
				type: 'image',
				src: m('image-8.webp'),
				alt: 'Service from the Cullinan pass',
				aspect: '2 / 3',
			},
			{
				type: 'text',
				columns: 1,
				text: 'The Dubai restaurant emphasises quality, care, fine detail and a level of craft that is remarkably distinct. Costa Tomazos opened his first steakhouse in South Africa in 1976; FoodFund International is still family-owned, with restaurants across the UAE, Kuwait, Bahrain, Greece and Kenya. The Cullinan sits on the first floor of Jumeirah Marsa Al Arab — a welcome addition looking out over the Gulf.',
			},
			{
				type: 'image',
				src: m('image-2.webp'),
				alt: 'Terrace dining at The Cullinan with the Burj Al Arab at dusk',
				aspect: '3 / 4',
			},
			{
				type: 'image',
				src: m('design/dining.jpg'),
				alt: 'To dine is the great pleasure of life — menu chapter from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/wonders.jpg'),
				alt: 'Unearth a world of wonders — illustrated pattern from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/footer.jpg'),
				alt: 'Homepage close — Fine steakhouse in Dubai, reservations and FoodFund',
				fit: 'natural',
			},
		],
	},
};
