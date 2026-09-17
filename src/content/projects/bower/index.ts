import type { Project } from '../types';
import { projectMedia } from '../utils';

const slug = 'bower';
const m = (file: string) => projectMedia(slug, file);

export const project: Project = {
	id: '02',
	slug,
	title: 'Bower',
	image: m('thumbnail.jpg'),
	url: 'https://bowerbk.com/',
	caseStudy: {
		heroImage: m('hero.webp'),
		blocks: [
			{
				type: 'intro',
				text: 'A leasing site for 2683 Atlantic Avenue that had to feel as considered as the architecture — editorial type, material photography, and motion that never gets in the way of booking a tour.',
			},
			{
				type: 'cta',
				label: 'Visit website',
				href: 'https://bowerbk.com/',
			},
			{
				type: 'meta',
				columns: [
					{
						title: 'Tasks',
						items: [
							{ label: 'Custom WordPress theme' },
							{ label: 'Block Studio development' },
							{ label: 'GSAP animation' },
							{ label: 'Lenis smooth scroll' },
							{ label: 'Auto-deployment' },
						],
					},
					{
						title: 'Design',
						items: [{ label: 'KD', href: 'https://www.krinskydesign.com/' }],
					},
					{
						title: 'Production',
						items: [{ label: 'Code Resolution', href: 'https://coderesolution.com/' }],
					},
				],
			},
			{
				type: 'video',
				poster: m('video-poster.webp'),
				src: m('hero-video.mp4'),
				alt: 'Bower lobby and amenity walkthrough',
				autoplay: true,
				aspect: '4 / 3',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Bower Brooklyn is an exclusive collection of two-bedroom residences on one of the borough’s most lived-on avenues. Expansive layouts, refined finishes, and a facade that sits between contemporary expression and the character of Cypress Hills. The digital experience had to do the same: arrive with presence, then make residences, amenities, and a tour request feel inevitable.',
			},
			{
				type: 'image',
				src: m('image-hero-2.webp'),
				alt: 'A Bower two-bedroom interior looking out toward the Manhattan skyline',
			},
			{
				type: 'text',
				columns: 2,
				left: 'KD’s design is quiet on purpose. Cream, burgundy, a display serif that fills the viewport, photography that does the talking. I built it as a custom WordPress theme so none of that gets flattened by a template.',
				right: 'Block Studio for the blocks and fields, GSAP for the scroll-tied motion, Lenis for the glide. The leasing team can swap stills and copy without waiting on a developer, and every push ships itself.',
			},
			{
				type: 'image',
				src: m('design/hero.webp'),
				alt: 'Figma homepage hero — BOWER set over the Atlantic Avenue facade',
				fit: 'natural',
			},
			{
				type: 'imageRow',
				aspect: '16 / 9',
				images: [
					{
						src: m('design/residences.webp'),
						alt: 'Residences module from the homepage design — kitchen still beside Designed with Intention',
					},
					{
						src: m('design/brooklyn.webp'),
						alt: 'Neighborhood module from the homepage design — Rooted in Brooklyn',
					},
				],
			},
			{
				type: 'text',
				columns: 1,
				text: 'From the skyline pool to the spa, co-working lounge, playroom and gym — the amenities are designed to support how you move, work, and unwind, all under one roof. The site treats each of them as a space, not a bullet list.',
			},
			{
				type: 'image',
				src: m('gallery/image-1.webp'),
				alt: 'Skyline pool on the Bower rooftop at dusk',
				aspect: '4 / 3',
			},
			{
				type: 'imageRow',
				images: [
					{ src: m('gallery/image-2.webp'), alt: 'Children’s playroom at Bower' },
					{ src: m('gallery/image-3.webp'), alt: 'Co-working lounge at Bower' },
				],
			},
			{
				type: 'imageRow',
				aspect: '16 / 9',
				images: [
					{ src: m('gallery/image-4.webp'), alt: 'Spa and recovery room at Bower' },
					{ src: m('gallery/image-5.webp'), alt: 'Fitness gym at Bower' },
				],
			},
			{
				type: 'image',
				src: m('image-hero-3.webp'),
				alt: 'Manhattan skyline from Brooklyn, looking west over Cypress Hills',
			},
			{
				type: 'text',
				columns: 1,
				text: 'Set along Atlantic Avenue, Bower puts dining, coffee, parks and transit at the door — with Downtown Brooklyn and Manhattan a short ride away. The neighborhood chapter is paced like a walk, not a map dump.',
			},
			{
				type: 'image',
				src: m('design/everyday.webp'),
				alt: 'Elevated Everyday — amenities chapter from the homepage design',
				fit: 'natural',
			},
		],
	},
};
