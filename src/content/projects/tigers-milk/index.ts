import type { Project } from '../types';
import { projectMedia } from '../utils';

const slug = 'tigers-milk';
const m = (file: string) => projectMedia(slug, file);
const site = 'https://www.tigersmilk.co.za/';

export const project: Project = {
	id: '04',
	slug,
	title: 'Tiger’s Milk',
	image: m('thumbnail.jpg'),
	url: site,
	caseStudy: {
		heroImage: m('hero-image.jpg'),
		blocks: [
			{
				type: 'intro',
				text: 'A site for a South African restaurant and bar — the good time’s on us — food, drink and a night out, with a digital presence as loud as the room.',
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
				poster: m('video-poster.jpg'),
				src: m('hero-video.mp4'),
				alt: 'Tiger’s Milk film — the room, the grill, a toast',
				autoplay: true,
				aspect: '16 / 9',
			},
			{
				type: 'text',
				columns: 1,
				text: 'The insider. The outsider. The ankle-biter. The innies and the outies. The lefties and the righties. It’s back then and what’s to come, but most of all it’s now. Because tomorrow’s a day away, and the present keeps giving us that look. As the old saying goes, before the new saying gets here, drink and be merry! Neither here, nor there, but everywhere. It’s for one, and all, it’s for you, and milking this life for all it’s worth!',
			},
			{
				type: 'image',
				src: m('design/hero.jpg'),
				alt: 'Figma homepage hero — The Good Time’s On Us',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 2,
				left: 'Redbeerd’s design is loud on purpose — stacked type, a wink in every line, photography that looks like a Friday. I built it as a custom WordPress theme so none of that gets flattened by a template.',
				right: 'ACF blocks for the pages and fields, GSAP for the scroll-tied motion, Lenis for the glide. They can ship locations, menus and nights without waiting on a developer, and every push deploys itself.',
			},
			{
				type: 'image',
				src: m('design/intro.jpg'),
				alt: 'Well, look who showed up — scroll collage from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/manifesto.jpg'),
				alt: 'So what is Tiger’s Milk — manifesto from the homepage design',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Every human being should have access to a Tiger’s Milk, but before we conquer the world… we’re doing our best to reach everybody in South Africa. Check out our locations and see if one’s near you.',
			},
			{
				type: 'image',
				src: m('hero-image.jpg'),
				alt: 'Friends at a Tiger’s Milk booth, drinks on the table',
				aspect: '1728 / 564',
			},
			{
				type: 'image',
				src: m('design/locations.jpg'),
				alt: 'Where we’re at — locations chapter from the homepage design',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Here’s to you, having a drink. It’s been a hard day’s night and you deserve it. Or maybe not. Maybe, you just feel like a high-quality glug. Nothing wrong with that. Nothing wrong at all! Or, it’s in the simple recognition of finding yourself here, at this exceptionally premium watering hole.',
			},
			{
				type: 'image',
				src: m('hero-image-2.jpg'),
				alt: 'Tiger’s Milk burger with bacon, cheese and a fried egg',
				aspect: '1728 / 737',
			},
			{
				type: 'image',
				src: m('design/food.jpg'),
				alt: 'Everyone likes a good epiphany — food chapter from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/drink.jpg'),
				alt: 'Tiger’s Milk drink marquee from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/bookings.jpg'),
				alt: 'Bookings and specials modules from the homepage design',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'We reserve the right to party, and party with a respectable intensity. Always at the ready for a celebration, whatever the occasion, Tiger’s Milk was born to entertain. And entertain we shall!',
			},
			{
				type: 'image',
				src: m('hero-image-3.jpg'),
				alt: 'Four friends holding burgers at the Tiger’s Milk bar',
				aspect: '1728 / 1117',
			},
			{
				type: 'image',
				src: m('design/events.jpg'),
				alt: 'We reserve the right to party — events chapter from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/contact.jpg'),
				alt: 'This is all about your good time — contact chapter from the homepage design',
				fit: 'natural',
			},
			{
				type: 'image',
				src: m('design/footer.jpg'),
				alt: 'Homepage close — locations, menus and Life & Brand',
				fit: 'natural',
			},
		],
	},
};
