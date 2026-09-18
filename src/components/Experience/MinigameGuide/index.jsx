"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { TrailSprite } from "../Sprites";
import { useGameplayPaused } from "../GameplayPausedContext";

/** Animation playback speed. 1 = normal, 0.5 = half speed, etc. */
const ANIMATION_SPEED = 0.5;

/** Fade-in duration (seconds) when guide first appears. */
const FADE_IN_DURATION = 0.6;

/** Frame mesh alpha animation (GLB has no baked material animation). Tweak to match your Blender intent. */
const FRAME_ALPHA = {
	enabled: true,
	min: 0.1,
	max: 1,
	speed: 0.9, // cycles per second – full 0→1→0 over ~5 seconds
};

/** Emission intensity per mesh. Can exceed 1 for brighter glow (e.g. with bloom). */
const EMISSION = {
	"arrow-curve": 150,
	"frame": 10,
	"curve-bulge": 30,
};

/**
 * Minigame guide GLB – placed in main scene for visualization.
 * Always mounted and playing; visibility controlled via opacity (no mount/unmount flash).
 */
const MinigameGuide = ({ position = [0, 0, 0], scale = [1, 1, 1], visible = false }) => {
	const { scene, animations } = useGLTF("/models/minigame-guide.glb");
	const clonedScene = useMemo(() => (scene ? scene.clone(true) : null), [scene]);
	const { actions, mixer } = useAnimations(animations || [], clonedScene);
	const frameMeshRef = useRef(null);
	const curveBulgeRef = useRef(null);
	const animationProgressRef = useRef(0);
	const fadeInRef = useRef(0);
	const prevVisibleRef = useRef(visible);

	// Play all baked animations on loop
	useEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		Object.values(actions).forEach((action) => {
			if (action) {
				action.reset();
				action.setLoop(THREE.LoopRepeat, Infinity);
				action.clampWhenFinished = false;
				action.fadeIn(0.3).play();
			}
		});
		return () => {
			Object.values(actions).forEach((action) => {
				if (action) action.stop();
			});
		};
	}, [actions]);

	const gameplayPaused = useGameplayPaused();
	const pulseTimeRef = useRef(0);
	useFrame((_, delta) => {
		if (gameplayPaused) return;
		// Modal sets Canvas frameloop to "never"; the first resume frame can be several
		// seconds long and would skip the ~10s guide clip (line + orb vanish until it loops).
		const dt = Math.min(Math.max(delta, 0), 1 / 20);
		if (!visible) {
			prevVisibleRef.current = false;
			fadeInRef.current = 0;
			return;
		}
		if (!prevVisibleRef.current) {
			fadeInRef.current = 0;
		}
		prevVisibleRef.current = true;
		fadeInRef.current = Math.min(1, fadeInRef.current + dt / FADE_IN_DURATION);
		const visibilityMultiplier = fadeInRef.current;
		pulseTimeRef.current += dt;

		if (mixer) {
			mixer.timeScale = ANIMATION_SPEED;
			mixer.update(dt);
			const action = Object.values(actions || {})[0];
			if (action?.getClip?.()) {
				const clip = action.getClip();
				const duration = clip.duration;
				animationProgressRef.current = duration > 0 ? (action.time % duration) / duration : 0;
			}
		}
		// Frame mesh alpha animation (GLB has no baked material opacity)
		let frameOpacity = 1;
		if (FRAME_ALPHA.enabled && frameMeshRef.current) {
			const t = (Math.sin(pulseTimeRef.current * FRAME_ALPHA.speed * Math.PI * 2) + 1) / 2;
			frameOpacity = THREE.MathUtils.lerp(FRAME_ALPHA.min, FRAME_ALPHA.max, t);
			const mats = Array.isArray(frameMeshRef.current.material)
				? frameMeshRef.current.material
				: [frameMeshRef.current.material];
			mats.forEach((mat) => {
				if (mat) {
					mat.transparent = true;
					mat.alphaTest = 0;
					mat.opacity = frameOpacity * visibilityMultiplier;
				}
			});
		}
		// Apply fade-in to all other meshes (arrow curve, curve-bulge)
		if (clonedScene) {
			clonedScene.traverse((child) => {
				if (child.isMesh && child !== frameMeshRef.current) {
					const mats = Array.isArray(child.material) ? child.material : [child.material];
					mats.forEach((mat) => {
						if (mat && "opacity" in mat) {
							mat.transparent = true;
							mat.opacity = visibilityMultiplier;
						}
					});
				}
			});
		}
	});

	useEffect(() => {
		if (!clonedScene) return;
		clonedScene.userData.isDecoration = true;
		clonedScene.traverse((child) => {
			if (child.isMesh) {
				child.userData.isDecoration = true;
				// Start invisible; useFrame will control opacity
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				mats.forEach((mat) => {
					if (mat && "opacity" in mat) {
						mat.transparent = true;
						mat.opacity = 0;
					}
				});
				if (child.name === "curve-bulge") {
					curveBulgeRef.current = child;
					// Clone material so curve-bulge has its own (arrow curve shares same material in GLB)
					const mats = Array.isArray(child.material) ? child.material : [child.material];
					child.material = mats.length > 1 ? mats.map((m) => m?.clone()) : mats[0]?.clone();
				}
				if (child.name === "frame") {
					frameMeshRef.current = child;
					const mats = Array.isArray(child.material) ? child.material : [child.material];
					mats.forEach((mat) => {
						if (mat) {
							mat.transparent = true;
							mat.depthWrite = false;
							mat.alphaTest = 0; // Disable MASK cutoff so opacity blends gradually (not binary)
						}
					});
				}
				const intensity = EMISSION[child.name];
				if (intensity != null) {
					const mats = Array.isArray(child.material) ? child.material : [child.material];
					mats.forEach((mat) => {
						if (mat && "emissive" in mat) {
							if (!mat.emissive.getHex()) mat.emissive.setHex(0xffffff);
							mat.emissiveIntensity = intensity;
						}
					});
				}
			}
		});
	}, [clonedScene]);

	if (!clonedScene) return null;
	return (
		<>
			<primitive object={clonedScene} position={position} scale={scale} />
			<TrailSprite
				followMeshRef={curveBulgeRef}
				animationProgressRef={animationProgressRef}
				visibilityRef={fadeInRef}
				size={0.3}
				fps={12}
			/>
		</>
	);
};

MinigameGuide.displayName = "MinigameGuide";
export default MinigameGuide;
