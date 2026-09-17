'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getSoundManager, SOUND_IDS } from '../../../audio';
import { useHaptics } from '@/haptics';

type ModalType = 'about' | 'projects' | 'services' | 'contact' | null;

interface ModalContextType {
	activeModal: ModalType;
	activeCaseStudy: string | null;
	openModal: (modal: ModalType) => void;
	openCaseStudy: (slug: string) => void;
	closeCaseStudy: () => void;
	closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
	const [activeModal, setActiveModal] = useState<ModalType>(null);
	const [activeCaseStudy, setActiveCaseStudy] = useState<string | null>(null);
	const { triggerPress } = useHaptics();

	const openModal = useCallback((modal: ModalType) => {
		setActiveModal(modal);
		setActiveCaseStudy(null);
	}, []);

	const openCaseStudy = useCallback((slug: string) => {
		setActiveModal('projects');
		setActiveCaseStudy(slug);
	}, []);

	const closeCaseStudy = useCallback(() => {
		setActiveCaseStudy(null);
	}, []);

	const closeModal = useCallback(() => {
		setActiveModal(null);
		setActiveCaseStudy(null);
	}, []);

	useEffect(() => {
		const onClose = () => closeModal();
		window.addEventListener('experience-close-modal', onClose);
		return () => window.removeEventListener('experience-close-modal', onClose);
	}, [closeModal]);

	// Close modal on Escape when one is open
	useEffect(() => {
		if (!activeModal) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
				triggerPress();
				closeModal();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [activeModal, triggerPress, closeModal]);

	useEffect(() => {
		const onOpen = (event: Event) => {
			const modal = (event as CustomEvent).detail?.modal;
			if (modal === 'about' || modal === 'projects' || modal === 'services' || modal === 'contact') {
				openModal(modal);
			}
		};
		window.addEventListener('experience-open-modal', onOpen);
		return () => window.removeEventListener('experience-open-modal', onOpen);
	}, [openModal]);

	// Broadcast modal open/close state so gameplay systems can pause globally.
	useEffect(() => {
		window.dispatchEvent(
			new CustomEvent('experience-modal-state-changed', {
				detail: { open: Boolean(activeModal), modal: activeModal },
			})
		);
	}, [activeModal]);

	const value = useMemo(
		() => ({
			activeModal,
			activeCaseStudy,
			openModal,
			openCaseStudy,
			closeCaseStudy,
			closeModal,
		}),
		[activeModal, activeCaseStudy, openModal, openCaseStudy, closeCaseStudy, closeModal]
	);
	return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
	const context = useContext(ModalContext);
	if (context === undefined) {
		throw new Error('useModal must be used within a ModalProvider');
	}
	return context;
};
