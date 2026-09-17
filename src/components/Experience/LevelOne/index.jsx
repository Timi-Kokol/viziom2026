"use client";

import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { getDoorOpen } from "../doorState";
import { useGameplayPaused } from "../GameplayPausedContext";
import {
	SCREEN_SETUPS,
	acquireScreenVideo,
	applyVideoToScreenMesh,
	findScreenMesh,
	releaseScreenVideo,
	restoreScreenMesh,
} from "./tvScreen";

let levelOneGLBScene = null;

export const getLevelOneGLBScene = () => levelOneGLBScene;

const LevelOne = ({ position }) => {
	const { scene } = useGLTF("/models/ground_compressed.glb");
	const logoSpinRef = useRef(null);
	const lasersRef = useRef(null);
	const screensRef = useRef([]);
	const tvFrameRef = useRef(0);

	useEffect(() => {
		if (!scene) return;
		levelOneGLBScene = scene;
		return () => {
			if (levelOneGLBScene === scene) levelOneGLBScene = null;
		};
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		scene.userData.isDecoration = true;

		const logoSpin = scene.getObjectByName("logo-spin");
		if (logoSpin) logoSpinRef.current = logoSpin;

		scene.traverse((child) => {
			if (child.isMesh && child.name?.toLowerCase() === "lasers") {
				lasersRef.current = child;
				const materials = Array.isArray(child.material)
					? child.material
					: [child.material];
				const uniqueMaterials = materials.filter(Boolean).map((material) => material.clone());
				uniqueMaterials.forEach((material) => {
					material.transparent = true;
				});
				child.material = Array.isArray(child.material) ? uniqueMaterials : uniqueMaterials[0];
			}
		});

		scene.traverse((child) => {
			if (!child.isMesh) return;
			child.userData.isDecoration = true;
		});

		const attached = [];
		SCREEN_SETUPS.forEach((setup) => {
			const mesh = findScreenMesh(scene, setup.material);
			if (!mesh) return;
			const screen = acquireScreenVideo(setup.id, setup.src);
			attached.push({
				id: setup.id,
				mesh,
				video: screen.video,
				draw: screen.draw,
				material: applyVideoToScreenMesh(mesh, screen.texture, setup.material),
			});
		});
		screensRef.current = attached;

		return () => {
			attached.forEach((item) => {
				restoreScreenMesh(item.mesh, item.material);
				releaseScreenVideo(item.id);
			});
			screensRef.current = [];
		};
	}, [scene]);

	const gameplayPaused = useGameplayPaused();
	useEffect(() => {
		if (!gameplayPaused) return;
		screensRef.current.forEach((item) => {
			if (!item.video.paused) item.video.pause();
		});
	}, [gameplayPaused]);
	useFrame((state, delta) => {
		const screens = screensRef.current;
		if (gameplayPaused) {
			screens.forEach((item) => {
				if (!item.video.paused) item.video.pause();
			});
			tvFrameRef.current = 0;
		} else if (screens.length) {
			tvFrameRef.current += 1;
			if (tvFrameRef.current === 1 || tvFrameRef.current % 30 === 0) {
				screens.forEach((item) => {
					if (item.video.paused && item.video.readyState >= 2) {
						item.video.play().catch(() => {});
					}
				});
			}
			if (tvFrameRef.current % 4 === 0) {
				screens.forEach((item) => item.draw());
			}
		}

		if (gameplayPaused) return;
		if (logoSpinRef.current) {
			logoSpinRef.current.rotation.z += delta * 1;
		}

		if (lasersRef.current) {
			const doorOpen = getDoorOpen();
			const targetOpacity = doorOpen ? 0 : 1;
			const lerpFactor = 1 - Math.exp(-6 * delta);
			const materials = Array.isArray(lasersRef.current.material)
				? lasersRef.current.material
				: lasersRef.current.material
					? [lasersRef.current.material]
					: [];
			materials.forEach((material) => {
				if (material && typeof material.opacity === "number") {
					material.transparent = true;
					material.opacity = material.opacity + (targetOpacity - material.opacity) * lerpFactor;
				}
			});
		}
	});

	if (!scene) return null;
	return <primitive object={scene} position={position} />;
};

LevelOne.displayName = "LevelOne";
export default LevelOne;
