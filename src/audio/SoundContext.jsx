"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { getSoundManager } from "./SoundManager";
import { SOUND_IDS } from "./soundConfig";

const SoundContext = createContext(null);

/**
 * Provides a single SoundManager to the tree.
 * Mount once near the app root (e.g. inside Experience).
 * When soundEnabled is false (e.g. user chose "Enter without sound"), play is a no-op and music does not start.
 */
export function SoundProvider({ children, preloadOnFirstInteraction = true, soundEnabled = true }) {
	const managerRef = useRef(null);
	const preloadedRef = useRef(false);
	const musicStartedRef = useRef(false);
	const restartMusicRef = useRef(false);

	if (typeof window !== "undefined" && !managerRef.current) {
		managerRef.current = getSoundManager();
	}

	const manager = managerRef.current;

	useEffect(() => {
		if (!manager) return;

		// When sound is re-enabled after being off, restart music immediately
		// This is critical for mobile where the toggle click is the user gesture
		if (soundEnabled && musicStartedRef.current && manager.resumed) {
			manager.play(SOUND_IDS.MUSIC, { loop: true });
		}

		manager.whenResumed(() => {
			if (!soundEnabled) return;
			if (!preloadedRef.current && preloadOnFirstInteraction) {
				preloadedRef.current = true;
				manager.preload();
			}
			// Start background music (first time)
			if (!musicStartedRef.current) {
				musicStartedRef.current = true;
				manager.play(SOUND_IDS.MUSIC, { loop: true });
			}
		});
	}, [manager, preloadOnFirstInteraction, soundEnabled]);

	const api = useMemo(
		() => ({
			play: (id, options) => {
				if (soundEnabled && manager) manager.play(id, options);
			},
			preload: (ids) => manager?.preload(ids),
			whenResumed: (fn) => manager?.whenResumed(fn),
		}),
		[manager, soundEnabled]
	);

	return (
		<SoundContext.Provider value={api}>
			{children}
		</SoundContext.Provider>
	);
}

/**
 * Use in any component to play sounds. Requires SoundProvider above.
 * Example: const { play } = useSound(); play(SOUND_IDS.JUMP);
 */
export function useSound() {
	const ctx = useContext(SoundContext);
	if (!ctx) {
		// Allow use outside provider (no-op) so components don’t break
		return {
			play: () => {},
			preload: () => {},
			whenResumed: () => {},
		};
	}
	return ctx;
}

export { SOUND_IDS };
