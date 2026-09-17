import type { Project } from '../types';
import { projectMedia } from '../utils';

/**
 * Copy this folder to `src/content/projects/{slug}/` and register in `../index.ts`.
 *
 * Assets go in `public/projects/{slug}/`:
 *   thumbnail.jpg   — carousel card
 *   hero.jpg        — case study hero
 *   video-poster.jpg, reel.mp4 — optional video block
 *   gallery/01.jpg … gallery/07.jpg — case study media
 */
const slug = 'project-slug';
const m = (file: string) => projectMedia(slug, file);

export const project: Project = {
	id: '05',
	slug,
	title: 'Project name',
	image: m('thumbnail.jpg'),
	url: 'https://example.com/',
	caseStudy: {
		heroImage: m('hero.jpg'),
		blocks: [
			{ type: 'intro', text: 'Short intro paragraph.' },
			{ type: 'cta', label: 'Visit website', href: 'https://example.com/' },
			{
				type: 'meta',
				columns: [
					{ title: 'Tasks', items: [{ label: 'Your role' }] },
					{ title: 'Design', items: [{ label: 'Studio', href: 'https://example.com/' }] },
				],
			},
			{ type: 'video', poster: m('video-poster.jpg'), src: m('reel.mp4'), alt: 'Project film still' },
			{ type: 'text', columns: 1, text: 'Single column body copy.' },
			{
				type: 'text',
				columns: 2,
				left: 'Left column copy.',
				right: 'Right column copy.',
			},
			{ type: 'image', src: m('gallery/01.jpg'), alt: 'Full-width still' },
			{
				type: 'imageRow',
				images: [
					{ src: m('gallery/02.jpg'), alt: 'Detail one' },
					{ src: m('gallery/03.jpg'), alt: 'Detail two' },
				],
			},
			{
				type: 'slider',
				images: [
					{ src: m('gallery/04.jpg'), alt: 'Slide 01' },
					{ src: m('gallery/05.jpg'), alt: 'Slide 02' },
					{ src: m('gallery/06.jpg'), alt: 'Slide 03' },
					{ src: m('gallery/07.jpg'), alt: 'Slide 04' },
				],
			},
		],
	},
};
