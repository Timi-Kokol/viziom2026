'use client';

import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { useModal } from '../../ModalContext';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import { useIsMobile } from '@/utils/useResponsive';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AboutContent from '../Content/AboutContent';
import ProjectsContent from '../Content/ProjectsContent';
import CaseStudyContent from '../Content/CaseStudyContent';
import ServicesContent from '../Content/ServicesContent';
import ContactContent from '../Content/ContactContent';
import NoiseRevealOverlay from './NoiseRevealOverlay';
import SidebarRobotHead from './SidebarRobotHead';
import { getCalLink, initCal, openCalModal, prerenderCal, subscribeCalModalOpen } from '@/lib/cal';
import { Overlay, CloseButton, ContentArea, ModalSidebar, Logo, NavLinks, NavLink, SidebarCTA, CTAButton, RobotSidebar, PopupContent, PopupContentInner, ScrollBar, BottomContent } from './styles';

type ContentModal = 'about' | 'projects' | 'services' | 'contact' | null;
const MODAL_SHELL_MS = 1000;
const MODAL_CLOSE_UNMOUNT_DELAY_MS = 1150;
const MODAL_UI_DELAY_MS = 520;
const CONTENT_OPEN_DELAY_MS = 520;
const CONTENT_OPEN_MS = 900;
const CONTENT_IN_MS = 640;
const CONTENT_OUT_MS = 560;
const NOISE_OPEN_MS = 800;
const NOISE_SOFTNESS = 0.075;
const NOISE_SCALE = 50;
const NOISE_PIXELATION = 0.95;
const NOISE_COLOR = [0, 0, 0];
const MODAL_KEY_SCROLL_SPEED_PX_PER_SEC = 500; // hold speed option
const MODAL_KEY_SCROLL_EASE_IN_PX_PER_SEC2 = 4000; // acceleration option
const MODAL_KEY_SCROLL_EASE_OUT_PX_PER_SEC2 = 1000; // deceleration option

const UnifiedModal: React.FC = () => {
	const { activeModal, activeCaseStudy, openModal, closeModal } = useModal();
	const { triggerPress, triggerHover } = useHaptics();
	const isCompact = useIsMobile();
	const [calModalOpen, setCalModalOpen] = useState(false);
	const [renderedModal, setRenderedModal] = useState<ContentModal>(null);
	const [renderedCaseStudy, setRenderedCaseStudy] = useState<string | null>(null);
	const [visible, setVisible] = useState(false);
	const [contentTransitionPhase, setContentTransitionPhase] = useState<'idle' | 'open' | 'out' | 'in'>('idle');
	const openTimerRef = useRef<number | null>(null);
	const closeTimerRef = useRef<number | null>(null);
	const pendingModalRef = useRef<ContentModal>(null);
	const contentPhaseRef = useRef<'idle' | 'open' | 'out' | 'in'>('idle');
	const visibleRef = useRef(false);
	const renderedModalRef = useRef<ContentModal>(null);
	const renderedCaseStudyRef = useRef<string | null>(null);
	const pendingCaseStudyRef = useRef<string | null>(null);
	const popupContentRef = useRef<HTMLDivElement | null>(null);
	const popupContentInnerRef = useRef<HTMLDivElement | null>(null);
	const popupLenisRef = useRef<Lenis | null>(null);
	const scrollBarRef = useRef<HTMLDivElement | null>(null);
	const keyHoldRafRef = useRef<number | null>(null);
	const keyHoldLastTimeRef = useRef<number | null>(null);
	const keyUpHeldRef = useRef(false);
	const keyDownHeldRef = useRef(false);
	const keyScrollTargetRef = useRef(0);
	const keyScrollVelocityRef = useRef(0);
	const [noiseTransitionTrigger, setNoiseTransitionTrigger] = useState(0);
	const [noiseDurationMs, setNoiseDurationMs] = useState(NOISE_OPEN_MS);
	const [noiseDelayMs, setNoiseDelayMs] = useState(0);
	const [noiseCover, setNoiseCover] = useState(false);
	const [noiseColor, setNoiseColor] = useState(NOISE_COLOR);
	const [hideContentUntilOpen, setHideContentUntilOpen] = useState(false);
	const [swapHold, setSwapHold] = useState(false);
	const swapFallbackRef = useRef<number | null>(null);
	const commitPageSwapRef = useRef(() => {});

	const commitPageSwap = () => {
		if (swapFallbackRef.current) {
			window.clearTimeout(swapFallbackRef.current);
			swapFallbackRef.current = null;
		}
		if (contentPhaseRef.current !== 'out') return;
		const next = pendingModalRef.current;
		const nextCase = pendingCaseStudyRef.current;
		const modalChanged = Boolean(next && next !== renderedModalRef.current);
		const caseChanged = nextCase !== renderedCaseStudyRef.current;
		if (modalChanged || caseChanged) {
			setSwapHold(true);
			if (next) setRenderedModal(next);
			setRenderedCaseStudy(nextCase);
			setContentTransitionPhase('in');
			return;
		}
		setContentTransitionPhase('idle');
	};
	commitPageSwapRef.current = commitPageSwap;

	const resetModalScroll = () => {
		const lenis = popupLenisRef.current;
		const wrapper = popupContentRef.current;
		if (lenis) {
			lenis.scrollTo(0, { immediate: true, force: true, lock: true });
		}
		if (wrapper) wrapper.scrollTop = 0;
		if (scrollBarRef.current) {
			scrollBarRef.current.style.setProperty('--scroll-thumb-height', '50px');
		}
	};

	const lockModalScroll = () => {
		popupLenisRef.current?.stop();
	};

	const unlockModalScroll = () => {
		popupLenisRef.current?.start();
	};

	useEffect(() => {
		renderedModalRef.current = renderedModal;
	}, [renderedModal]);
	useEffect(() => {
		renderedCaseStudyRef.current = renderedCaseStudy;
	}, [renderedCaseStudy]);
	useEffect(() => {
		visibleRef.current = visible;
	}, [visible]);
	useEffect(() => {
		if (visible) initCal();
	}, [visible]);
	useEffect(() => subscribeCalModalOpen(setCalModalOpen), []);
	useEffect(() => {
		contentPhaseRef.current = contentTransitionPhase;
	}, [contentTransitionPhase]);
	useEffect(() => {
		if (contentTransitionPhase === 'open') {
			unlockModalScroll();
			setNoiseCover(false);
			setNoiseColor(NOISE_COLOR);
			setNoiseDelayMs(CONTENT_OPEN_DELAY_MS);
			setNoiseDurationMs(NOISE_OPEN_MS);
			setNoiseTransitionTrigger((current) => current + 1);
			window.requestAnimationFrame(() => ScrollTrigger.refresh());
			return;
		}
		if (contentTransitionPhase === 'out') {
			lockModalScroll();
			setNoiseCover(true);
			setNoiseColor(NOISE_COLOR);
			setNoiseDelayMs(0);
			setNoiseDurationMs(CONTENT_OUT_MS);
			setNoiseTransitionTrigger((current) => current + 1);
			if (swapFallbackRef.current) window.clearTimeout(swapFallbackRef.current);
			swapFallbackRef.current = window.setTimeout(() => {
				swapFallbackRef.current = null;
				commitPageSwapRef.current();
			}, CONTENT_OUT_MS + 90);
			return;
		}
		if (contentTransitionPhase === 'in') {
			lockModalScroll();
			setNoiseCover(false);
			setNoiseColor(NOISE_COLOR);
			setNoiseDelayMs(0);
			setNoiseDurationMs(CONTENT_IN_MS);
			setNoiseTransitionTrigger((current) => current + 1);
			resetModalScroll();
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					setSwapHold(false);
					popupLenisRef.current?.resize();
					ScrollTrigger.refresh();
				});
			});
			return;
		}
		if (contentTransitionPhase === 'idle') {
			unlockModalScroll();
		}
	}, [contentTransitionPhase]);

	useEffect(() => {
		if (openTimerRef.current) {
			window.clearTimeout(openTimerRef.current);
			openTimerRef.current = null;
		}
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}

		if (activeModal) {
			// Re-open must also recover when user opens again during close animation.
			const nextCase = activeModal === 'projects' ? activeCaseStudy : null;
			const isOpeningFromClosed = !renderedModalRef.current || !visibleRef.current;
			if (isOpeningFromClosed) {
				pendingModalRef.current = null;
				pendingCaseStudyRef.current = nextCase;
				setRenderedModal(activeModal);
				setRenderedCaseStudy(nextCase);
				setVisible(false);
				setHideContentUntilOpen(true);
				setContentTransitionPhase('idle');
				openTimerRef.current = window.setTimeout(() => {
					setContentTransitionPhase('open');
					setVisible(true);
				}, 20);
			} else if (
				activeModal !== renderedModalRef.current ||
				nextCase !== renderedCaseStudyRef.current
			) {
				pendingModalRef.current = activeModal;
				pendingCaseStudyRef.current = nextCase;
				if (contentPhaseRef.current === 'out') return;
				setContentTransitionPhase('out');
			}
			return;
		}

		if (renderedModalRef.current) {
			setVisible(false);
			setHideContentUntilOpen(false);
			setSwapHold(false);
			setContentTransitionPhase('idle');
			pendingModalRef.current = null;
			pendingCaseStudyRef.current = null;
			if (swapFallbackRef.current) {
				window.clearTimeout(swapFallbackRef.current);
				swapFallbackRef.current = null;
			}
			closeTimerRef.current = window.setTimeout(() => {
				setRenderedModal(null);
				setRenderedCaseStudy(null);
			}, MODAL_CLOSE_UNMOUNT_DELAY_MS);
		}
	}, [activeModal, activeCaseStudy]);

	useEffect(() => {
		return () => {
			if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
			if (swapFallbackRef.current) window.clearTimeout(swapFallbackRef.current);
		};
	}, []);

	useEffect(() => {
		const wrapper = popupContentRef.current;
		const content = popupContentInnerRef.current;
		if (!visible || !wrapper || !content) return;

		const lenis = new Lenis({
			wrapper,
			content,
			lerp: 0.1,
			smoothWheel: true,
			gestureOrientation: 'vertical',
			syncTouch: true,
			touchMultiplier: 1,
		});

		popupLenisRef.current = lenis;
		lenis.scrollTo(0, { immediate: true });
		if (scrollBarRef.current) {
			scrollBarRef.current.style.setProperty('--scroll-thumb-height', '50px');
		}

		ScrollTrigger.scrollerProxy(wrapper, {
			scrollTop(value) {
				if (typeof value === 'number') {
					lenis.scrollTo(value, { immediate: true, force: true, lock: true });
				}
				// Report the position Lenis actually applied, so refresh-time
				// measurements can't read a value that lands a frame later.
				return lenis.actualScroll ?? wrapper.scrollTop;
			},
			getBoundingClientRect() {
				return wrapper.getBoundingClientRect();
			},
			pinType: 'transform',
		});

		lenis.on('scroll', ({ scroll, limit }) => {
			ScrollTrigger.update();
			const progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
			if (scrollBarRef.current) {
				const trackHeight = scrollBarRef.current.clientHeight || 0;
				const minHeight = 50;
				const thumbHeight = minHeight + progress * Math.max(0, trackHeight - minHeight);
				scrollBarRef.current.style.setProperty('--scroll-thumb-height', `${thumbHeight}px`);
			}
		});

		// Running Lenis on the gsap ticker keeps scroll updates and ScrollTrigger
		// renders in the same frame; a standalone rAF leaves them a frame apart,
		// which reads as a hitch whenever the scroll direction flips.
		const onTick = (time: number) => lenis.raf(time * 1000);

		gsap.ticker.add(onTick);
		gsap.ticker.lagSmoothing(0);
		ScrollTrigger.refresh();

		return () => {
			gsap.ticker.remove(onTick);
			ScrollTrigger.getAll().forEach((st) => {
				if (st.vars.scroller === wrapper) st.kill();
			});
			lenis.destroy();
			popupLenisRef.current = null;
		};
	}, [visible]);

	useEffect(() => {
		if (!renderedModal || !visible) return;

		const ensureKeyScrollTarget = (lenis: Lenis) => {
			if (typeof lenis.scroll === 'number') {
				keyScrollTargetRef.current = lenis.scroll;
			}
		};

		const approach = (value: number, target: number, maxDelta: number) => {
			const diff = target - value;
			if (Math.abs(diff) <= maxDelta) return target;
			return value + Math.sign(diff) * maxDelta;
		};

		const stopHoldLoop = () => {
			if (keyHoldRafRef.current) {
				window.cancelAnimationFrame(keyHoldRafRef.current);
				keyHoldRafRef.current = null;
			}
			keyHoldLastTimeRef.current = null;
		};

		const startHoldLoop = () => {
			if (keyHoldRafRef.current) return;

			const tick = (time: number) => {
				const lenis = popupLenisRef.current;
				if (!lenis) {
					stopHoldLoop();
					return;
				}

				const direction = (keyDownHeldRef.current ? 1 : 0) + (keyUpHeldRef.current ? -1 : 0);
				const last = keyHoldLastTimeRef.current ?? time;
				const deltaSec = Math.min(0.05, Math.max(0, (time - last) / 1000));
				keyHoldLastTimeRef.current = time;
				const desiredVelocity = direction * MODAL_KEY_SCROLL_SPEED_PX_PER_SEC;
				const easingRate =
					direction === 0 ? MODAL_KEY_SCROLL_EASE_OUT_PX_PER_SEC2 : MODAL_KEY_SCROLL_EASE_IN_PX_PER_SEC2;
				keyScrollVelocityRef.current = approach(
					keyScrollVelocityRef.current,
					desiredVelocity,
					easingRate * deltaSec
				);
				keyScrollTargetRef.current += keyScrollVelocityRef.current * deltaSec;

				lenis.scrollTo(keyScrollTargetRef.current, { immediate: true, force: true });

				if (direction === 0 && Math.abs(keyScrollVelocityRef.current) < 1) {
					keyScrollVelocityRef.current = 0;
					stopHoldLoop();
					return;
				}

				keyHoldRafRef.current = window.requestAnimationFrame(tick);
			};

			keyHoldRafRef.current = window.requestAnimationFrame(tick);
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.tagName === 'SELECT' ||
					target.isContentEditable)
			) {
				return;
			}

			const lenis = popupLenisRef.current;
			if (!lenis) return;

			event.preventDefault();
			if (event.key === 'ArrowDown') keyDownHeldRef.current = true;
			if (event.key === 'ArrowUp') keyUpHeldRef.current = true;
			ensureKeyScrollTarget(lenis);
			startHoldLoop();
		};

		const onKeyUp = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
			if (event.key === 'ArrowDown') keyDownHeldRef.current = false;
			if (event.key === 'ArrowUp') keyUpHeldRef.current = false;
			// Keep loop alive until ease-out reaches zero velocity.
			startHoldLoop();
		};

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			keyDownHeldRef.current = false;
			keyUpHeldRef.current = false;
			keyScrollVelocityRef.current = 0;
			stopHoldLoop();
		};
	}, [renderedModal, visible]);

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
			triggerPress();
			closeModal();
		}
	};

	const handleContentAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
		if (e.target !== e.currentTarget) return;
		const phase = contentPhaseRef.current;

		if (phase === 'out') {
			return;
		}

		if (phase === 'in' || phase === 'open') {
			if (phase === 'open') {
				setHideContentUntilOpen(false);
			}
			setContentTransitionPhase('idle');
		}
	};

	const handleNavSwitch = (modal: Exclude<ContentModal, null>) => {
		const leavingCaseStudy =
			modal === 'projects' &&
			renderedModal === 'projects' &&
			Boolean(activeCaseStudy || renderedCaseStudy);
		if (modal === renderedModal && !leavingCaseStudy) return;
		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
		triggerPress();
		openModal(modal);
	};

	const contentModalKey = renderedCaseStudy ? 'casestudy' : renderedModal;

	const renderContent = () => {
		switch (renderedModal) {
			case 'about':
				return <AboutContent onQuote={() => openModal('contact')} />;
			case 'projects':
				return renderedCaseStudy ? (
					<CaseStudyContent slug={renderedCaseStudy} onQuote={() => openModal('contact')} />
				) : (
					<ProjectsContent onQuote={() => openModal('contact')} />
				);
			case 'services':
				return <ServicesContent onQuote={() => openModal('contact')} />;
			case 'contact':
				return <ContactContent />;
			default:
				return null;
		}
	};

	if (!renderedModal) return null;

	const navActiveModal = activeModal ?? renderedModal;
	const calLink = getCalLink();
	const calHref = calLink ? `https://cal.com/${calLink}` : undefined;

	return (
		<Overlay
			onClick={handleOverlayClick}
			data-open={visible}
			style={
				{
					'--modal-shell-ms': MODAL_SHELL_MS,
					'--modal-ui-delay-ms': MODAL_UI_DELAY_MS,
					'--content-open-delay-ms': CONTENT_OPEN_DELAY_MS,
					'--content-open-ms': CONTENT_OPEN_MS,
					'--content-in-ms': CONTENT_IN_MS,
					'--content-out-ms': CONTENT_OUT_MS,
				} as React.CSSProperties
			}
		>
			<ModalSidebar data-open={visible}>
				<Logo data-open={visible}>
					<img src="/logo.svg" alt="Logo" />
				</Logo>
				<BottomContent>
					<NavLinks data-open={visible}>
						<NavLink
							type="button"
							data-active={navActiveModal === 'about'}
							onMouseEnter={() => {
								if (navActiveModal !== 'about') {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}
							}}
							onClick={() => handleNavSwitch('about')}
						>
							About
						</NavLink>
						<NavLink
							type="button"
							data-active={navActiveModal === 'projects'}
							onMouseEnter={() => {
								if (navActiveModal !== 'projects') {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}
							}}
							onClick={() => handleNavSwitch('projects')}
						>
							Projects
						</NavLink>
						<NavLink
							type="button"
							data-active={navActiveModal === 'services'}
							onMouseEnter={() => {
								if (navActiveModal !== 'services') {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}
							}}
							onClick={() => handleNavSwitch('services')}
						>
							Services
						</NavLink>
						<NavLink
							type="button"
							data-active={navActiveModal === 'contact'}
							onMouseEnter={() => {
								if (navActiveModal !== 'contact') {
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
									triggerHover();
								}
							}}
							onClick={() => handleNavSwitch('contact')}
						>
							Contact
						</NavLink>
					</NavLinks>
					<SidebarCTA data-open={visible}>
						<CTAButton
							href={calHref}
							target={calHref ? '_blank' : undefined}
							rel={calHref ? 'noopener noreferrer' : undefined}
							onMouseEnter={() => {
								getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
								triggerHover();
								prerenderCal();
							}}
							onClick={(e) => {
								e.preventDefault();
								getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
								triggerPress();
								openCalModal();
							}}
						>
							<span>Schedule a call</span>
							<i aria-hidden />
						</CTAButton>
					</SidebarCTA>
					{/* Hidden by CSS under 1024px; skip mounting so phones don't pay
					    for a second WebGL context that is never seen. */}
					{!isCompact && (
						<RobotSidebar data-open={visible}>
							<SidebarRobotHead active={visible} />
						</RobotSidebar>
					)}
				</BottomContent>
			</ModalSidebar>

			<ContentArea data-open={visible} data-modal={contentModalKey}>
			<CloseButton
				data-open={visible}
				data-hidden={calModalOpen}
				aria-label="Close"
				aria-hidden={calModalOpen}
				tabIndex={calModalOpen ? -1 : 0}
				onMouseEnter={() => {
					getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
					triggerHover();
				}}
				onClick={() => {
					getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
					triggerPress();
					closeModal();
				}}
			>
				<i />
				<i />
				<i />
				<i />
				<i />
			</CloseButton>
			<ScrollBar ref={scrollBarRef} data-open={visible}><div></div></ScrollBar>
			<NoiseRevealOverlay
				trigger={noiseTransitionTrigger}
				durationMs={noiseDurationMs}
				delayMs={noiseDelayMs}
				softness={NOISE_SOFTNESS}
				scale={NOISE_SCALE}
				pixelation={NOISE_PIXELATION}
				transparentToFull={noiseCover}
				color={noiseColor}
				onComplete={() => {
					if (contentPhaseRef.current === 'out') commitPageSwapRef.current();
				}}
			/>
			<PopupContent
				ref={popupContentRef}
				data-lenis-prevent
				data-modal-scroller
				data-open={visible}
			>
				<PopupContentInner
					ref={popupContentInnerRef}
					data-open={visible}
					data-prereveal={hideContentUntilOpen}
					data-hold={swapHold}
					data-modal={contentModalKey}
					data-transition={contentTransitionPhase}
					onAnimationEnd={handleContentAnimationEnd}
				>
					{renderContent()}
				</PopupContentInner>
			</PopupContent>
			</ContentArea>
		</Overlay>
	);
};

UnifiedModal.displayName = 'UnifiedModal';
export default UnifiedModal;
