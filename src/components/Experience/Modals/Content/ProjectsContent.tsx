'use client';

import React, { useCallback, useRef, useState } from 'react';
import PixelateHero from './PixelateHero';
import QuoteCta from './QuoteCta';
import ProjectsCarousel from './ProjectsCarousel';
import ProjectMeta from './ProjectMeta';
import { PROJECTS } from '@/content/projects';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import { useModal } from '../../ModalContext';
import { useModalContentReveal } from './useModalContentReveal';
import {
	PopupContentWrapper,
	Hero,
	HeroCopy,
	HeroTitle,
	HeroKicker,
	Stage,
} from './ProjectsContent.styles';

type ProjectsContentProps = {
	onQuote?: () => void;
};

const wrapDir = (from: number, to: number, count: number) => {
	let d = to - from;
	d -= Math.round(d / count) * count;
	return d >= 0 ? 1 : -1;
};

const ProjectsContent: React.FC<ProjectsContentProps> = ({ onQuote }) => {
	const [active, setActive] = useState(1);
	const [direction, setDirection] = useState(1);
	const [cardHot, setCardHot] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const prevActive = useRef(1);
	const cardHotRef = useRef(false);
	const cardHoverRef = useRef({
		on: false,
		overMeta: false,
		clientX: 0,
		clientY: 0,
	});
	const project = PROJECTS[active] ?? PROJECTS[0];
	const { triggerHover } = useHaptics();
	const { openCaseStudy } = useModal();
	useModalContentReveal(rootRef);

	const handleActiveChange = (next: number) => {
		if (next === prevActive.current) return;
		setDirection(wrapDir(prevActive.current, next, PROJECTS.length));
		prevActive.current = next;
		setActive(next);
	};

	const openActiveCaseStudy = useCallback(() => {
		if (!project?.slug) return;
		openCaseStudy(project.slug);
	}, [openCaseStudy, project?.slug]);

	const handleCardHover = useCallback(
		(hot: boolean) => {
			if (hot === cardHotRef.current) return;
			cardHotRef.current = hot;
			setCardHot(hot);
			if (hot) {
				getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
				triggerHover();
			}
		},
		[triggerHover],
	);

	return (
		<PopupContentWrapper ref={rootRef}>
			<Hero>
				<PixelateHero />
				<HeroCopy>
					<HeroTitle data-reveal="hero">
						Selected
						<br />
						projects
					</HeroTitle>
					<HeroKicker data-reveal="hero">Work I&apos;m proud of</HeroKicker>
				</HeroCopy>
			</Hero>

			<Stage
				onPointerMove={(e) => {
					cardHoverRef.current.on = true;
					cardHoverRef.current.clientX = e.clientX;
					cardHoverRef.current.clientY = e.clientY;
					cardHoverRef.current.overMeta = Boolean(
						e.target instanceof Element && e.target.closest('[data-project-meta]'),
					);
				}}
				onPointerLeave={() => {
					cardHoverRef.current.on = false;
					cardHoverRef.current.overMeta = false;
					handleCardHover(false);
				}}
			>
				<ProjectsCarousel
					activeIndex={active}
					onActiveChange={handleActiveChange}
					cardHoverRef={cardHoverRef}
					onCardHover={handleCardHover}
					onSelect={openActiveCaseStudy}
				/>
				<ProjectMeta
					project={project}
					direction={direction}
					hovered={cardHot}
					onOpen={openActiveCaseStudy}
				/>
			</Stage>

			<QuoteCta onQuote={onQuote} />
		</PopupContentWrapper>
	);
};

ProjectsContent.displayName = 'ProjectsContent';
export default ProjectsContent;
