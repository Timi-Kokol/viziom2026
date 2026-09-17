"use client";

// Imports
// ------------
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useGameplayPaused } from "../GameplayPausedContext";
import { SobelEffect } from "./SobelEffect";
import { ScanlinesEffect } from "./ScanlinesEffect";

// Bloom settings per scene (tweak minigame to taste)
const BLOOM_ENABLED = false;
const BLOOM_MAIN = { luminanceThreshold: 0.5, luminanceSmoothing: 0.5, intensity: 1.3 };
const BLOOM_MINIGAME = { luminanceThreshold: 0.1, luminanceSmoothing: 0.6, intensity: 2 };
const MINIGAME_FX_TRIGGER_SPEED = 17;

// Sobel + Scanlines: ramp in only at max speed
const SOBEL_RAMP_DURATION_SEC = 1;
const SOBEL_TARGET = 0.5;

// Component
// ------------
const PostProcessing = React.memo(function PostProcessing({ currentScene = "main", minigameSpeed = 0, reduceQuality = false }) {
	const bloom = currentScene === "minigame" ? BLOOM_MINIGAME : BLOOM_MAIN;
	const sobelIntensityRef = useRef(0);
	const sobelRampStartRef = useRef(null);
	const scanlinesIntensityRef = useRef(0);
	const scanlinesRampStartRef = useRef(null);

	const isMinigame = currentScene === "minigame";
	const gameplayPaused = useGameplayPaused();
	useFrame((state) => {
		if (gameplayPaused || reduceQuality) return;

		// Sobel + Scanlines: ramp in once speed hits trigger threshold.
		const atMaxSpeed = isMinigame && minigameSpeed >= MINIGAME_FX_TRIGGER_SPEED;
		if (atMaxSpeed) {
			const now = state.clock.elapsedTime;
			if (sobelRampStartRef.current == null) sobelRampStartRef.current = now;
			if (scanlinesRampStartRef.current == null) scanlinesRampStartRef.current = now;
			const elapsedSobel = now - sobelRampStartRef.current;
			const elapsedScan = now - scanlinesRampStartRef.current;
			const tSobel = Math.min(1, elapsedSobel / SOBEL_RAMP_DURATION_SEC);
			const tScan = Math.min(1, elapsedScan / SOBEL_RAMP_DURATION_SEC);
			sobelIntensityRef.current = tSobel * SOBEL_TARGET;
			scanlinesIntensityRef.current = tScan * 1.0;
		} else {
			sobelRampStartRef.current = null;
			scanlinesRampStartRef.current = null;
			sobelIntensityRef.current = 0;
			scanlinesIntensityRef.current = 0;
		}
	});

	// Keep EffectComposer mounted on mobile. Unmounting it leaves the renderer
	// drawing a low-res un-tonemapped buffer (pixelated + crushed reds).
	// Skip only the heavy minigame FX; bloom is the look of the scene.
	return (
		<EffectComposer depthBuffer multisampling={0} resolutionScale={0.75}>
			{BLOOM_ENABLED && (
				<Bloom
					luminanceThreshold={bloom.luminanceThreshold}
					luminanceSmoothing={bloom.luminanceSmoothing}
					intensity={bloom.intensity}
					mipmapBlur
				/>
			)}
			{!reduceQuality && isMinigame && <SobelEffect intensityRef={sobelIntensityRef} />}
			{!reduceQuality && isMinigame && <ScanlinesEffect intensityRef={scanlinesIntensityRef} />}
		</EffectComposer>
	);
});

// Exports
// ------------
PostProcessing.displayName = "PostProcessing";
export default PostProcessing;
