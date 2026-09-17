export type CaseStudyMetaItem = {
	label: string;
	href?: string;
};

export type CaseStudyMetaColumn = {
	title: string;
	items: CaseStudyMetaItem[];
};

export type CaseStudyImage = {
	src: string;
	alt: string;
};

export type CaseStudyBlock =
	| { type: 'intro'; text: string }
	| { type: 'cta'; label: string; href: string }
	| { type: 'meta'; columns: CaseStudyMetaColumn[] }
	| { type: 'video'; poster: string; src?: string; alt?: string; autoplay?: boolean; aspect?: string }
	| { type: 'text'; columns: 1; text: string }
	| { type: 'text'; columns: 2; left: string; right: string }
	| { type: 'image'; src: string; alt: string; aspect?: string; fit?: 'cover' | 'natural' }
	| { type: 'imageRow'; images: CaseStudyImage[]; aspect?: string }
	| { type: 'slider'; images: CaseStudyImage[] };

export type Project = {
	id: string;
	slug: string;
	title: string;
	image: string;
	url: string;
	caseStudy: {
		heroImage: string;
		blocks: CaseStudyBlock[];
	};
};

export type ProjectMeta = Pick<Project, 'id' | 'slug' | 'title' | 'image' | 'url'>;
