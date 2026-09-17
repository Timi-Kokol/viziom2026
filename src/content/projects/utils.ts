import type { Project } from './types';

/** Base public path for a project folder: `/projects/{slug}` */
export const projectBase = (slug: string) => `/projects/${slug}`;

/** Asset path inside a project folder, e.g. `media('arkhe', 'gallery/01.jpg')` */
export const projectMedia = (slug: string, file: string) => `${projectBase(slug)}/${file}`;

export const getProjectBySlug = (projects: Project[], slug: string) =>
	projects.find((project) => project.slug === slug) ?? null;
