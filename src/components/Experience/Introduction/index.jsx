"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getSoundManager, SOUND_IDS } from "../../../audio";
import { useHaptics } from "@/haptics";
import { Wrapper, CanvasLayer, ContentLayer, Title, Subtitle, LoaderButtonsSlot, LoaderTrack, LoaderBar, ButtonGroup, ButtonsFadeWrap, INTRO_FADE_OUT_MS, Logo, Since, ButtonGray, ButtonRed } from "./styles";
import IntroRobotHead from "./IntroRobotHead";

const LOADER_MIN_MS = 3000;
const LOADER_FADE_OUT_MS = 500;
/** Bar fill is capped so it takes at least this long to reach 100% visually */
const LOADER_BAR_FILL_MS = 3000;

// Preloaded before showing Enter buttons:
// - GLBs: main level, minigame track, drone, robot, robot-head, collisions (fetch warms cache for useGLTF)
// - Sounds: all files from soundConfig (fetch + decode via SoundManager.preload)
const PRELOAD_URLS = [
	"/models/ground_compressed.glb",
	"/models/minigame_compressed.glb",
	"/models/minigame-guide.glb",
	"/models/drone.glb",
	"/models/robot.glb",
	"/models/robot-head.glb",
	"/models/collisions.glb",
	"/sprites/trail.jpg",
];

export default function Introduction({ onEnterWithSound, onEnterWithoutSound, onFadeStart, exiting: exitingProp }) {
	const { triggerPress } = useHaptics();
	const [loading, setLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const [exitingLocal, setExitingLocal] = useState(false);
	const [loaderExiting, setLoaderExiting] = useState(false);
	const [showButtons, setShowButtons] = useState(false);
	const [buttonsVisible, setButtonsVisible] = useState(false);
	const exiting = exitingProp ?? exitingLocal;

	// When loading finishes: after loader fade-out delay, hide loader and show buttons
	useEffect(() => {
		if (!loading) {
			const t = setTimeout(() => {
				setLoaderExiting(false);
				setShowButtons(true);
			}, LOADER_FADE_OUT_MS);
			return () => clearTimeout(t);
		}
	}, [loading]);

	// Start buttons at opacity 0 then transition to 1 when they mount
	useEffect(() => {
		if (!showButtons) return;
		const id = requestAnimationFrame(() => requestAnimationFrame(() => setButtonsVisible(true)));
		return () => cancelAnimationFrame(id);
	}, [showButtons]);

	const startTimeRef = useRef(null);
	const assetsDoneRef = useRef(false);
	const totalRef = useRef(PRELOAD_URLS.length + 1);
	const completedRef = useRef(0);
	const fetchStartedRef = useRef(false);

	const mouseRef = useRef({ x: 0, y: 0 });
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	useEffect(() => {
		setIsTouchDevice(Boolean("ontouchstart" in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0)));
	}, []);
	const onMouseMove = useCallback((e) => {
		mouseRef.current = {
			x: (e.clientX / window.innerWidth) * 2 - 1,
			y: (e.clientY / window.innerHeight) * 2 - 1,
		};
	}, []);

	useEffect(() => {
		// Guard: run once (avoids double fetch in React Strict Mode / double mount)
		if (fetchStartedRef.current) return;
		fetchStartedRef.current = true;

		startTimeRef.current = Date.now();
		const total = PRELOAD_URLS.length + 1;
		totalRef.current = total;

		const report = () => {
			completedRef.current += 1;
			const p = completedRef.current / total;
			setProgress(p);
			if (completedRef.current >= total) assetsDoneRef.current = true;
		};

		PRELOAD_URLS.forEach((url) => {
			fetch(url).then(report).catch(report);
		});

		const mgr = getSoundManager();
		if (mgr) {
			mgr.preload().then(report).catch(report);
		} else {
			report();
		}
	}, []);

	// Minimum 5s loader: progress bar fills over 5s; buttons only show when assets done AND 5s elapsed
	const [displayProgress, setDisplayProgress] = useState(0);
	useEffect(() => {
		const start = startTimeRef.current ?? Date.now();
		const tick = () => {
			const elapsed = Date.now() - start;
			const total = totalRef.current || 0;
			const completed = completedRef.current;
			const assetProgress = total > 0 ? completed / total : 0;
			// Bar shows actual asset progress, capped so it doesn't jump to 100% in a flash on fast connections
			const barCap = Math.min(1, elapsed / LOADER_BAR_FILL_MS);
			setDisplayProgress(Math.min(assetProgress, barCap));
			// Only finish when BOTH minimum time has passed AND all assets have actually reported (completed >= total)
			if (elapsed >= LOADER_MIN_MS && total > 0 && completed >= total) {
				setLoading(false);
				setLoaderExiting(true);
			}
		};
		const id = setInterval(tick, 80);
		return () => clearInterval(id);
	}, [progress]);

	// Track if we've already handled this interaction (prevent double-trigger from touch + click)
	const handledRef = useRef(false);
	
	const handleEnterWithSound = () => {
		if (handledRef.current) return;
		handledRef.current = true;
		triggerPress();
		// CRITICAL: Unlock audio IMMEDIATELY on tap (iOS requires this synchronously in the gesture handler)
		const mgr = getSoundManager();
		if (mgr) {
			mgr.setSoundEnabled(true);
			mgr.resume(); // This unlocks iOS audio context synchronously
			mgr.play(SOUND_IDS.BUTTON_PRESS);
		}
		onFadeStart?.();
		setExitingLocal(true);
		setTimeout(onEnterWithSound, INTRO_FADE_OUT_MS);
	};
	const handleEnterWithoutSound = () => {
		triggerPress();
		getSoundManager()?.setSoundEnabled(false);
		onFadeStart?.();
		setExitingLocal(true);
		setTimeout(onEnterWithoutSound, INTRO_FADE_OUT_MS);
	};

	return (
		<Wrapper $exiting={exiting} onMouseMove={onMouseMove}>
			<CanvasLayer>
				<IntroRobotHead mouseRef={mouseRef} isTouchDevice={isTouchDevice} />
			</CanvasLayer>
			<ContentLayer>

				<Logo src="/logo.svg" alt="Logo" />
				<Title>Creating custom web experiences</Title>
				<Since>Since 2014</Since>
				<Subtitle>I recommend turning sound on for the most immersive experience.</Subtitle>

				
					{(loading || loaderExiting) && (
						<LoaderTrack $exiting={loaderExiting}>
							<LoaderBar $progress={displayProgress} />
						</LoaderTrack>
					)}
					{showButtons && (
						<ButtonsFadeWrap $visible={buttonsVisible}>
							<ButtonGroup>
							<ButtonRed $primary onClick={handleEnterWithSound} onTouchEnd={handleEnterWithSound} type="button">
								<span>
									<span>Enter with sound</span>
								</span>
							</ButtonRed>
								<ButtonGray onClick={handleEnterWithoutSound} type="button">
									<span>
										<span>Enter without sound</span>
									</span>
								</ButtonGray>
							</ButtonGroup>
						</ButtonsFadeWrap>
					)}
				
			</ContentLayer>
		</Wrapper>
	);
}
