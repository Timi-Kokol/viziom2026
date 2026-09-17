"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

const MINIGAME_GLB = "/models/minigame_compressed.glb";

/**
 * Mounted when we're about to transition to minigame. Loads minigame.glb
 * so the track is in cache before we switch. When ready, calls onReady().
 */
export default function MinigameReadyWaiter({ onReady }) {
	const { scene } = useGLTF(MINIGAME_GLB);

	useEffect(() => {
		if (scene && onReady) onReady();
	}, [scene, onReady]);

	return null;
}
