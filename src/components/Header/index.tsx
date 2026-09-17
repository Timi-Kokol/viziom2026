'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { GlobalContext, useIntro } from '@parts/Contexts';
import { getSoundManager, SOUND_IDS } from '../../audio';
import { useHaptics } from '@/haptics';
import { MobileMenuButton } from '@parts/MobileNav';
import { Jacket, Logo, Brand, HeaderClose, Slogan, CTA, Line } from './styles';

const openExperienceModal = (modal: 'services' | 'contact') => {
	window.dispatchEvent(new CustomEvent('experience-modal-opened'));
	window.dispatchEvent(new CustomEvent('experience-open-modal', { detail: { modal } }));
};

type SplitHoverCopyProps = {
	title: string;
	kicker: string;
	hovered: boolean;
};

const SplitHoverCopy: React.FC<SplitHoverCopyProps> = ({ title, kicker, hovered }) => {
	const titleOut = useRef<HTMLSpanElement>(null);
	const titleIn = useRef<HTMLSpanElement>(null);
	const splitsRef = useRef<SplitType[]>([]);
	const tweenRef = useRef<gsap.core.Timeline | null>(null);
	const playedRef = useRef(false);

	useEffect(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const nodes = [titleOut.current, titleIn.current];
		if (reduced || nodes.some((node) => !node)) return;

		const splits = nodes.map((el) => new SplitType(el as HTMLElement, { types: 'chars', tagName: 'span' }));
		splitsRef.current = splits;
		gsap.set(splits[1]?.chars ?? [], { yPercent: 110 });

		return () => {
			tweenRef.current?.kill();
			splits.forEach((split) => split.revert());
			splitsRef.current = [];
		};
	}, [title]);

	useEffect(() => {
		const [titleOutSplit, titleInSplit] = splitsRef.current;
		if (!titleOutSplit || !titleInSplit) return;
		if (!hovered && !playedRef.current) return;
		playedRef.current = true;

		tweenRef.current?.kill();
		const from = hovered ? 'start' : 'end';
		tweenRef.current = gsap
			.timeline({ defaults: { ease: 'power3.inOut' } })
			.to(
				titleOutSplit.chars ?? [],
				{ yPercent: hovered ? -110 : 0, duration: 0.46, stagger: { each: 0.014, from } },
				0,
			)
			.to(
				titleInSplit.chars ?? [],
				{ yPercent: hovered ? 0 : 110, duration: 0.46, stagger: { each: 0.014, from } },
				0,
			);
	}, [hovered]);

	return (
		<>
			<h2>
				<Line>
					<span ref={titleOut}>{title}</span>
					<span ref={titleIn} aria-hidden="true">
						{title}
					</span>
				</Line>
			</h2>
			<h3>{kicker}</h3>
		</>
	);
};

const Header = () => {
	const { introComplete } = useIntro();
	const { menuOpen, setMenuOpen } = useContext(GlobalContext);
	const { triggerPress, triggerHover } = useHaptics();
	const [sloganHot, setSloganHot] = useState(false);
	const [ctaHot, setCtaHot] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		const onState = (event: Event) => {
			setModalOpen(Boolean((event as CustomEvent).detail?.open));
		};
		window.addEventListener('experience-modal-state-changed', onState);
		return () => window.removeEventListener('experience-modal-state-changed', onState);
	}, []);

	const handleOpen = (modal: 'services' | 'contact') => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
		triggerPress();
		openExperienceModal(modal);
	};

	const hoverIn = (setHot: (value: boolean) => void) => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
		triggerHover();
		setHot(true);
	};

	return (
		<Jacket $visible={introComplete} $modalOpen={modalOpen} $menuOpen={menuOpen}>
			<Slogan
				type="button"
				aria-label="Open services"
				onMouseEnter={() => hoverIn(setSloganHot)}
				onMouseLeave={() => setSloganHot(false)}
				onClick={() => handleOpen('services')}
			>
				<SplitHoverCopy
					title="Custom Web Experiences"
					kicker="Designed. Developed. Optimized."
					hovered={sloganHot}
				/>
			</Slogan>
			<Brand>
				<Logo src="/logo.svg" alt="Viziom" />
				<HeaderClose
					type="button"
					data-visible={modalOpen}
					aria-label="Back"
					aria-hidden={!modalOpen}
					tabIndex={modalOpen ? 0 : -1}
					onMouseEnter={() => {
						if (!modalOpen) return;
						getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
						triggerHover();
					}}
					onClick={() => {
						if (!modalOpen) return;
						getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
						triggerPress();
						setMenuOpen(false);
						window.dispatchEvent(new CustomEvent('experience-close-modal'));
					}}
				>
					Back
				</HeaderClose>
			</Brand>
			<CTA
				type="button"
				aria-label="Open contact"
				onMouseEnter={() => hoverIn(setCtaHot)}
				onMouseLeave={() => setCtaHot(false)}
				onClick={() => handleOpen('contact')}
			>
				<SplitHoverCopy title="Get in Touch" kicker="I work globally." hovered={ctaHot} />
			</CTA>
			{introComplete && (
				<MobileMenuButton />
			)}
		</Jacket>
	);
};

Header.displayName = 'Header';
export default Header;
