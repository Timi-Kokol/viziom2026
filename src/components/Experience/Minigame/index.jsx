"use client";

import React, { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useGameplayPaused } from "../GameplayPausedContext";

const Minigame = ({ position = [0, 0, 0], scale = [1, 1, 1] }) => {
	const { scene, animations } = useGLTF("/models/minigame_compressed.glb");
	// Clone and center: GLBs often have geometry offset from origin; center so position=[0,0,0] = model center
	const clonedScene = useMemo(() => {
		if (!scene) return null;
		const cloned = scene.clone(true);
		const box = new THREE.Box3().setFromObject(cloned);
		const center = box.getCenter(new THREE.Vector3());
		cloned.position.x = -center.x;
		cloned.position.y = -center.y;
		cloned.position.z = -center.z;
		return cloned;
	}, [scene]);

	const { actions, mixer } = useAnimations(animations || [], clonedScene);

	// Play all GLB animations automatically
	useEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		Object.values(actions).forEach((action) => {
			if (action) action.reset().fadeIn(0.3).play();
		});
		return () => {
			Object.values(actions).forEach((action) => {
				if (action) action.fadeOut(0.2);
			});
		};
	}, [actions]);

	const gameplayPaused = useGameplayPaused();
	useFrame((_, delta) => {
		if (gameplayPaused) return;
		if (mixer) mixer.update(delta);
	});

	// Do NOT set isDecoration so RobotController raycast uses these meshes for ground/wall collision
	useEffect(() => {
		if (!clonedScene) return;
		clonedScene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// Leave userData.isDecoration unset so the GLB is used for collisions (raycast)
			}
		});
	}, [clonedScene]);

	if (!clonedScene) return null;
	return <primitive object={clonedScene} position={position} scale={scale} />;
};

Minigame.displayName = "Minigame";

export default Minigame;
