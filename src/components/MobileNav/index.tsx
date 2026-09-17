'use client';

import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@parts/Contexts';
import { getSoundManager, SOUND_IDS } from '../../audio';
import { useHaptics } from '@/haptics';
import { openCalModal, prerenderCal } from '@/lib/cal';
import { MenuButton, Burger, Panel, Links, LinkBtn, MenuCtaWrap, MenuCta } from './styles';

const PAGES = [
	{ id: 'about', label: 'About' },
	{ id: 'projects', label: 'Projects' },
	{ id: 'services', label: 'Services' },
	{ id: 'contact', label: 'Contact' },
] as const;

type ModalId = (typeof PAGES)[number]['id'];

const openExperienceModal = (modal: ModalId) => {
	window.dispatchEvent(new CustomEvent('experience-modal-opened'));
	window.dispatchEvent(new CustomEvent('experience-open-modal', { detail: { modal } }));
};

export const MobileMenuButton = () => {
	const { menuOpen, setMenuOpen } = useContext(GlobalContext);
	const { triggerPress, triggerHover } = useHaptics();

	return (
		<MenuButton
			data-open={menuOpen}
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={menuOpen}
			aria-controls="mobile-nav-panel"
			onMouseEnter={() => {
				getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
				triggerHover();
			}}
			onClick={() => {
				getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
				triggerPress();
				setMenuOpen(!menuOpen);
			}}
		>
			<Burger data-open={menuOpen} aria-hidden>
				<i />
				<i />
				<i />
			</Burger>
		</MenuButton>
	);
};

const MobileNav = () => {
	const { menuOpen, setMenuOpen } = useContext(GlobalContext);
	const { triggerPress, triggerHover } = useHaptics();
	const [activeModal, setActiveModal] = useState<ModalId | null>(null);

	useEffect(() => {
		const onState = (event: Event) => {
			const modal = (event as CustomEvent).detail?.modal;
			setActiveModal(modal === 'about' || modal === 'projects' || modal === 'services' || modal === 'contact' ? modal : null);
		};
		window.addEventListener('experience-modal-state-changed', onState);
		return () => window.removeEventListener('experience-modal-state-changed', onState);
	}, []);

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.stopImmediatePropagation();
			setMenuOpen(false);
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [menuOpen, setMenuOpen]);

	useEffect(() => {
		if (!menuOpen) return;
		const onResize = () => {
			if (window.innerWidth > 1024) setMenuOpen(false);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [menuOpen, setMenuOpen]);

	useEffect(() => {
		if (!menuOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [menuOpen]);

	const go = (modal: ModalId) => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
		triggerPress();
		setMenuOpen(false);
		if (modal !== activeModal) openExperienceModal(modal);
	};

	return (
		<Panel id="mobile-nav-panel" data-open={menuOpen} data-lenis-prevent>
			<Links>
				{PAGES.map((page) => (
					<LinkBtn
						key={page.id}
						type="button"
						data-active={activeModal === page.id}
						onMouseEnter={() => {
							if (activeModal !== page.id) {
								getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
								triggerHover();
							}
						}}
						onClick={() => go(page.id)}
					>
						{page.label}
					</LinkBtn>
				))}
			</Links>
			<MenuCtaWrap>
			<MenuCta
				type="button"
				onMouseEnter={() => {
					getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
					triggerHover();
					prerenderCal();
				}}
				onClick={() => {
					getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
					triggerPress();
					setMenuOpen(false);
					openCalModal();
				}}
			>
				<span>Schedule a call</span>
				<i aria-hidden />
			</MenuCta>
			</MenuCtaWrap>
		</Panel>
	);
};

MobileNav.displayName = 'MobileNav';
export default MobileNav;
