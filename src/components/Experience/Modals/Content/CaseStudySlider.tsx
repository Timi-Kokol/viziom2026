'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import type { CaseStudyImage } from '@/content/projects';
import {
	Slider,
	SliderViewport,
	SliderSlide,
	SliderProgress,
	SliderHud,
	SliderDir,
	SliderIndex,
	SliderIndexCurrent,
} from './CaseStudyContent.styles';

const AUTO_MS = 5.4;
const WIPE_DURATION = 0.92;
const DRAG_THRESHOLD = 56;

const pad = (value: number) => String(value).padStart(2, '0');

const clipHidden = (dir: number) => (dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)');
const clipExit = (dir: number) => (dir > 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)');

type CaseStudySliderProps = {
	images: CaseStudyImage[];
};

const CaseStudySlider: React.FC<CaseStudySliderProps> = ({ images }) => {
	const count = images.length;
	const [index, setIndex] = useState(0);
	const indexRef = useRef(0);
	const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
	const currentNumRef = useRef<HTMLElement | null>(null);
	const incomingNumRef = useRef<HTMLElement | null>(null);
	const progressRef = useRef<HTMLElement | null>(null);
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const busyRef = useRef(false);
	const hoverRef = useRef(false);
	const dragRef = useRef({ down: false, x: 0, y: 0, dragging: false });
	const tweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(null);
	const progressTweenRef = useRef<gsap.core.Tween | null>(null);
	const kenRef = useRef<gsap.core.Tween | null>(null);
	const { triggerHover, triggerPress } = useHaptics();

	const reduced =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const press = () => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
		triggerPress();
	};

	const stopMotion = () => {
		tweenRef.current?.kill();
		progressTweenRef.current?.kill();
		kenRef.current?.kill();
		tweenRef.current = null;
		progressTweenRef.current = null;
		kenRef.current = null;
	};

	const kenBurns = useCallback(
		(slideIndex: number) => {
			kenRef.current?.kill();
			if (reduced) return;
			const img = slidesRef.current[slideIndex]?.querySelector('img');
			if (!img) return;
			gsap.set(img, { scale: 1, transformOrigin: 'center center' });
			kenRef.current = gsap.to(img, {
				scale: 1.06,
				duration: AUTO_MS + 1.2,
				ease: 'none',
			});
		},
		[reduced],
	);

	const goRef = useRef<(raw: number, dir: number, silent?: boolean) => void>(() => {});

	const startProgress = useCallback(() => {
		progressTweenRef.current?.kill();
		const bar = progressRef.current;
		if (!bar || count < 2 || reduced) return;
		gsap.set(bar, { scaleX: 0 });
		progressTweenRef.current = gsap.to(bar, {
			scaleX: 1,
			duration: AUTO_MS,
			ease: 'none',
			onComplete: () => goRef.current(indexRef.current + 1, 1, true),
		});
	}, [count, reduced]);

	const flipIndex = (next: number, dir: number) => {
		const incoming = incomingNumRef.current;
		const current = currentNumRef.current;
		if (!incoming || !current) return;
		incoming.textContent = pad(next + 1);
		gsap.set(incoming, { yPercent: 110 * dir, autoAlpha: 1 });
		gsap
			.timeline()
			.to(current, { yPercent: -110 * dir, duration: 0.45, ease: 'power2.in' }, 0)
			.to(incoming, { yPercent: 0, duration: 0.55, ease: 'power3.out' }, 0.12)
			.set(current, { yPercent: 0 })
			.add(() => {
				current.textContent = pad(next + 1);
				gsap.set(incoming, { autoAlpha: 0, yPercent: 0 });
			});
	};

	const go = useCallback(
		(raw: number, dir: number, silent = false) => {
			if (count < 2 || busyRef.current) return;
			const next = ((raw % count) + count) % count;
			const from = indexRef.current;
			if (next === from) return;

			busyRef.current = true;
			if (!silent) press();
			progressTweenRef.current?.kill();
			kenRef.current?.kill();

			const outgoing = slidesRef.current[from];
			const incoming = slidesRef.current[next];
			if (!outgoing || !incoming) {
				busyRef.current = false;
				return;
			}

			flipIndex(next, dir);

			if (reduced) {
				gsap.set(outgoing, { autoAlpha: 0, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
				gsap.set(incoming, { autoAlpha: 1, zIndex: 2, clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
				indexRef.current = next;
				setIndex(next);
				busyRef.current = false;
				kenBurns(next);
				startProgress();
				return;
			}

			const incomingImg = incoming.querySelector('img');
			gsap.set(incoming, {
				autoAlpha: 1,
				zIndex: 3,
				clipPath: clipHidden(dir),
			});
			gsap.set(outgoing, { zIndex: 2 });
			if (incomingImg) gsap.set(incomingImg, { scale: 1.1, transformOrigin: 'center center' });

			tweenRef.current = gsap
				.timeline({
					onComplete: () => {
						gsap.set(outgoing, { autoAlpha: 0, zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
						gsap.set(incoming, { zIndex: 2, clipPath: 'inset(0% 0% 0% 0%)' });
						indexRef.current = next;
						setIndex(next);
						busyRef.current = false;
						kenBurns(next);
						if (!hoverRef.current) startProgress();
					},
				})
				.to(
					incoming,
					{ clipPath: 'inset(0% 0% 0% 0%)', duration: WIPE_DURATION, ease: 'power3.inOut' },
					0,
				)
				.to(
					outgoing,
					{ clipPath: clipExit(dir), duration: WIPE_DURATION, ease: 'power3.inOut' },
					0,
				)
				.to(
					incomingImg,
					{ scale: 1, duration: WIPE_DURATION + 0.15, ease: 'power2.out' },
					0,
				);
		},
		[count, kenBurns, reduced, startProgress],
	);
	goRef.current = go;

	useEffect(() => {
		slidesRef.current.forEach((slide, i) => {
			if (!slide) return;
			gsap.set(slide, {
				autoAlpha: i === 0 ? 1 : 0,
				zIndex: i === 0 ? 2 : 1,
				clipPath: 'inset(0% 0% 0% 0%)',
			});
		});
		kenBurns(0);
		startProgress();
		return () => stopMotion();
	}, [kenBurns, startProgress]);

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0 || count < 2) return;
		dragRef.current = { down: true, x: event.clientX, y: event.clientY, dragging: false };
	};

	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag.down) return;
		const dx = event.clientX - drag.x;
		const dy = event.clientY - drag.y;
		if (!drag.dragging) {
			if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy)) return;
			drag.dragging = true;
			try {
				event.currentTarget.setPointerCapture(event.pointerId);
			} catch {
				/* already captured */
			}
		}
	};

	const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		const dx = event.clientX - drag.x;
		dragRef.current = { down: false, x: 0, y: 0, dragging: false };
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {
			/* already released */
		}
		if (!drag.dragging || Math.abs(dx) < DRAG_THRESHOLD) return;
		go(indexRef.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
	};

	if (!count) return null;

	return (
		<Slider
			data-reveal-media
			ref={wrapRef}
			onMouseEnter={() => {
				hoverRef.current = true;
				progressTweenRef.current?.pause();
			}}
			onMouseLeave={() => {
				hoverRef.current = false;
				progressTweenRef.current?.resume();
			}}
		>
			<SliderViewport
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
			>
				{images.map((image, i) => (
					<SliderSlide
						key={image.src + image.alt}
						ref={(node) => {
							slidesRef.current[i] = node;
						}}
						aria-hidden={i !== index}
					>
						<img src={image.src} alt={image.alt} draggable={false} />
					</SliderSlide>
				))}
				{count > 1 && (
					<>
						<SliderProgress>
							<i ref={progressRef} />
						</SliderProgress>
						<SliderHud>
							<SliderDir
								type="button"
								$side="prev"
								aria-label="Previous image"
								onMouseEnter={() => {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}}
								onClick={() => go(indexRef.current - 1, -1)}
								onPointerDown={(event) => event.stopPropagation()}
							>
								<span>Prev</span>
							</SliderDir>
							<SliderIndex>
								<SliderIndexCurrent>
									<em ref={currentNumRef}>{pad(index + 1)}</em>
									<em ref={incomingNumRef} />
								</SliderIndexCurrent>
								<span>/ {pad(count)}</span>
							</SliderIndex>
							<SliderDir
								type="button"
								$side="next"
								aria-label="Next image"
								onMouseEnter={() => {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}}
								onClick={() => go(indexRef.current + 1, 1)}
								onPointerDown={(event) => event.stopPropagation()}
							>
								<span>Next</span>
							</SliderDir>
						</SliderHud>
					</>
				)}
			</SliderViewport>
		</Slider>
	);
};

CaseStudySlider.displayName = 'CaseStudySlider';
export default CaseStudySlider;
