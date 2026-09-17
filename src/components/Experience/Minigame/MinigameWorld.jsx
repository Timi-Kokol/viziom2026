"use client";

import React, { useRef, useLayoutEffect, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getRobotIsFrozen, getRobotGroupRef } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";
import MinigameCollisionDebug from "./MinigameCollisionDebug";

const MINIGAME_GLB_URL = "/models/minigame_compressed.glb";
const MINIGAME_WORLD_SPEED_INITIAL = 5;
export const MINIGAME_WORLD_SPEED_MAX = 19;
const MINIGAME_WORLD_SPEED_INCREMENT = 2;
const MINIGAME_Y_OFFSET = 0;
/** Increase target speed every this many seconds (timer-based, not per-clone) */
const SPEED_INCREASE_INTERVAL_SEC = 18;
/** Last jump to max speed uses this interval instead (longer wait before final speed) */
const SPEED_LAST_JUMP_INTERVAL_SEC = 18;
/** How long (seconds) to ramp from current speed to the new target (smooth transition, no sudden jump) */
const SPEED_RAMP_DURATION_SEC = 2;
const CLEANUP_MARGIN = 320; // only remove when block is well behind robot (robot runs in -Z so robotZ shrinks; 8 was too small)
const ADD_AHEAD = 30;
const MAX_BLOCKS = 8; // cap to avoid runaway spawn or memory use

// Make clone use the same geometry as template (saves GPU memory; all blocks share one set of geometries)
function shareGeometryFromTemplate(src, clone) {
	const srcMeshes = [];
	src.traverse((c) => {
		if (c.isMesh) srcMeshes.push(c);
	});
	let i = 0;
	clone.traverse((c) => {
		if (c.isMesh && srcMeshes[i]) {
			c.geometry = srcMeshes[i].geometry;
			i++;
		}
	});
}

/** Crash screen messages by score tier (highest tier where score >= minScore wins). Edit here to change copy. */
export const CRASH_MESSAGE_TIERS = [
	{ minScore: 0, message: "Wow, I don't even know what to say." },
	{ minScore: 300, message: "My mom had the same score." },
	{ minScore: 800, message: "I have seen worse." },
	{ minScore: 1500, message: "Not bad young grasshopper." },
	{ minScore: 5000, message: "Your right hand is better than your left." },
	{ minScore: 20000, message: "The ladies are impressed." },
	{ minScore: 60000, message: "Darth Vader has nothing on you." },
];

/** Returns the crash message for the given final score (uses CRASH_MESSAGE_TIERS). */
export function getCrashMessage(score) {
	let chosen = CRASH_MESSAGE_TIERS[0];
	for (let i = 0; i < CRASH_MESSAGE_TIERS.length; i++) {
		if (score >= CRASH_MESSAGE_TIERS[i].minScore) chosen = CRASH_MESSAGE_TIERS[i];
	}
	return chosen.message;
}

/**
 * Minigame track: start (once) + repeatable block (set1→set2→set3).
 * Block length = set1-empty to set3-end. New blocks placed at previous set3-end.
 */
export default function MinigameWorld({
	basePosition = [0, 0, 0],
	baseScale = [1, 1, 1],
	minigameCountdownPhase = null,
	currentScene = "main",
	minigameRestartCounter = 0,
	minigameShowFallMenu = false,
	collisionDebugEnabled = false,
	onScore,
	onSpeedChange,
}) {
	const { scene, animations } = useGLTF(MINIGAME_GLB_URL);
	const groupRef = useRef(null);
	const scrollOffsetRef = useRef(0);
	const lastReportedScoreRef = useRef(-1);
	const lastScoreReportTimeRef = useRef(0); // throttle score updates to React (avoid 60fps re-renders)
	const targetSpeedRef = useRef(MINIGAME_WORLD_SPEED_INITIAL);
	const currentSpeedRef = useRef(MINIGAME_WORLD_SPEED_INITIAL); // ramps toward target
	const currentMultiplierRef = useRef(1);
	const speedIncreaseTimerRef = useRef(0);
	const lastSpeedReportTimeRef = useRef(0);
	const vecHelper = useRef(new THREE.Vector3());

	// Full scene (start + set1 + set2 + set3) – one copy, never cloned
	const fullSceneRef = useRef(null);
	const fullMixerRef = useRef(null);
	// Block = set1 + set2 + set3; length = set1-empty to set3-end
	const blockTemplateRef = useRef(null);
	const blockLengthRef = useRef(0);
	const tailZRef = useRef(0);
	const tailSignRef = useRef(1); // +1 if track extends in +Z, -1 if in -Z
	const clipsRef = useRef([]);
	const nextBlockIdRef = useRef(0);
	const blocksRef = useRef([]); // always current list in useFrame
	const [blockList, setBlockList] = useState([]);
	const [ready, setReady] = useState(false);

	// Keep ref in sync for useFrame (new blocks); useLayoutEffect uses animations directly so clips
	// are available when building the scene (effect order: useLayoutEffect runs before useEffect,
	// so in production clipsRef was still [] when playing full mixer — fix by depending on animations here).
	useEffect(() => {
		clipsRef.current = Array.isArray(animations) ? animations : [];
	}, [animations]);

	useLayoutEffect(() => {
		if (currentScene !== "minigame") {
			setReady(false);
			return;
		}
		if (!scene) return;
		const clips = Array.isArray(animations) ? animations : [];
		clipsRef.current = clips;

		// Dispose previous run's resources (only mixers for blocks – geometry is shared with blockTemplate)
		const disposeBlockMixer = (b) => {
			if (b.mixer) {
				b.mixer.stopAllAction();
				if (typeof b.mixer.uncacheRoot === "function") b.mixer.uncacheRoot(b.group);
				if (typeof b.mixer.dispose === "function") b.mixer.dispose();
			}
		};
		(blocksRef.current || []).forEach(disposeBlockMixer);
		blocksRef.current = [];
		setBlockList([]);
		if (fullMixerRef.current) {
			fullMixerRef.current.stopAllAction();
			if (typeof fullMixerRef.current.dispose === "function") fullMixerRef.current.dispose();
			fullMixerRef.current = null;
		}
		// Don't dispose fullSceneRef geometry/material: they're shared with useGLTF cache; disposing would break the next clone on restart
		if (fullSceneRef.current) {
			fullSceneRef.current = null;
		}
		if (blockTemplateRef.current) {
			blockTemplateRef.current.traverse((o) => {
				if (o.geometry) o.geometry.dispose();
				if (o.material) {
					if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
					else o.material.dispose();
				}
			});
			blockTemplateRef.current = null;
		}

		scrollOffsetRef.current = 0;
		lastReportedScoreRef.current = -1;
		lastScoreReportTimeRef.current = 0;
		targetSpeedRef.current = MINIGAME_WORLD_SPEED_INITIAL;
		currentSpeedRef.current = MINIGAME_WORLD_SPEED_INITIAL;
		currentMultiplierRef.current = 1;
		speedIncreaseTimerRef.current = 0;
		lastSpeedReportTimeRef.current = 0;
		if (onSpeedChange) onSpeedChange(MINIGAME_WORLD_SPEED_INITIAL, 1, false);
		const [bx, by, bz] = basePosition;
		if (groupRef.current) {
			groupRef.current.position.set(bx, by + MINIGAME_Y_OFFSET, bz);
			groupRef.current.scale.set(...baseScale);
		}

		// Use a clone for measuring and building template (don't mutate shared scene)
		const template = scene.clone(true);
		template.updateMatrixWorld(true);

		const set1Empty = template.getObjectByName("set1-empty");
		const set2Empty = template.getObjectByName("set2-empty");
		const set3Empty = template.getObjectByName("set3-empty");
		const set4Empty = template.getObjectByName("set4-empty");
		const set4End = template.getObjectByName("set4-end");

		if (!set1Empty || !set2Empty || !set3Empty || !set4Empty || !set4End) {
			fullSceneRef.current = scene.clone(true);
			fullSceneRef.current.traverse((c) => {
				if (c.isMesh) {
					c.castShadow = false;
					c.receiveShadow = true;
				}
			});
			fullMixerRef.current = new THREE.AnimationMixer(fullSceneRef.current);
			clips.forEach((clip) => {
				fullMixerRef.current.clipAction(clip).reset().fadeIn(0.3).play();
			});
			blockTemplateRef.current = null;
			blockLengthRef.current = 0;
			tailZRef.current = 0;
			tailSignRef.current = 1;
			setBlockList([]);
			blocksRef.current = [];
			setReady(true);
			return;
		}

		const v = vecHelper.current;
		const z = (o) => (o.getWorldPosition(v), v.z);
		const z1 = z(set1Empty);
		const z2 = z(set2Empty);
		const z3 = z(set3Empty);
		const z4 = z(set4Empty);
		const z4End = z(set4End);

		const blockLength = Math.abs(z4End - z1);
		blockLengthRef.current = blockLength;
		tailZRef.current = z4End;
		tailSignRef.current = z4End >= z1 ? 1 : -1;

		// Block template: set1 at 0, set2/set3/set4 placed so block runs 0..blockLength
		const blockTemplate = new THREE.Group();
		const s1 = set1Empty.clone(true);
		s1.position.set(0, 0, 0);
		blockTemplate.add(s1);
		const s2 = set2Empty.clone(true);
		s2.position.set(0, 0, z2 - z1);
		blockTemplate.add(s2);
		const s3 = set3Empty.clone(true);
		s3.position.set(0, 0, z3 - z1);
		blockTemplate.add(s3);
		const s4 = set4Empty.clone(true);
		s4.position.set(0, 0, z4 - z1);
		blockTemplate.add(s4);
		blockTemplate.traverse((c) => {
			if (c.isMesh) {
				c.castShadow = false;
				c.receiveShadow = true;
				// Own clones so we can dispose the measuring template without breaking this template
				if (c.geometry) c.geometry = c.geometry.clone();
				if (c.material) {
					if (Array.isArray(c.material)) c.material = c.material.map((m) => m.clone());
					else c.material = c.material.clone();
				}
			}
		});
		blockTemplateRef.current = blockTemplate;

		// Don't dispose template: it shares geometry/material with useGLTF scene; disposing would corrupt the cache for next restart

		// Full scene: one copy (start + set1 + set2 + set3 + set4), never cloned
		const fullScene = scene.clone(true);
		fullScene.traverse((c) => {
			if (c.isMesh) {
				c.castShadow = false;
				c.receiveShadow = true;
			}
		});
		fullSceneRef.current = fullScene;
		fullMixerRef.current = new THREE.AnimationMixer(fullScene);
		clips.forEach((clip) => {
			fullMixerRef.current.clipAction(clip).reset().fadeIn(0.3).play();
		});

		setBlockList([]);
		blocksRef.current = [];
		nextBlockIdRef.current = 0;
		setReady(true);
	}, [currentScene, minigameRestartCounter, basePosition, baseScale, scene, animations]);

	// On unmount (e.g. key change = new instance): remove all clones from scene, then dispose everything
	useEffect(() => {
		return () => {
			const disposeObj = (obj) => {
				if (!obj) return;
				obj.traverse((o) => {
					if (o.geometry) o.geometry.dispose();
					if (o.material) {
						if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
						else o.material.dispose();
					}
				});
			};
			// Dispose template materials only; geometry is shared with block clones (don't double-dispose)
			const disposeTemplateMaterialsOnly = (obj) => {
				if (!obj) return;
				obj.traverse((o) => {
					if (o.material) {
						if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
						else o.material.dispose();
					}
				});
			};
			const group = groupRef.current;
			// Remove from scene first so nothing is attached when we dispose
			if (group) {
				if (fullSceneRef.current) group.remove(fullSceneRef.current);
				(blocksRef.current || []).forEach((b) => {
					if (b.group.parent) b.group.parent.remove(b.group);
				});
			}
			// Only dispose mixers for blocks; their geometry is shared with blockTemplate
			(blocksRef.current || []).forEach((b) => {
				if (b.mixer) {
					b.mixer.stopAllAction();
					if (typeof b.mixer.uncacheRoot === "function") b.mixer.uncacheRoot(b.group);
					if (typeof b.mixer.dispose === "function") b.mixer.dispose();
				}
			});
			blocksRef.current = [];
			if (fullMixerRef.current) {
				fullMixerRef.current.stopAllAction();
				if (typeof fullMixerRef.current.dispose === "function") fullMixerRef.current.dispose();
				fullMixerRef.current = null;
			}
			// Don't dispose fullSceneRef geometry/material (shared with useGLTF cache)
			if (fullSceneRef.current) {
				fullSceneRef.current = null;
			}
			if (blockTemplateRef.current) {
				disposeTemplateMaterialsOnly(blockTemplateRef.current);
				blockTemplateRef.current = null;
			}
		};
	}, []);

	const gameplayPaused = useGameplayPaused();
	useFrame((state, delta) => {
		if (gameplayPaused) return;
		if (!groupRef.current || currentScene !== "minigame") return;

		const countdownDone = minigameCountdownPhase === "done";
		const gameOver = minigameShowFallMenu || getRobotIsFrozen();

		// Timer-based speed increase: 30s between bumps; 60s for the last jump to max speed
		if (countdownDone && !gameOver) {
			speedIncreaseTimerRef.current += delta;
			const isLastJump = targetSpeedRef.current + MINIGAME_WORLD_SPEED_INCREMENT >= MINIGAME_WORLD_SPEED_MAX;
			const intervalSec = isLastJump ? SPEED_LAST_JUMP_INTERVAL_SEC : SPEED_INCREASE_INTERVAL_SEC;
			if (speedIncreaseTimerRef.current >= intervalSec) {
				speedIncreaseTimerRef.current = 0;
				if (targetSpeedRef.current < MINIGAME_WORLD_SPEED_MAX) {
					targetSpeedRef.current = Math.min(MINIGAME_WORLD_SPEED_MAX, targetSpeedRef.current + MINIGAME_WORLD_SPEED_INCREMENT);
					currentMultiplierRef.current *= 2;
					if (onSpeedChange) onSpeedChange(targetSpeedRef.current, currentMultiplierRef.current, true);
				}
			}
		}

		// Ramp current speed toward target over SPEED_RAMP_DURATION_SEC (constant rate, no sudden jump)
		const diff = targetSpeedRef.current - currentSpeedRef.current;
		if (SPEED_RAMP_DURATION_SEC > 0 && Math.abs(diff) > 1e-6) {
			const maxStep = (MINIGAME_WORLD_SPEED_INCREMENT / SPEED_RAMP_DURATION_SEC) * delta;
			currentSpeedRef.current += Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
		} else {
			currentSpeedRef.current = targetSpeedRef.current;
		}

		if (countdownDone && !gameOver) {
			scrollOffsetRef.current += currentSpeedRef.current * delta;
		}
		const score = Math.round(scrollOffsetRef.current * currentMultiplierRef.current);
		const elapsed = state.clock.elapsedTime;
		// Throttle score updates to React (~10 Hz) so Experience doesn't re-render every frame
		const SCORE_REPORT_INTERVAL = 0.1;
		if (onScore) {
			const throttleOk = elapsed - lastScoreReportTimeRef.current >= SCORE_REPORT_INTERVAL;
			const gameEnded = countdownDone && gameOver && score !== lastReportedScoreRef.current;
			if (score !== lastReportedScoreRef.current && (throttleOk || gameEnded)) {
				lastReportedScoreRef.current = score;
				lastScoreReportTimeRef.current = elapsed;
				onScore(score);
			}
		}
		if (onSpeedChange && elapsed - lastSpeedReportTimeRef.current >= 0.1) {
			lastSpeedReportTimeRef.current = elapsed;
			onSpeedChange(Number(currentSpeedRef.current.toFixed(1)), currentMultiplierRef.current, false);
		}

		const [bx, by, bz] = basePosition;
		const scaleZ = baseScale[2];
		groupRef.current.position.set(bx, by + MINIGAME_Y_OFFSET, bz + scrollOffsetRef.current);
		groupRef.current.scale.set(...baseScale);

		if (fullMixerRef.current) fullMixerRef.current.update(delta);

		const blocks = blocksRef.current;
		blocks.forEach((b) => {
			if (b.mixer) b.mixer.update(delta);
		});

		const robotRef = getRobotGroupRef();
		const robotZ = robotRef?.current
			? (robotRef.current.getWorldPosition(vecHelper.current), vecHelper.current.z)
			: 0;
		const groupZ = groupRef.current.position.z;
		const scrollOffset = scrollOffsetRef.current;
		const blockLength = blockLengthRef.current;
		const template = blockTemplateRef.current;

		// Remove when the block's FRONT (running direction) has passed the robot, not the back
		const tailSign = tailSignRef.current;
		const toRemove = blocks.filter((b) => {
			const backWorldZ = groupZ + scaleZ * (b.localZ + blockLength);
			const frontWorldZBlock = groupZ + scaleZ * b.localZ;
			const passedZ = tailSign < 0 ? frontWorldZBlock : backWorldZ;
			return passedZ > robotZ + CLEANUP_MARGIN;
		});
		let newBlocks = blocks.filter((b) => !toRemove.includes(b));
		// Remove from scene and dispose mixers (geometry/material shared with blockTemplate – do not dispose)
		toRemove.forEach((b) => {
			if (b.group.parent) b.group.parent.remove(b.group);
			if (b.mixer) {
				b.mixer.stopAllAction();
				if (typeof b.mixer.uncacheRoot === "function") b.mixer.uncacheRoot(b.group);
				if (typeof b.mixer.dispose === "function") b.mixer.dispose();
			}
		});

		// Add at most one block per frame
		let tailZ = tailZRef.current;
		const frontWorldZ = groupZ + scaleZ * tailZ;
		const distFrontToRobot = robotZ - frontWorldZ;
		const needByDistance =
			template &&
			newBlocks.length < MAX_BLOCKS &&
			(distFrontToRobot < ADD_AHEAD || frontWorldZ > robotZ);
		// Fallback: add first block once we've scrolled a bit (so we don't depend on robot Z)
		const needByScroll =
			template &&
			newBlocks.length < MAX_BLOCKS &&
			newBlocks.length === 0 &&
			scrollOffset > 2;
		const needMore = needByDistance || needByScroll;
		if (needMore) {
			const id = nextBlockIdRef.current++;
			const group = template.clone(true);
			shareGeometryFromTemplate(template, group);
			group.position.set(0, 0, tailZ);
			const mixer = new THREE.AnimationMixer(group);
			clipsRef.current.forEach((clip) => {
				mixer.clipAction(clip).reset().fadeIn(0.3).play();
			});
			newBlocks = [...newBlocks, { id, group, localZ: tailZ, mixer }];
			tailZ += tailSign * blockLength;
		}
		tailZRef.current = tailZ;

		if (newBlocks.length !== blocks.length || newBlocks !== blocks) {
			blocksRef.current = newBlocks;
			setBlockList(newBlocks);
		}
	});

	if (currentScene !== "minigame" || !ready || !fullSceneRef.current) {
		return <group ref={groupRef} />;
	}

	return (
		<>
			<group ref={groupRef}>
				<primitive object={fullSceneRef.current} />
				{blockList.map((b) => (
					<primitive key={b.id} object={b.group} />
				))}
			</group>
			{/* <MinigameCollisionDebug currentScene={currentScene} enabled={collisionDebugEnabled} /> */}
		</>
	);
}
