'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import { useRobotHead } from '../../RobotHead/useRobotHead';

/** Pitch when the cursor is level with the head. Positive tilts the face down. */
const DEFAULT_PITCH = 0.12;

/** How far the head can turn, in radians. */
const YAW_RANGE = 0.75;
const PITCH_RANGE = 0.5;

/**
 * Fraction of the viewport the cursor has to cross for the head to reach full
 * deflection. The head lives in a corner, so this is measured from the head
 * outwards rather than from the middle of the screen.
 */
const REACH_X = 0.5;
const REACH_Y = 0.45;

/** Rotation follow rate. */
const SMOOTH = 6;

/** Sits slightly larger and closer than a plain fit, on top of FIT_MARGIN. */
const HEAD_SCALE = 1.1;
const HEAD_FORWARD = 0.06;

/**
 * How much of the head's own size to leave as breathing room when framing it.
 * 1 fills the box edge to edge; higher pulls the camera back.
 */
const FIT_MARGIN = 1;

/** Framing bias in head-widths/heights. Positive x pushes the head left. */
const FIT_BIAS_X = 0;
const FIT_BIAS_Y = 0;

/** Idle sweep for touch devices, which have no cursor to follow. */
const TOUCH_YAW_AMPLITUDE = 0.4;
const TOUCH_YAW_SPEED = 0.8;

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/**
 * Points the camera at the loaded head and pulls back far enough to frame it,
 * so the shot survives the sidebar being any width.
 */
function FitToHead({ bounds }) {
	const camera = useThree((s) => s.camera);
	const width = useThree((s) => s.size.width);
	const height = useThree((s) => s.size.height);

	useEffect(() => {
		if (!bounds || !width || !height) return;

		const size = bounds.getSize(new THREE.Vector3());
		const center = bounds.getCenter(new THREE.Vector3());
		const fov = (camera.fov * Math.PI) / 180;
		const aspect = width / height;

		const fitHeight = (size.y * FIT_MARGIN) / 2 / Math.tan(fov / 2);
		const fitWidth = (size.x * FIT_MARGIN) / 2 / Math.tan(fov / 2) / aspect;
		const distance = Math.max(fitHeight, fitWidth) + size.z;

		camera.position.set(
			center.x + size.x * FIT_BIAS_X,
			center.y + size.y * FIT_BIAS_Y,
			distance,
		);
		camera.aspect = aspect;
		camera.lookAt(camera.position.x, camera.position.y, 0);
		camera.updateProjectionMatrix();
	}, [bounds, camera, width, height]);

	return null;
}

function Head({ aimRef, isTouch, onReady }) {
	const groupRef = useRef(null);
	const { object, bounds, mixer, replay } = useRobotHead();
	const target = useRef(new THREE.Euler(DEFAULT_PITCH, 0, 0, 'YXZ'));
	const current = useRef(new THREE.Euler(DEFAULT_PITCH, 0, 0, 'YXZ'));
	const touchTime = useRef(0);

	useEffect(() => {
		onReady(replay);
	}, [onReady, replay]);

	useFrame((_, delta) => {
		if (mixer) mixer.update(delta);
		const group = groupRef.current;
		if (!group) return;

		if (isTouch) {
			touchTime.current += delta;
			target.current.y = Math.sin(touchTime.current * TOUCH_YAW_SPEED) * TOUCH_YAW_AMPLITUDE;
			target.current.x = DEFAULT_PITCH;
		} else {
			target.current.y = aimRef.current.x * YAW_RANGE;
			target.current.x = DEFAULT_PITCH + aimRef.current.y * PITCH_RANGE;
		}

		const follow = 1 - Math.exp(-SMOOTH * delta);
		current.current.x += (target.current.x - current.current.x) * follow;
		current.current.y += (target.current.y - current.current.y) * follow;
		group.rotation.x = current.current.x;
		group.rotation.y = current.current.y;
	});

	if (!object) return null;
	return (
		<>
			<FitToHead bounds={bounds} />
			<group ref={groupRef} scale={HEAD_SCALE} position-z={HEAD_FORWARD}>
				<primitive object={object} />
			</group>
		</>
	);
}

function Scene({ aimRef, isTouch, onReady }) {
	return (
		<>
			<pointLight
				position={[-5, 5, 10]}
				intensity={8}
				distance={15}
				decay={0}
				color="#fff"
			/>
			<Head aimRef={aimRef} isTouch={isTouch} onReady={onReady} />
		</>
	);
}

/**
 * The loader's robot head, dropped into the modal sidebar. It tracks the cursor
 * across the whole window and replays its idle animation when poked.
 */
export default function SidebarRobotHead({ active = false }) {
	const wrapRef = useRef(null);
	const aimRef = useRef({ x: 0, y: 0 });
	const replayRef = useRef(null);
	const [isTouch, setIsTouch] = useState(false);
	const { triggerPress } = useHaptics();

	useEffect(() => {
		setIsTouch(window.matchMedia('(hover: none)').matches);
	}, []);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el || isTouch) return undefined;

		// The sidebar slides in, so the box is re-read periodically rather than
		// cached once or measured on every single move event.
		let rect = null;
		let measuredAt = 0;

		const onMove = (e) => {
			const now = performance.now();
			if (!rect || now - measuredAt > 300) {
				rect = el.getBoundingClientRect();
				measuredAt = now;
			}
			if (!rect.width || !rect.height) return;

			// Eye line sits above the middle of the box.
			const originX = rect.left + rect.width / 2;
			const originY = rect.top + rect.height * 0.38;
			aimRef.current.x = clamp(
				(e.clientX - originX) / (window.innerWidth * REACH_X),
				-1,
				1,
			);
			aimRef.current.y = clamp(
				(e.clientY - originY) / (window.innerHeight * REACH_Y),
				-1,
				1,
			);
		};

		window.addEventListener('mousemove', onMove, { passive: true });
		return () => window.removeEventListener('mousemove', onMove);
	}, [isTouch]);

	const handleReady = useCallback((replay) => {
		replayRef.current = replay;
	}, []);

	return (
		<div
			ref={wrapRef}
			data-cursor-hover={active ? '' : undefined}
			style={{ width: '100%', height: '100%' }}
			onClick={() => {
				if (!active) return;
				replayRef.current?.();
				getSoundManager()?.play(SOUND_IDS.BEEP);
				triggerPress();
			}}
		>
			<Canvas
				camera={{ position: [0, 0, 2.2], fov: 42 }}
				gl={{ antialias: true, alpha: true }}
				dpr={[1, 1.5]}
				frameloop={active ? 'always' : 'never'}
				style={{ width: '100%', height: '100%' }}
			>
				<Suspense fallback={null}>
					<Scene
						aimRef={aimRef}
						isTouch={isTouch}
						onReady={handleReady}
					/>
				</Suspense>
			</Canvas>
		</div>
	);
}
