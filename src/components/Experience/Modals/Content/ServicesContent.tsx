'use client';

import React, { useMemo, useRef } from 'react';
import PixelateHero from './PixelateHero';
import QuoteCta from './QuoteCta';
import SequenceScrub from './SequenceScrub';
import { useModalContentReveal } from './useModalContentReveal';
import {
	PopupContentWrapper,
	Hero,
	HeroCopy,
	HeroTitle,
	HeroKicker,
	Intro,
	Copy,
	Service,
	Sequence,
	ServiceCopy,
	ServiceTitle,
	ServiceKicker,
	ServiceBody,
	Columns,
	Column,
	ColumnTitle,
	ColumnList,
} from './ServicesContent.styles';

type ServicesContentProps = {
	onQuote?: () => void;
};

const FRAME_COUNT = 60;

// Flip to false once the scrub ranges feel right.
const SEQUENCE_MARKERS = false;
const SEQUENCE_START = 'top 80%';
const SEQUENCE_END = 'bottom top';

const frameUrls = (folder: string) =>
	Array.from(
		{ length: FRAME_COUNT },
		(_, i) => `/icons/${folder}/webp/${String(i + 1).padStart(4, '0')}.webp`,
	);

const ServicesContent: React.FC<ServicesContentProps> = ({ onQuote }) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const nextFrames = useMemo(() => frameUrls('nextjs-sequence'), []);
	const wpFrames = useMemo(() => frameUrls('wordpress-sequence'), []);
	useModalContentReveal(rootRef);

	return (
		<PopupContentWrapper ref={rootRef}>
			<Hero>
				<PixelateHero />
				<HeroCopy>
					<HeroTitle data-reveal="hero">
						I build digital
						<br />
						experiences
					</HeroTitle>
					<HeroKicker data-reveal="hero">Then I stay with them.</HeroKicker>
				</HeroCopy>
			</Hero>

			<Intro>
				<Copy data-reveal>
					I design and build custom web work — the kind that looks considered and does not fall apart under a CMS, a campaign, or a 3D scene.
				</Copy>
				<Copy data-reveal>
					I don&apos;t use templates. The stack, the motion, the editor — all built around the project.
				</Copy>
				<Copy data-reveal>
					WordPress when you need to own the content. Next.js when it has to feel like a product. Three.js when a flat page is not the point.
				</Copy>
				<Copy data-reveal>
					I take fewer projects so I can stay in them. Fast, yes. Cheap theater, no.
				</Copy>
			</Intro>

			<Service data-sequence-trigger>
				<Sequence>
					<SequenceScrub
						frames={nextFrames}
						alt="Next.js emblem"
						start={SEQUENCE_START}
						end={SEQUENCE_END}
						markers={SEQUENCE_MARKERS}
					/>
				</Sequence>
				<ServiceCopy>
					<ServiceTitle data-reveal>Next.js, when it has to feel like a product</ServiceTitle>
					<ServiceKicker data-reveal>
						For work that needs to be fast, specific and scalable — I use Next.js and React Three Fiber.
					</ServiceKicker>
					<Columns data-reveal>
						<Column>
							<ColumnTitle>Best for:</ColumnTitle>
							<ColumnList>
								<li>Product showcases</li>
								<li>Campaign sites</li>
								<li>Interactive storytelling</li>
								<li>Interfaces that should not look like a CMS</li>
							</ColumnList>
						</Column>
						<Column>
							<ColumnTitle>What I bring:</ColumnTitle>
							<ColumnList>
								<li>WebGL scenes that stay smooth</li>
								<li>Motion that does not hitch</li>
								<li>3D in the actual product, not a reel</li>
								<li>A build you can still change later</li>
							</ColumnList>
						</Column>
					</Columns>
				</ServiceCopy>
			</Service>

			<Service data-sequence-trigger>
				<Sequence>
					<SequenceScrub
						frames={wpFrames}
						alt="WordPress emblem"
						start={SEQUENCE_START}
						end={SEQUENCE_END}
						markers={SEQUENCE_MARKERS}
					/>
				</Sequence>
				<ServiceCopy>
					<ServiceTitle data-reveal>WordPress that is not a plugin pile</ServiceTitle>
					<ServiceKicker data-reveal>WordPress doesn&apos;t have to be slow or bloated.</ServiceKicker>
					<ServiceBody data-reveal>
						I build custom themes, skip the junk drawer of plugins, and leave you with a clean CMS you can actually edit. Performance and design do not get traded off.
					</ServiceBody>
					<Columns data-reveal>
						<Column>
							<ColumnTitle>Best for:</ColumnTitle>
							<ColumnList>
								<li>Brand sites that will live for years</li>
								<li>Content-heavy platforms</li>
								<li>Campaign landings</li>
								<li>Teams that need a real editor</li>
							</ColumnList>
						</Column>
						<Column>
							<ColumnTitle>What you get:</ColumnTitle>
							<ColumnList>
								<li>A theme built specifically for this project</li>
								<li>A live editing experience that matches the design</li>
								<li>Performance work, not a cache plugin</li>
								<li>A backend that stays clean and easy to maintain</li>
							</ColumnList>
						</Column>
					</Columns>
				</ServiceCopy>
			</Service>

			<QuoteCta onQuote={onQuote} />
		</PopupContentWrapper>
	);
};

ServicesContent.displayName = 'ServicesContent';
export default ServicesContent;
