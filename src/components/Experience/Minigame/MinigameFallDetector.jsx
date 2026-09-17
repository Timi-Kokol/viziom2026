"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { getRobotIsFrozen } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";

// After restart, don't report "fallen" for this long so spawn/settle doesn't trigger the popup
const POST_RESTART_GRACE_MS = 1600;

/**
 * When in minigame, reports whether the robot has fallen so the parent can show the fall menu.
 * Requires: (1) been on ground at least once since entry/restart, (2) not in post-restart grace period.
 */
export default function MinigameFallDetector({ onFallStatus, minigameRestartCounter = 0 }) {
	const lastReported = useRef(false);
	const hasBeenOnGroundSinceEntry = useRef(false);
	const restartGraceEndRef = useRef(0);

	// On Restart: reset state and start grace period
	useEffect(() => {
		hasBeenOnGroundSinceEntry.current = false;
		lastReported.current = false;
		restartGraceEndRef.current = (typeof performance !== "undefined" ? performance.now() : Date.now()) + POST_RESTART_GRACE_MS;
	}, [minigameRestartCounter]);

	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		if (!onFallStatus) return;
		const now = typeof performance !== "undefined" ? performance.now() : Date.now();
		const inGracePeriod = now < restartGraceEndRef.current;
		const isFrozen = getRobotIsFrozen();
		if (!isFrozen) hasBeenOnGroundSinceEntry.current = true;
		// Don't report fallen during grace period (spawn/settle) or until they've been on ground once
		const reportFallen = !inGracePeriod && isFrozen && hasBeenOnGroundSinceEntry.current;
		if (lastReported.current !== reportFallen) {
			lastReported.current = reportFallen;
			onFallStatus(reportFallen);
		}
	});
	return null;
}
