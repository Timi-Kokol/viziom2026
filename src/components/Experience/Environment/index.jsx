"use client";

// Imports
// ------------
import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// Minigame fog: only applied when currentScene === "minigame". Tune near/far to taste.
const MINIGAME_FOG_COLOR = 0x000;
const MINIGAME_FOG_NEAR = 0;
const MINIGAME_FOG_FAR = 40;

// Component
// ------------
const Environment = ({ currentScene = "main" }) => {
	const { scene } = useThree();

	useEffect(() => {
		if (currentScene === "minigame") {
			scene.fog = new THREE.Fog(MINIGAME_FOG_COLOR, MINIGAME_FOG_NEAR, MINIGAME_FOG_FAR);
			return () => {
				scene.fog = null;
			};
		}
		scene.fog = null;
	}, [currentScene, scene]);

	return (
		<>
			{/* Base black; AnimatedBackground (main only) adds particles when mounted */}
			<color attach="background" args={["#000"]} />
		</>
	);
};

// Exports
// ------------
Environment.displayName = "Environment";
export default Environment;
