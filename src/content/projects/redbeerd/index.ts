import type { Project } from '../types';
import { projectMedia } from '../utils';

const slug = 'redbeerd';
const m = (file: string) => projectMedia(slug, file);
const site = 'https://www.redbeerd.co.za/';

export const project: Project = {
	id: '04',
	slug,
	title: 'Redbeerd',
	image: m('thumbnail.jpg'),
	url: site,
	caseStudy: {
		heroImage: m('hero.jpg'),
		blocks: [
			{
				type: 'intro',
				text: 'A studio site for an independent branding practice — the work is the homepage, not a brochure of services.',
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
						items: [{ label: 'Redbeerd', href: site }],
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
				src: m('video.mp4'),
				alt: 'Redbeerd wordmark film',
				autoplay: true,
				aspect: '2000 / 2304',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Partnering with good people to create better brands. Your idea deserves a brand that is honest, creative and designed to grow. The site had to do the same: put the partnerships first, then make strategy, branding and design feel like one practice — not three service pages.',
			},
			{
				type: 'image',
				src: m('design/hero.jpg'),
				alt: 'Figma homepage — Partnering with good people to create better brands',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 2,
				left: 'Redbeerd designed their own house — a red mark, quiet type, and a grid of the work. I built it as a custom WordPress theme so the case studies stay the product, not a blog template.',
				right: 'ACF blocks for the pages and fields, GSAP for the scroll-tied motion, Lenis for the glide. They can ship a new partnership without waiting on a developer, and every push deploys itself.',
			},
			{
				type: 'image',
				src: m('design/work.jpg'),
				alt: 'Homepage work grid — Cullinan, Arkhe, MetCon, Asteria, Nama',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'The homepage is the proof: archetypal partnerships, tagged and linked, not a reel of stock. Cullinan, Arkhe, MetCon, Nama — each tile is a case. That’s the point of the build. There isn’t a lifestyle gallery to lean on. The work is the image.',
			},
			{
				type: 'image',
				src: m('image-1.jpg'),
				alt: 'BEER rooftop sign with Redbeerd scrawled in red',
				aspect: '6 / 5',
			},
			{
				type: 'video',
				poster: m('video-2-poster.webp'),
				src: m('video-2.mp4'),
				alt: 'Redbeerd studio portrait film',
				autoplay: true,
				aspect: '2000 / 2304',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Strategy uncovers the real problem, the human value and the potential behind it. Branding doesn’t shout the loudest — it grabs the people who matter. Design is the product: thoughtful application and sinless craft, so brave brands can push what’s possible.',
			},
			{
				type: 'image',
				src: m('design/manifesto.jpg'),
				alt: 'Strategy, branding and design — studio manifesto from the homepage',
				fit: 'natural',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Redbeerd is an independent studio of strategists, designers, writers and thinkers — they create, elevate and guard brands that connect. How they do it: maybe it lives in your hands, maybe on the screen. Every project gets its own solutions. A core team, plus an ever-growing collective of independent partners, working fast so the process is enjoyable and the results remarkable.',
			},
			{
				type: 'image',
				src: m('design/footer.jpg'),
				alt: 'Homepage close — Lisbon, Johannesburg, Landes, and the red Redbeerd footer',
				fit: 'natural',
			},
		],
	},
};
