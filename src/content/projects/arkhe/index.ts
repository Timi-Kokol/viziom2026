import type { Project } from '../types';
import { projectMedia } from '../utils';

const slug = 'arkhe';
const m = (file: string) => projectMedia(slug, file);
const site = 'http://arkhe.dev.dedi6287.your-server.de/';

export const project: Project = {
	id: '01',
	slug,
	title: 'Arkhe',
	image: m('thumbnail.jpg'),
	url: site,
	caseStudy: {
		heroImage: m('hero.jpg'),
		blocks: [
			{
				type: 'intro',
				text: 'A site for a performance wellness club in Dubai Marina — training, recovery, longevity and community under one membership, with a digital presence as connected as the club.',
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
				type: 'text',
				columns: 1,
				text: 'ARKHE is a performance wellness club in Dubai Marina, bringing together performance training, unlimited recovery, longevity and community through one connected membership. The site had to do the same: one club, one story — not a brochure of disconnected services.',
			},
			{
				type: 'image',
				src: m('arkhe-gym.jpg'),
				alt: 'ARKHE reception looking out over Dubai Marina',
			},
			{
				type: 'text',
				columns: 2,
				left: 'Redbeerd’s design is dark, photographic, and editorial — a science-led club that still feels human. I built it as a custom WordPress theme so none of that gets flattened by a template.',
				right: 'ACF blocks for the pages and fields, GSAP for the scroll-tied motion, Lenis for the glide. The team can ship memberships, classes and recovery content without waiting on a developer, and every push deploys itself.',
			},
			{
				type: 'image',
				src: m('design/hero.jpg'),
				alt: 'Figma homepage hero — Build your Arkhe over the Marina gym floor',
				fit: 'natural',
			},
			{
				type: 'imageRow',
				aspect: '16 / 9',
				images: [
					{
						src: m('design/membership.jpg'),
						alt: 'Membership module from the homepage design — built with intent',
					},
					{
						src: m('design/classes.jpg'),
						alt: 'Classes module from the homepage design — training that builds real strength',
					},
				],
			},
			{
				type: 'text',
				columns: 1,
				text: 'Memberships are designed around how you train — flexible, seasonal or annual, with classes, PILAT3S and integrated ARKHE LONGEVITY-UK programmes. Every membership includes unlimited recovery. From flexible training to fully managed performance programmes, you choose how far you want to go.',
			},
			{
				type: 'image',
				src: m('gallery/image-1.jpg'),
				alt: 'Strength training on the ARKHE gym floor',
			},
			{
				type: 'text',
				columns: 1,
				text: 'No single way of training delivers everything your body needs. That’s why the ARKHE timetable combines functional fitness, strength, running, Pilates, yoga and recovery-focused movement — every class a part of a balanced programme, not a one-off.',
			},
			{
				type: 'imageRow',
				images: [
					{ src: m('gallery/image-2.jpg'), alt: 'Coaching on the ARKHE studio floor' },
					{ src: m('gallery/image-3.jpg'), alt: 'Mobility and mind-body training at ARKHE' },
				],
			},
			{
				type: 'image',
				src: m('image-2.jpg'),
				alt: 'Movement training in the ARKHE studio',
				aspect: '4 / 5',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Recovery is included, not upsold. Cold plunge, hyperbaric oxygen, red light, sauna, compression — the wellness chapter treats each space as part of the same routine as the gym floor.',
			},
			{
				type: 'image',
				src: m('design/recovery.jpg'),
				alt: 'Recovery, done properly — wellness module from the homepage design',
				fit: 'natural',
			},
			{
				type: 'imageRow',
				images: [
					{ src: m('gallery/image-4.jpg'), alt: 'Recovery and stillness at ARKHE' },
					{ src: m('gallery/image-5.jpg'), alt: 'Rest after training at ARKHE' },
				],
			},
			{
				type: 'text',
				columns: 1,
				text: 'ARKHE was created to make looking after your health feel more connected. Rather than separating training, recovery and wellbeing, they live under one roof — and The Circle gives that routine a place to work, meet and stay consistent.',
			},
			{
				type: 'image',
				src: m('image-3.jpg'),
				alt: 'Members gathering at The Circle, ARKHE’s café and social space',
			},
			{
				type: 'image',
				src: m('image-4.jpg'),
				alt: 'The ARKHE community heading out together',
			},
			{
				type: 'image',
				src: m('design/footer.jpg'),
				alt: 'Homepage close — Structure facilitates clarity. Clarity creates progress.',
				fit: 'natural',
			},
		],
	},
};
