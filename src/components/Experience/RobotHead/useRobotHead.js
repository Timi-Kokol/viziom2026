'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const ROBOT_HEAD_GLB = '/models/robot-head.glb';

const DEFAULT_REPLAY_MS = 5000;

/**
 * Loads the robot head, re-pivots it around its "headcontrol" empty so rotation
 * happens at the neck instead of the model origin, and drives its single clip as
 * a one-shot that repeats on a delay.
 *
 * Returns the cloned object (mount it yourself), the mixer (advance it in your
 * own useFrame) and a replay callback for poking the head on demand.
 */
export function useRobotHead({ replayDelayMs = DEFAULT_REPLAY_MS } = {}) {
	const { scene, animations } = useGLTF(ROBOT_HEAD_GLB);

	const object = useMemo(() => {
		if (!scene) return null;
		const cloned = scene.clone();
		cloned.traverse((child) => {
			if (!child.isMesh) return;
			child.castShadow = false;
			child.receiveShadow = false;
			// Slight emissive so bloom has something to glow
			if (child.material) {
				const mats = Array.isArray(child.material) ? child.material : [child.material];
				mats.forEach((mat) => {
					if (!mat) return;
					if (!mat.emissive) mat.emissive = new THREE.Color(0x444466);
					if (mat.emissiveIntensity === undefined) mat.emissiveIntensity = 0.12;
				});
			}
		});

		cloned.updateMatrixWorld(true);
		const headControl = cloned.getObjectByName('headcontrol');
		if (headControl) {
			const pivot = new THREE.Vector3();
			headControl.getWorldPosition(pivot);
			cloned.position.set(-pivot.x, -pivot.y, -pivot.z);
		} else {
			// Fallback: pivot from bottom of model
			const box = new THREE.Box3().setFromObject(cloned);
			cloned.position.y = -box.min.y;
		}
		return cloned;
	}, [scene]);

	/**
	 * Measured here, detached and before the mixer runs, so it never depends on
	 * whether the renderer has flushed world matrices yet.
	 */
	const bounds = useMemo(() => {
		if (!object) return null;
		return new THREE.Box3().setFromObject(object);
	}, [object]);

	const { actions, mixer } = useAnimations(animations || [], object);
	const actionRef = useRef(null);

	useEffect(() => {
		if (!mixer || !object) return undefined;
		const names = Object.keys(actions);
		const main = names.length ? actions[names[0]] : null;
		actionRef.current = main;
		if (!main) return undefined;

		main.setLoop(THREE.LoopOnce, 1);
		main.clampWhenFinished = true;
		main.play();

		let pauseTimeout = null;
		const onFinished = () => {
			pauseTimeout = setTimeout(() => {
				main.reset().play();
			}, replayDelayMs);
		};
		mixer.addEventListener('finished', onFinished);

		return () => {
			mixer.removeEventListener('finished', onFinished);
			if (pauseTimeout) clearTimeout(pauseTimeout);
		};
	}, [mixer, actions, object, replayDelayMs]);

	const replay = useCallback(() => {
		actionRef.current?.reset().play();
	}, []);

	return { object, bounds, mixer, replay };
}

useGLTF.preload(ROBOT_HEAD_GLB);
