"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import AnimatedBackground from "../AnimatedBackground";
import { useRobotHead } from "../RobotHead/useRobotHead";

const ANIMATION_PAUSE_MS = 5000;

/** Robot head position in the intro scene [x, y, z]. Tweak to move it on screen. */
const ROBOT_HEAD_POSITION = [0, 0.25, 0];

/** Default pitch when cursor is at center, in radians. Positive = head tilted up. */
const DEFAULT_PITCH = .3;

/** Y-axis look-around on touch: amplitude (rad) and angular speed (rad/s). */
const TOUCH_YAW_AMPLITUDE = 0.45;
const TOUCH_YAW_SPEED = 1;

/** Rotating wrapper + head model; smooth rotation toward mouse (desktop) or time-based Y look (touch). */
function RobotHeadWithFollow({ mouseRef, isTouchDevice }) {
	const groupRef = useRef(null);
	const targetEuler = useRef(new THREE.Euler(DEFAULT_PITCH, 0, 0, "YXZ"));
	const currentEuler = useRef(new THREE.Euler(DEFAULT_PITCH, 0, 0, "YXZ"));
	const touchTimeRef = useRef(0);

	const { object: cloned, mixer } = useRobotHead({ replayDelayMs: ANIMATION_PAUSE_MS });

	const YAW_RANGE = 0.45;
	const PITCH_RANGE = 0.35;
	const SMOOTH = 8;

	useFrame((_, delta) => {
		if (mixer) mixer.update(delta);
		if (!groupRef.current) return;
		if (isTouchDevice) {
			touchTimeRef.current += delta;
			targetEuler.current.y = Math.sin(touchTimeRef.current * TOUCH_YAW_SPEED) * TOUCH_YAW_AMPLITUDE;
			targetEuler.current.x = DEFAULT_PITCH;
		} else if (mouseRef?.current) {
			const { x, y } = mouseRef.current;
			targetEuler.current.y = x * YAW_RANGE;
			targetEuler.current.x = DEFAULT_PITCH + y * PITCH_RANGE;
		}
		const t = 1 - Math.exp(-SMOOTH * delta);
		currentEuler.current.x += (targetEuler.current.x - currentEuler.current.x) * t;
		currentEuler.current.y += (targetEuler.current.y - currentEuler.current.y) * t;
		groupRef.current.rotation.x = currentEuler.current.x;
		groupRef.current.rotation.y = currentEuler.current.y;
	});

	if (!cloned) return null;
	return (
		<group ref={groupRef}>
			<primitive object={cloned} />
		</group>
	);
}

/** Point light for the intro robot head (no helper). */
function IntroPointLight({ position = [2, 2, 3], intensity = 150, distance = 20, decay = 2, color = "#fff5e6" }) {
	return <pointLight position={position} intensity={intensity} distance={distance} decay={decay} color={color} />;
}

function IntroScene({ mouseRef, isTouchDevice }) {
	return (
		<>
			<ambientLight intensity={0.15} color="#3a4a6a" />
			<IntroPointLight position={[0.5, 0.9, 1]} intensity={20} distance={5} decay={2} color="#fff" />
			<group position={ROBOT_HEAD_POSITION}>
				<RobotHeadWithFollow mouseRef={mouseRef} isTouchDevice={isTouchDevice} />
			</group>
		</>
	);
}

export default function IntroRobotHead({ mouseRef, isTouchDevice = false }) {
	return (
		<Canvas
			camera={{ position: [0, 0, 2.2], fov: 42 }}
			gl={{ antialias: true, alpha: false }}
			dpr={[1, 1.5]}
			frameloop="always"
		>
			<AnimatedBackground reduceQuality colorPreset="cyber" waveSpeed={0.08} />
			<Suspense fallback={null}>
				<IntroScene mouseRef={mouseRef} isTouchDevice={isTouchDevice} />
			</Suspense>
			<EffectComposer depthBuffer>
				<Bloom luminanceThreshold={0.1} luminanceSmoothing={0.5} intensity={0.4} />
			</EffectComposer>
		</Canvas>
	);
}
