'use client';

import React, { useRef } from 'react';
import { useHaptics } from '@/haptics';
import { Wrapper } from './styles';

/**
 * Fixed bottom-right sound toggle. Visible in main and minigame.
 * Temporary box; replace with icon/label as needed.
 */
export default function SoundToggle({ soundEnabled, onToggle }) {
	const touchHandledRef = useRef(false);
	const { triggerPress } = useHaptics();
	const modeLabel = soundEnabled ? 'Sound: on' : 'Sound: off';
	
	const handleClick = () => {
		// Skip if touch already handled this interaction
		if (touchHandledRef.current) {
			touchHandledRef.current = false;
			return;
		}
		triggerPress();
		onToggle();
	};
	
	const handleTouchEnd = (e) => {
		// iOS: ensure touch events trigger toggle for audio unlock
		e.preventDefault();
		touchHandledRef.current = true;
		triggerPress();
		onToggle();
	};
	
	return (
		<Wrapper
			$enabled={soundEnabled}
			onClick={handleClick}
			onTouchEnd={handleTouchEnd}
			onKeyDown={(e) => {
				// Prevent Space from activating the button so Space can be used for jump in minigame
				if (e.key === ' ') e.preventDefault();
			}}
			aria-label={modeLabel}
			title={modeLabel}
		>
		<div className="switch">
			<div className="equalizer">
				<div className="equalizer__bar"></div>
				<div className="equalizer__bar"></div>
				<div className="equalizer__bar"></div>
				<div className="equalizer__bar"></div>
			</div>
		</div>
		</Wrapper>
	);
}
