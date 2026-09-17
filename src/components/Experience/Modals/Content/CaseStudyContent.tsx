'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import { useModal } from '../../ModalContext';
import { PROJECTS, getProjectBySlug, type CaseStudyBlock, type CaseStudyMetaColumn } from '@/content/projects';
import {
	Wrapper,
	Hero,
	HeroImage,
	HeroCopy,
	HeroTitle,
	Body,
	Section,
	IntroText,
	CtaWrap,
	CtaRow,
	FillButton,
	FillButtonEl,
	GrayButton,
	MetaGrid,
	MetaGroup,
	MetaTitle,
	MetaList,
	MetaItem,
	Bullet,
	BodyText,
	TextColumns,
	Media,
	FullMedia,
	VideoWrap,
	PlayButton,
	ImageRow,
} from './CaseStudyContent.styles';
import CaseStudySlider from './CaseStudySlider';

type CaseStudyContentProps = {
	slug: string;
	onQuote?: () => void;
};

const Tick = () => (
	<Bullet aria-hidden="true">
		<i />
		<i />
		<i />
	</Bullet>
);

const PlayMark = () => (
	<svg viewBox="0 0 88 88" fill="none" aria-hidden="true">
		<circle cx="44" cy="44" r="42" stroke="currentColor" strokeWidth="2" />
		<path d="M36 28L62 44L36 60V28Z" fill="currentColor" />
	</svg>
);

const useCtaSound = () => {
	const { triggerHover, triggerPress } = useHaptics();
	return {
		onEnter: () => {
			getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
			triggerHover();
		},
		onPress: () => {
			getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
			triggerPress();
		},
	};
};

const useCaseStudyReveal = (scopeRef: React.RefObject<HTMLElement | null>) => {
	useGSAP(
		() => {
			const root = scopeRef.current;
			if (!root) return;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

			const scroller = root.closest('[data-modal-scroller]') as HTMLElement | null;
			const heroImage = root.querySelector<HTMLElement>('[data-hero-image]');
			const heroTitle = root.querySelector<HTMLElement>('[data-reveal="hero"]');
			const copyItems = gsap.utils
				.toArray<HTMLElement>('[data-reveal]', root)
				.filter((el) => el.getAttribute('data-reveal') !== 'hero');
			const mediaItems = gsap.utils.toArray<HTMLElement>('[data-reveal-media]', root);

			const ctx = gsap.context(() => {
				if (heroImage) {
					gsap.fromTo(
						heroImage,
						{ scale: 1.08, opacity: 0 },
						{ scale: 1, opacity: 1, duration: 1.15, ease: 'power3.out' },
					);
				}

				if (heroTitle) {
					gsap.fromTo(
						heroTitle,
						{ y: 36, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.85, delay: 0.18, ease: 'power3.out' },
					);
				}

				if (copyItems.length && scroller) {
					gsap.set(copyItems, { opacity: 0, y: 32 });
					ScrollTrigger.batch(copyItems, {
						scroller,
						start: 'top 88%',
						once: true,
						onEnter: (batch) => {
							gsap.to(batch, {
								opacity: 1,
								y: 0,
								duration: 0.75,
								stagger: 0.08,
								ease: 'power3.out',
								overwrite: 'auto',
							});
						},
					});
				}

				if (mediaItems.length && scroller) {
					const mediaVisuals = mediaItems.flatMap((el) =>
						gsap.utils.toArray<HTMLElement>('img, video', el),
					);
					gsap.set(mediaItems, { opacity: 0 });
					if (mediaVisuals.length) gsap.set(mediaVisuals, { scale: 1.06, transformOrigin: 'center center' });
					ScrollTrigger.batch(mediaItems, {
						scroller,
						start: 'top 90%',
						once: true,
						onEnter: (batch) => {
							const visuals = batch.flatMap((el) =>
								gsap.utils.toArray<HTMLElement>('img, video', el),
							);
							gsap.to(batch, {
								opacity: 1,
								duration: 0.7,
								stagger: 0.08,
								ease: 'power2.out',
								overwrite: 'auto',
							});
							if (visuals.length) {
								gsap.to(visuals, {
									scale: 1,
									duration: 1,
									stagger: 0.08,
									ease: 'power3.out',
									overwrite: 'auto',
								});
							}
						},
					});
				}
			}, root);

			return () => ctx.revert();
		},
		{ scope: scopeRef },
	);
};

const VideoBlock: React.FC<{
	poster: string;
	src?: string;
	alt?: string;
	autoplay?: boolean;
	aspect?: string;
}> = ({ poster, src, alt, autoplay = false, aspect }) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(autoplay);
	const sound = useCtaSound();

	useEffect(() => {
		if (!autoplay || !src) return;
		const video = videoRef.current;
		const wrap = wrapRef.current;
		if (!video || !wrap) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return undefined;

		const scroller = wrap.closest('[data-modal-scroller]') as HTMLElement | null;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					void video.play().catch(() => undefined);
				} else {
					video.pause();
				}
			},
			{ root: scroller, threshold: 0.35 },
		);
		io.observe(wrap);
		return () => io.disconnect();
	}, [autoplay, src]);

	const play = () => {
		sound.onPress();
		if (!src || !videoRef.current) return;
		setPlaying(true);
		void videoRef.current.play();
	};

	return (
		<VideoWrap ref={wrapRef} data-reveal-media $aspect={aspect} $autoplay={autoplay}>
			<video
				ref={videoRef}
				poster={poster}
				src={src || undefined}
				playsInline
				muted={autoplay}
				loop={autoplay}
				autoPlay={autoplay}
				preload={autoplay ? 'auto' : 'metadata'}
				controls={!autoplay && playing}
				aria-label={alt}
				onEnded={() => {
					if (!autoplay) setPlaying(false);
				}}
			/>
			{!autoplay && !playing && (
				<PlayButton type="button" onMouseEnter={sound.onEnter} onClick={play} aria-label="Play video">
					<PlayMark />
				</PlayButton>
			)}
		</VideoWrap>
	);
};

const MetaBlock: React.FC<{ columns: CaseStudyMetaColumn[] }> = ({ columns }) => {
	const [primary, ...rest] = columns;
	if (!primary) return null;

	const renderGroup = (column: CaseStudyMetaColumn) => (
		<MetaGroup key={column.title}>
			<MetaTitle>{column.title}:</MetaTitle>
			<MetaList>
				{column.items.map((item) => (
					<MetaItem key={item.label}>
						<Tick />
						{item.href ? (
							<a href={item.href} target="_blank" rel="noopener noreferrer">
								{item.label}
							</a>
						) : (
							<span>{item.label}</span>
						)}
					</MetaItem>
				))}
			</MetaList>
		</MetaGroup>
	);

	return (
		<MetaGrid>
			<div>{renderGroup(primary)}</div>
			<div>{rest.map(renderGroup)}</div>
		</MetaGrid>
	);
};

const Block: React.FC<{ block: CaseStudyBlock }> = ({ block }) => {
	const sound = useCtaSound();

	switch (block.type) {
		case 'intro':
			return (
				<Section data-reveal>
					<IntroText>{block.text}</IntroText>
				</Section>
			);
		case 'cta':
			return (
				<Section $compact data-reveal>
					<CtaWrap>
						<FillButton
							href={block.href}
							target="_blank"
							rel="noopener noreferrer"
							onMouseEnter={sound.onEnter}
							onClick={sound.onPress}
						>
							<span>
								<span>{block.label}</span>
							</span>
						</FillButton>
					</CtaWrap>
				</Section>
			);
		case 'meta':
			return (
				<Section data-reveal>
					<MetaBlock columns={block.columns} />
				</Section>
			);
		case 'video':
			return (
				<Section data-media>
					<VideoBlock
						poster={block.poster}
						src={block.src}
						alt={block.alt}
						autoplay={block.autoplay}
						aspect={block.aspect}
					/>
				</Section>
			);
		case 'text':
			if (block.columns === 2) {
				return (
					<Section data-reveal>
						<TextColumns>
							<p>{block.left}</p>
							<p>{block.right}</p>
						</TextColumns>
					</Section>
				);
			}
			return (
				<Section data-reveal>
					<BodyText>{block.text}</BodyText>
				</Section>
			);
		case 'image':
			return (
				<Section data-media>
					<FullMedia data-reveal-media $aspect={block.aspect} $natural={block.fit === 'natural'}>
						<img src={block.src} alt={block.alt} />
					</FullMedia>
				</Section>
			);
		case 'imageRow':
			return (
				<Section data-media>
					<ImageRow $aspect={block.aspect}>
						{block.images.map((image) => (
							<Media key={image.src + image.alt} data-reveal-media>
								<img src={image.src} alt={image.alt} />
							</Media>
						))}
					</ImageRow>
				</Section>
			);
		case 'slider':
			return (
				<Section data-media>
					<CaseStudySlider images={block.images} />
				</Section>
			);
		default:
			return null;
	}
};

const CaseStudyContent: React.FC<CaseStudyContentProps> = ({ slug, onQuote }) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const project = getProjectBySlug(slug);
	const { openCaseStudy } = useModal();
	const sound = useCtaSound();
	useCaseStudyReveal(rootRef);

	if (!project) return null;

	const currentIndex = PROJECTS.findIndex((item) => item.slug === slug);
	const nextProject = PROJECTS[(currentIndex + 1 + PROJECTS.length) % PROJECTS.length];

	return (
		<Wrapper ref={rootRef}>
			<Hero>
				<HeroImage data-hero-image src={project.caseStudy.heroImage} alt={project.title} />
				<HeroCopy>
					<HeroTitle data-reveal="hero">{project.title}</HeroTitle>
				</HeroCopy>
			</Hero>
			<Body>
				{project.caseStudy.blocks.map((block, index) => (
					<Block key={`${block.type}-${index}`} block={block} />
				))}
				<Section data-reveal>
					<CtaRow>
						<FillButtonEl
							type="button"
							onMouseEnter={sound.onEnter}
							onClick={() => {
								sound.onPress();
								onQuote?.();
							}}
						>
							<span>
								<span>Get a quote</span>
							</span>
						</FillButtonEl>
						<GrayButton
							type="button"
							onMouseEnter={sound.onEnter}
							onClick={() => {
								sound.onPress();
								openCaseStudy(nextProject.slug);
							}}
						>
							<span>
								<span>Next case study</span>
							</span>
						</GrayButton>
					</CtaRow>
				</Section>
			</Body>
		</Wrapper>
	);
};

CaseStudyContent.displayName = 'CaseStudyContent';
export default CaseStudyContent;
