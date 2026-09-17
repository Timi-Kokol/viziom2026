"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRobotGroupRef } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";

/**
 * Invisible: reads robot world position each frame and calls onRobotPosition.
 * The actual overlay is rendered as a fixed 2D element outside Canvas (in Experience).
 */
export default function DebugCoords({ onRobotPosition }) {
	const pos = useRef(new THREE.Vector3());
	const lastSentAtMs = useRef(0);

	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		if (!onRobotPosition) return;
		// This is purely debug UI; updating React state at 60fps can tank performance.
		// Throttle to ~10Hz, and only run in development.
		if (typeof process !== "undefined" && process.env?.NODE_ENV !== "development") return;
		const now = typeof performance !== "undefined" ? performance.now() : Date.now();
		if (now - lastSentAtMs.current < 100) return;
		lastSentAtMs.current = now;
		const robotGroupRef = getRobotGroupRef();
		if (robotGroupRef?.current) {
			robotGroupRef.current.updateMatrixWorld(true);
			robotGroupRef.current.getWorldPosition(pos.current);
			onRobotPosition(pos.current.x, pos.current.y, pos.current.z);
		}
	});

	return null;
}
