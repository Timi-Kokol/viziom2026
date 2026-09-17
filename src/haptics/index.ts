'use client';

/**
 * Haptic feedback layer using web-haptics (https://haptics.lochie.me/).
 * Usage:
 *   import { useHaptics } from '@/haptics';
 *   const { triggerPress, triggerHover, trigger } = useHaptics();
 *   <button onClick={() => { triggerPress(); doSomething(); }}>Click</button>
 *   <button onMouseEnter={triggerHover}>Hover</button>
 *   trigger([{ duration: 30 }, { delay: 60, duration: 40 }]); // custom
 */

import { useCallback } from 'react';
import { useWebHaptics } from 'web-haptics/react';

export type HapticVibration = { duration: number; intensity?: number; delay?: number };

/** Preset patterns – tune these for your feel */
export const HAPTIC_PRESETS = {
	/** Button click / tap */
	press: [{ duration: 30 }] as HapticVibration[],
	/** Button hover – lighter */
	hover: [{ duration: 15, intensity: 0.6 }] as HapticVibration[],
	/** Slightly stronger – e.g. confirm / submit */
	confirm: [
		{ duration: 25 },
		{ delay: 50, duration: 35, intensity: 1 },
	] as HapticVibration[],
	/** Error / invalid */
	error: [
		{ duration: 40 },
		{ delay: 80, duration: 40 },
	] as HapticVibration[],
	/** Buzz – crash / impact (from haptics.lochie.me) */
	buzz: [
		{ duration: 50 },
		{ delay: 40, duration: 60, intensity: 1 },
		{ delay: 50, duration: 50 },
	] as HapticVibration[],
} as const;

export function useHaptics() {
	const { trigger: rawTrigger, isSupported } = useWebHaptics({
		debug: false,
	});

	const trigger = useCallback(
		(input?: HapticVibration[] | HapticVibration, options?: { intensity?: number }) => {
			if (!isSupported) return;
			const pattern = Array.isArray(input) ? input : input ? [input] : HAPTIC_PRESETS.press;
			rawTrigger(pattern, options);
		},
		[rawTrigger, isSupported]
	);

	const triggerPress = useCallback(() => {
		if (!isSupported) return;
		rawTrigger(HAPTIC_PRESETS.press);
	}, [rawTrigger, isSupported]);

	const triggerHover = useCallback(() => {
		if (!isSupported) return;
		rawTrigger(HAPTIC_PRESETS.hover);
	}, [rawTrigger, isSupported]);

	const triggerConfirm = useCallback(() => {
		if (!isSupported) return;
		rawTrigger(HAPTIC_PRESETS.confirm);
	}, [rawTrigger, isSupported]);

	const triggerError = useCallback(() => {
		if (!isSupported) return;
		rawTrigger(HAPTIC_PRESETS.error);
	}, [rawTrigger, isSupported]);

	const triggerBuzz = useCallback(() => {
		if (!isSupported) return;
		rawTrigger(HAPTIC_PRESETS.buzz);
	}, [rawTrigger, isSupported]);

	return {
		trigger,
		triggerPress,
		triggerHover,
		triggerConfirm,
		triggerError,
		triggerBuzz,
		isSupported,
		HAPTIC_PRESETS,
	};
}
