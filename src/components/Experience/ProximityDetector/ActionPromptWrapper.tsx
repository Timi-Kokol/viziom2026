'use client';

import React, { useEffect, useCallback } from 'react';
import ActionPrompt from '../ActionPrompt';
import { useProximity } from './index';
import { useModal } from '../ModalContext';
import { getSoundManager, SOUND_IDS } from '../../../audio';

const isEditableTarget = (target: EventTarget | null) => {
	if (!(target instanceof HTMLElement)) return false;
	return (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.tagName === 'SELECT' ||
		target.isContentEditable
	);
};

const ActionPromptWrapper = () => {
	const { nearbyCTA } = useProximity();
	const { openModal, activeModal } = useModal();

	const handlePromptClick = useCallback(() => {
		if (nearbyCTA && !activeModal) {
			getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
			window.dispatchEvent(new CustomEvent('experience-modal-opened'));
			openModal(nearbyCTA.modalType);
		}
	}, [nearbyCTA, openModal, activeModal]);

	// Listen for "E" key press to open modal (not while a modal is open or typing in a field)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'e' && e.key !== 'E') return;
			if (activeModal) return;
			if (isEditableTarget(e.target)) return;
			if (!nearbyCTA) return;
			handlePromptClick();
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [nearbyCTA, handlePromptClick, activeModal]);

	return (
		<ActionPrompt
			visible={!!nearbyCTA && !activeModal}
			label={nearbyCTA?.label || ''}
			onClick={handlePromptClick}
		/>
	);
};

ActionPromptWrapper.displayName = 'ActionPromptWrapper';
export default ActionPromptWrapper;
