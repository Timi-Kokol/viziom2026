'use client';

import React, { useEffect } from 'react';
import { useProximity } from './index';
import { getSoundManager, SOUND_IDS } from '../../../audio';

/**
 * Plays the pulse sound on loop while CTA or lasers emission glow is active (near a CTA or near lasers).
 */
export default function PulseSoundController() {
	const { nearbyCTA, nearLasers } = useProximity();
	const glowActive = !!(nearbyCTA || nearLasers);

	useEffect(() => {
		const mgr = getSoundManager();
		if (!mgr) return;
		if (glowActive) {
			mgr.play(SOUND_IDS.PULSE, { loop: true });
		} else {
			mgr.stop(SOUND_IDS.PULSE);
		}
		return () => mgr.stop(SOUND_IDS.PULSE);
	}, [glowActive]);

	return null;
}
