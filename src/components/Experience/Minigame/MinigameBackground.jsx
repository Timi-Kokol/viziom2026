"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRobotGroupRef } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";
import { MINIGAME_WORLD_SPEED_MAX } from "./MinigameWorld";

const MINIGAME_WORLD_SPEED_INITIAL = 5;

// Side streaks
const STREAKS_PER_SIDE = 10;
const STREAK_SIDE_X = 7.4;
const STREAK_SPREAD_X = 5.6;
const STREAK_MIN_Y = -3;
const STREAK_MAX_Y = 7;
const STREAK_FAR_Z = -35;
const STREAK_NEAR_Z = 0;
const STREAK_SPEED_BASE = 16;
const STREAK_SPEED_RANGE = 80;
const STREAK_LENGTH_BASE = 0.7; // streak length at min speed
const STREAK_LENGTH_RANGE = 10; // extra length added at max speed
const STREAK_SPEED_SMOOTHING = 8; // higher = reacts faster to speed ramps, still without popping
const STREAK_FADE_IN_SEC = 2;
const STREAK_FADE_OUT_SEC = 0.45; // fade out when crash menu opens

// Shockwave on speed bump
const SHOCKWAVE_DURATION_SEC = 0.45;
const SHOCKWAVE_Z = .4;
const SHOCKWAVE_Y = 0.08;

const SideStreak = React.memo(function SideStreak({ meshRef }) {
	return (
		<mesh ref={meshRef} userData={{ isDecoration: true }}>
			<boxGeometry args={[0.03, 0.03, 1]} />
			<meshStandardMaterial
				color="#dd0009"
				transparent
				opacity={1}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
				toneMapped={false}
				emissive="#dd0009"
				emissiveIntensity={15}
			/>
		</mesh>
	);
});

export default function MinigameBackground({
	minigameSpeed = MINIGAME_WORLD_SPEED_INITIAL,
	bumpTrigger = 0,
	minigameCountdownPhase = null,
	minigameShowFallMenu = false,
}) {
	const rootRef = useRef(null);
	const leftRefs = useRef([]);
	const rightRefs = useRef([]);
	const shockwaveRef = useRef(null);
	const shockwaveMaterialRef = useRef(null);
	const shockwaveStartRef = useRef(-1);
	const lastBumpRef = useRef(0);
	const robotPosRef = useRef(new THREE.Vector3());
	const streakScrollRef = useRef(0);
	const streakSpeedCurrentRef = useRef(STREAK_SPEED_BASE);
	const streakFadeStartRef = useRef(-1);
	const wasPlayingRef = useRef(false);
	const streakVisibilityRef = useRef(0);

	const streakSeeds = useMemo(
		() =>
			Array.from({ length: STREAKS_PER_SIDE }, () => ({
				xJitter: (Math.random() * 2 - 1) * STREAK_SPREAD_X,
				y: THREE.MathUtils.lerp(STREAK_MIN_Y, STREAK_MAX_Y, Math.random()),
				z0: THREE.MathUtils.lerp(STREAK_FAR_Z, STREAK_NEAR_Z, Math.random()),
			})),
		[]
	);

	const gameplayPaused = useGameplayPaused();
	useFrame((state, delta) => {
		if (gameplayPaused) return;
		const isPlaying = minigameCountdownPhase === "done";
		const isActive = isPlaying && !minigameShowFallMenu;
		if (isPlaying && !wasPlayingRef.current) {
			streakFadeStartRef.current = state.clock.elapsedTime;
		} else if (!isPlaying) {
			streakFadeStartRef.current = -1;
		}
		wasPlayingRef.current = isPlaying;
		const robot = getRobotGroupRef()?.current;
		if (robot && rootRef.current) {
			robot.updateMatrixWorld(true);
			robot.getWorldPosition(robotPosRef.current);
			rootRef.current.position.set(robotPosRef.current.x, 0, robotPosRef.current.z);
		}

		const speedNorm = THREE.MathUtils.clamp(
			(minigameSpeed - MINIGAME_WORLD_SPEED_INITIAL) /
				(MINIGAME_WORLD_SPEED_MAX - MINIGAME_WORLD_SPEED_INITIAL),
			0,
			1
		);
		const fadeT =
			isPlaying && streakFadeStartRef.current >= 0
				? THREE.MathUtils.clamp(
						(state.clock.elapsedTime - streakFadeStartRef.current) / STREAK_FADE_IN_SEC,
						0,
						1
				  )
				: 0;
		const outLerp = 1 - Math.exp(-Math.max(0.001, delta) / Math.max(0.001, STREAK_FADE_OUT_SEC));
		streakVisibilityRef.current = THREE.MathUtils.lerp(
			streakVisibilityRef.current,
			isActive ? 1 : 0,
			outLerp
		);

		if (isActive || streakVisibilityRef.current > 0.001) {
			const streakSpeedTarget = STREAK_SPEED_BASE + speedNorm * STREAK_SPEED_RANGE;
			streakSpeedCurrentRef.current = THREE.MathUtils.lerp(
				streakSpeedCurrentRef.current,
				streakSpeedTarget,
				1 - Math.exp(-STREAK_SPEED_SMOOTHING * delta)
			);
			if (isActive) {
				streakScrollRef.current += streakSpeedCurrentRef.current * delta;
			}
			const streakSpan = STREAK_NEAR_Z - STREAK_FAR_Z;
			for (let i = 0; i < streakSeeds.length; i++) {
				const seed = streakSeeds[i];
				const z =
					THREE.MathUtils.euclideanModulo(seed.z0 + streakScrollRef.current - STREAK_FAR_Z, streakSpan) +
					STREAK_FAR_Z;
				const len = STREAK_LENGTH_BASE + speedNorm * STREAK_LENGTH_RANGE;
				const alpha = (0.12 + speedNorm * 0.24) * fadeT * streakVisibilityRef.current;

				const left = leftRefs.current[i];
				if (left) {
					left.position.set(-STREAK_SIDE_X + seed.xJitter, seed.y, z);
					left.scale.set(1, 1, len);
					left.material.opacity = alpha;
				}

				const right = rightRefs.current[i];
				if (right) {
					right.position.set(STREAK_SIDE_X + seed.xJitter, seed.y, z);
					right.scale.set(1, 1, len);
					right.material.opacity = alpha;
				}
			}
		} else {
			for (let i = 0; i < streakSeeds.length; i++) {
				const left = leftRefs.current[i];
				if (left) left.material.opacity = 0;
				const right = rightRefs.current[i];
				if (right) right.material.opacity = 0;
			}
		}

		if (isActive && bumpTrigger !== lastBumpRef.current) {
			lastBumpRef.current = bumpTrigger;
			if (bumpTrigger) shockwaveStartRef.current = state.clock.elapsedTime;
		}

		if (shockwaveRef.current && shockwaveMaterialRef.current) {
			const start = shockwaveStartRef.current;
			if (start < 0) {
				shockwaveRef.current.visible = false;
			} else {
				const t = (state.clock.elapsedTime - start) / SHOCKWAVE_DURATION_SEC;
				if (t >= 1) {
					shockwaveRef.current.visible = false;
					shockwaveStartRef.current = -1;
				} else {
					shockwaveRef.current.visible = true;
					const s = 1 + t * 3.5;
					shockwaveRef.current.position.set(0, SHOCKWAVE_Y, SHOCKWAVE_Z);
					shockwaveRef.current.scale.set(s, s, 1);
					shockwaveMaterialRef.current.opacity = (1 - t) * (0.45 + speedNorm * 0.3);
				}
			}
		}
	});

	return (
		<group ref={rootRef}>

			{streakSeeds.map((_, i) => (
				<SideStreak
					key={`left-streak-${i}`}
					meshRef={(el) => {
						leftRefs.current[i] = el;
					}}
				/>
			))}
			{streakSeeds.map((_, i) => (
				<SideStreak
					key={`right-streak-${i}`}
					meshRef={(el) => {
						rightRefs.current[i] = el;
					}}
				/>
			))}

			<mesh
				ref={shockwaveRef}
				userData={{ isDecoration: true }}
				rotation={[-Math.PI / 2, 0, 0]}
				visible={false}
			>
				<ringGeometry args={[0.2, 0.22, 25]} />
				<meshStandardMaterial
					ref={shockwaveMaterialRef}
					color="#9CFF01"
					transparent
					opacity={1}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					toneMapped={false}
					emissive="#9CFF01"
					emissiveIntensity={15}
				/>
			</mesh>
		</group>
	);
}
