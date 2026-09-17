"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getRobotGroupRef, getRobotIsFrozen } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";
import { boxOverlapsMeshGeometry } from "../../../utils/minigameCollision";

// Robot hit box size for obstacle overlap (tune if needed)
const ROBOT_HIT_HALF_X = 0.25;
const ROBOT_HIT_HALF_Y = 0.35;
const ROBOT_HIT_HALF_Z = 0.25;

// After restart, ignore overlaps for this long so we don't re-trigger popup when robot is still at spawn
const POST_RESTART_GRACE_MS = 1400;

/**
 * When in minigame and countdown is done, checks each frame if the robot overlaps any mesh
 * whose name contains "collision". If so, calls onObstacleHit() once (shows fall popup).
 * Grace period after restart so spawn overlap doesn't reopen the popup.
 */
export default function MinigameObstacleDetector({
	onObstacleHitFeedback,
	minigameCountdownPhase = null,
	minigameRestartCounter = 0,
}) {
	const { scene } = useThree();
	const collisionMeshesRef = useRef([]);
	const rebuildTickRef = useRef(0);
	const hasTriggeredRef = useRef(false);
	const restartGraceEndRef = useRef(0);
	const robotBoxRef = useRef(new THREE.Box3());
	const meshBoxRef = useRef(new THREE.Box3());
	const robotPosRef = useRef(new THREE.Vector3());
	const robotSizeRef = useRef(new THREE.Vector3(ROBOT_HIT_HALF_X * 2, ROBOT_HIT_HALF_Y * 2, ROBOT_HIT_HALF_Z * 2));

	function rebuildCollisionMeshes() {
		const meshes = [];
		scene.updateMatrixWorld(true);
		scene.traverse((child) => {
			if (child.isMesh && child.name && child.name.toLowerCase().includes("collision")) {
				meshes.push(child);
			}
		});
		collisionMeshesRef.current = meshes;
	}

	// Rebuild list when we're in minigame (effect runs on mount/restart)
	useEffect(() => {
		collisionMeshesRef.current = [];
		rebuildTickRef.current = 0;
		rebuildCollisionMeshes();
	}, [scene, minigameRestartCounter]);

	// On restart: reset triggered state and start grace period so we don't fire from spawn overlap
	useEffect(() => {
		hasTriggeredRef.current = false;
		restartGraceEndRef.current = (typeof performance !== "undefined" ? performance.now() : Date.now()) + POST_RESTART_GRACE_MS;
	}, [minigameRestartCounter]);

	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		// Rebuild periodically so we pick up collision meshes from newly added clones (not just initial scene)
		rebuildTickRef.current += 1;
		if (rebuildTickRef.current >= 90) {
			rebuildTickRef.current = 0;
			rebuildCollisionMeshes();
		}

		if (!onObstacleHitFeedback || minigameCountdownPhase !== "done" || hasTriggeredRef.current) return;
		if (getRobotIsFrozen()) return;
		const now = typeof performance !== "undefined" ? performance.now() : Date.now();
		if (now < restartGraceEndRef.current) return;

		const robotGroupRef = getRobotGroupRef();
		if (!robotGroupRef?.current) return;

		robotGroupRef.current.updateMatrixWorld(true);
		robotGroupRef.current.getWorldPosition(robotPosRef.current);

		const robotBox = robotBoxRef.current;
		robotBox.setFromCenterAndSize(robotPosRef.current, robotSizeRef.current);

		const meshBox = meshBoxRef.current;
		const meshes = collisionMeshesRef.current;
		for (let i = 0; i < meshes.length; i++) {
			const mesh = meshes[i];
			if (!mesh.geometry || !mesh.parent) continue; // skip disposed or removed meshes
			if (boxOverlapsMeshGeometry(robotBox, mesh, meshBox)) {
				hasTriggeredRef.current = true;
				// Only feedback (shake + crash text); popup is shown after delay by Experience
				if (onObstacleHitFeedback) onObstacleHitFeedback();
				return;
			}
		}
	});

	return null;
}
