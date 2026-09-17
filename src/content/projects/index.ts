import { project as arkhe } from './arkhe';
import { project as bower } from './bower';
import { project as cullinan } from './cullinan';
import { project as tigersMilk } from './tigers-milk';
import { getProjectBySlug as findBySlug } from './utils';

/** Carousel order — add new projects here. */
export const PROJECTS = [arkhe, bower, cullinan, tigersMilk];

export const getProjectBySlug = (slug: string) => findBySlug(PROJECTS, slug);

export type {
	CaseStudyBlock,
	CaseStudyImage,
	CaseStudyMetaColumn,
	CaseStudyMetaItem,
	Project,
	ProjectMeta,
} from './types';

export { projectBase, projectMedia } from './utils';
