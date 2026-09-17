'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import {
	ActiveMeta,
	MetaLink,
	TitleStack,
	ProjectName,
	MetaRow,
	ProjectRule,
	IndexStack,
	ProjectIndex,
	MoreButton,
} from './ProjectsContent.styles';

type Project = {
	id: string;
	slug?: string;
	title: string;
	url?: string;
};

type ProjectMetaProps = {
	project: Project;
	direction: number;
	hovered?: boolean;
	onOpen?: () => void;
};

const charsOf = (split: SplitType | null) => [...(split?.chars ?? [])] as HTMLElement[];

const splitChars = (el: HTMLElement, text: string) => {
	el.textContent = text;
	return new SplitType(el, { types: 'chars', tagName: 'span' });
};

const layerHasChars = (split: SplitType | null) =>
	Boolean(split?.chars?.some((node) => (node as HTMLElement).offsetHeight > 0));

const ProjectMeta: React.FC<ProjectMetaProps> = ({ project, direction, hovered, onOpen }) => {
	const nameRefs = [useRef<HTMLHeadingElement>(null), useRef<HTMLHeadingElement>(null)];
	const indexRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
	const ruleRef = useRef<HTMLSpanElement>(null);
	const moreRef = useRef<HTMLSpanElement>(null);
	const splitNameRef = useRef<[SplitType | null, SplitType | null]>([null, null]);
	const splitIndexRef = useRef<[SplitType | null, SplitType | null]>([null, null]);
	const frontRef = useRef(0);
	const tweenRef = useRef<gsap.core.Timeline | null>(null);
	const shownRef = useRef<Project | null>(null);
	const pendingRef = useRef(project);
	const directionRef = useRef(direction);
	const busyRef = useRef(false);

	const { triggerPress } = useHaptics();

	pendingRef.current = project;
	directionRef.current = direction;

	useLayoutEffect(() => {
		const revertLayer = (layer: number) => {
			splitNameRef.current[layer]?.revert();
			splitIndexRef.current[layer]?.revert();
			splitNameRef.current[layer] = null;
			splitIndexRef.current[layer] = null;
		};

		const prepareLayer = (layer: number, next: Project, yPercent: number, visible: boolean) => {
			const nameEl = nameRefs[layer].current;
			const indexEl = indexRefs[layer].current;
			if (!nameEl || !indexEl) {
				return { nameChars: [] as HTMLElement[], indexChars: [] as HTMLElement[] };
			}

			revertLayer(layer);
			splitNameRef.current[layer] = splitChars(nameEl, next.title);
			splitIndexRef.current[layer] = splitChars(indexEl, next.id);

			const nameChars = charsOf(splitNameRef.current[layer]);
			const indexChars = charsOf(splitIndexRef.current[layer]);
			gsap.set(nameChars, { yPercent, force3D: true });
			gsap.set(indexChars, { yPercent, force3D: true });
			gsap.set(nameEl, { autoAlpha: visible ? 1 : 0 });
			gsap.set(indexEl, { autoAlpha: visible ? 1 : 0 });
			return { nameChars, indexChars };
		};

		const run = () => {
			const next = pendingRef.current;
			const dir = directionRef.current || 1;
			const front = frontRef.current;
			const back = 1 - front;

			if (shownRef.current?.id === next.id) {
				busyRef.current = false;
				return;
			}

			busyRef.current = true;
			tweenRef.current?.kill();
			tweenRef.current = null;

			if (shownRef.current === null) {
				shownRef.current = next;
				prepareLayer(front, next, 0, true);
				gsap.set(nameRefs[back].current, { autoAlpha: 0 });
				gsap.set(indexRefs[back].current, { autoAlpha: 0 });
				gsap.set(ruleRef.current, { scaleX: 1, transformOrigin: 'left center' });
				gsap.set(moreRef.current, { y: 0, opacity: 1 });
				busyRef.current = false;
				return;
			}

			const shown = shownRef.current;
			const outReady = layerHasChars(splitNameRef.current[front]);
			const outgoing = outReady
				? {
						nameChars: charsOf(splitNameRef.current[front]),
						indexChars: charsOf(splitIndexRef.current[front]),
					}
				: prepareLayer(front, shown, 0, true);
			const incoming = prepareLayer(back, next, 115 * dir, false);

			gsap.set(ruleRef.current, { transformOrigin: dir > 0 ? 'left center' : 'right center' });

			const tl = gsap.timeline({
				onComplete: () => {
					shownRef.current = next;
					frontRef.current = back;
					gsap.set(nameRefs[front].current, { autoAlpha: 0 });
					gsap.set(indexRefs[front].current, { autoAlpha: 0 });
					revertLayer(front);
					busyRef.current = false;
					if (pendingRef.current.id !== shownRef.current.id) run();
				},
			});

			if (outgoing.nameChars.length) {
				tl.to(outgoing.nameChars, { yPercent: -115 * dir, duration: 0.28, stagger: 0.016, ease: 'power2.in' }, 0);
			} else {
				tl.set(nameRefs[front].current, { autoAlpha: 0 }, 0);
			}
			if (outgoing.indexChars.length) {
				tl.to(outgoing.indexChars, { yPercent: -115 * dir, duration: 0.22, stagger: 0.02, ease: 'power2.in' }, 0);
			} else {
				tl.set(indexRefs[front].current, { autoAlpha: 0 }, 0);
			}

			tl.to(ruleRef.current, { scaleX: 0, duration: 0.2, ease: 'power2.in' }, 0)
				.to(moreRef.current, { y: -8 * dir, opacity: 0, duration: 0.16, ease: 'power2.in' }, 0)
				.set(nameRefs[front].current, { autoAlpha: 0 })
				.set(indexRefs[front].current, { autoAlpha: 0 })
				.set(nameRefs[back].current, { autoAlpha: 1 })
				.set(indexRefs[back].current, { autoAlpha: 1 });

			if (incoming.nameChars.length) {
				tl.to(incoming.nameChars, { yPercent: 0, duration: 0.5, stagger: 0.022, ease: 'power3.out' }, '>');
			} else {
				tl.set(nameRefs[back].current, { autoAlpha: 1 }, '>');
			}
			if (incoming.indexChars.length) {
				tl.to(incoming.indexChars, { yPercent: 0, duration: 0.38, stagger: 0.024, ease: 'power3.out' }, '<0.04');
			}
			tl.to(ruleRef.current, { scaleX: 1, duration: 0.4, ease: 'power3.out' }, '<0.06').to(
				moreRef.current,
				{ y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' },
				'<0.08',
			);

			tweenRef.current = tl;
		};

		if (!busyRef.current) run();
	}, [project.id]);

	useLayoutEffect(() => {
		return () => {
			tweenRef.current?.kill();
			tweenRef.current = null;
			splitNameRef.current.forEach((split) => split?.revert());
			splitIndexRef.current.forEach((split) => split?.revert());
			splitNameRef.current = [null, null];
			splitIndexRef.current = [null, null];
			shownRef.current = null;
			busyRef.current = false;
			frontRef.current = 0;
		};
	}, []);

	return (
		<ActiveMeta>
			<MetaLink
				data-project-meta
				data-hover={hovered ? 'true' : undefined}
				type="button"
				aria-label={`Open ${project.title} case study`}
				onClick={() => {
					getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
					triggerPress();
					onOpen?.();
				}}
			>
				<TitleStack>
					<ProjectName ref={nameRefs[0]} />
					<ProjectName ref={nameRefs[1]} />
				</TitleStack>
				<MetaRow>
					<IndexStack>
						<ProjectIndex ref={indexRefs[0]} />
						<ProjectIndex ref={indexRefs[1]} />
					</IndexStack>
					<ProjectRule ref={ruleRef} />
					<MoreButton ref={moreRef} as="span">
						<span>More</span>
					</MoreButton>
				</MetaRow>
			</MetaLink>
		</ActiveMeta>
	);
};

ProjectMeta.displayName = 'ProjectMeta';
export default ProjectMeta;
