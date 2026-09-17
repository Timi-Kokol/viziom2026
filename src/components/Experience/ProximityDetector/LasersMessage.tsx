'use client';

import React from 'react';
import { useProximity } from './index';
import GlobalMessage, { GLOBAL_MESSAGE_BOTTOM_LASERS } from '../GlobalMessage';

interface LasersMessageProps {
	/** When true (door unlocked by drone), the message is hidden */
	doorOpen?: boolean;
	/** When false, message is always hidden (e.g. not in main scene) */
	enabled?: boolean;
}

export default function LasersMessage({ doorOpen = false, enabled = true }: LasersMessageProps) {
	const { nearLasers } = useProximity();
	const show = enabled && nearLasers && !doorOpen;
	return (
		<GlobalMessage visible={show} bottom={GLOBAL_MESSAGE_BOTTOM_LASERS}>
			Lasers deactivated, drop through a trap door to activate minigame
		</GlobalMessage>
	);
}
