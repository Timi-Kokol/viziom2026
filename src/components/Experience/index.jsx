"use client";

// Imports
// ------------
import React, { Suspense, useState, useCallback, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Scene, { MINIGAME_GLB_POSITION } from "./Scene";
import Lights from "./Lights";
import Environment from "./Environment";
import AnimatedBackground from "./AnimatedBackground";
import PostProcessing from "./PostProcessing";
import CameraController, { CAMERA_CONFIG } from "./CameraController";
import { ModalProvider } from "./ModalContext";
import { GameplayPausedContext } from "./GameplayPausedContext";
import { ProximityProvider, ProximityDetectorInternal, useProximity } from "./ProximityDetector";
import ActionPromptWrapper from "./ProximityDetector/ActionPromptWrapper";
import LasersMessage from "./ProximityDetector/LasersMessage";
import GlobalMessage, { GLOBAL_MESSAGE_BOTTOM_VISIT_PODS } from "./GlobalMessage";
import PulseSoundController from "./ProximityDetector/PulseSoundController";
import TouchNav from "./TouchNav";
import SoundToggle from "./SoundToggle";
import Introduction from "./Introduction";
import UnifiedModal from "./Modals/UnifiedModal";
import MobileNav from "@parts/MobileNav";
import { getCrashMessage } from "./Minigame/MinigameWorld";
import { useIntro } from "@parts/Contexts";
import { SoundProvider, useSound, SOUND_IDS, getSoundManager } from "../../audio";
import { getDoorOpen } from "./doorState";
import { fetchTop10, fetchTop10WithStatus, insertScore } from "../../lib/highScores";
import { useHaptics } from "@/haptics";

// Plays beep only when 3/2/1 appear and countdown GO only when GO appears (inside SoundProvider)
const CountdownSounds = React.memo(function CountdownSounds({ currentScene, phase }) {
	const { play } = useSound();
	const prevPhaseRef = useRef(null);
	useEffect(() => {
		if (currentScene !== "minigame" || phase == null) return;
		if (phase === "done") {
			prevPhaseRef.current = "done";
			return;
		}
		// Only play when phase actually changes to this value (avoid repeat/strafe cross-talk)
		if (prevPhaseRef.current === phase) return;
		prevPhaseRef.current = phase;
		if (phase === "go") {
			play(SOUND_IDS.COUNTDOWN_GO);
		} else if (phase === 3 || phase === 2 || phase === 1) {
			play(SOUND_IDS.BEEP);
		}
	}, [currentScene, phase, play]);
	return null;
});

// Styles
// ------------
import { Jacket, BackButtonStyled, ButtonWhite, ButtonGray, MinigameScoreWrap, MinigameCountdownWrap, MinigameCountdownNumber, MinigameCountdownGo, CrashOverlay, CrashBanner, CrashedTitle, CrashedMessage, CrashedScore, CrashedButtons, HighScoreForm, HighScoreInput, HighScoreLeaderboard } from "./styles";
import { MessageWrap as DroneMessageWrap } from "./Drone/styles";

const FADE_DURATION_MS = 500;
/** Extra time to keep the overlay black when entering minigame so the track GLB is ready before we fade in (avoids pop). */
const MINIGAME_FADE_IN_DELAY_MS = 350;

const FadeOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: #000;
	pointer-events: ${(p) => (p.$blocking ? "auto" : "none")};
	z-index: ${(p) => p.$zIndex ?? 100};
	transition: opacity ${FADE_DURATION_MS}ms ease-in-out;
	opacity: ${(p) => p.$opacity};
`;

const SCENE_FADE_IN_MS = 500;
/** After intro overlay fades, keep scene hidden this long so main GLB can load before we fade in (avoids pop). */
const INTRO_SCENE_REVEAL_DELAY_MS = 450;

const SceneFadeWrap = styled.div`
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition: opacity ${SCENE_FADE_IN_MS}ms ease-out;
	width: 100%;
	height: 100%;
`;

/** Wraps all 2D UI (overlays, TouchNav, modals) so they fade in with the scene when entering from intro */
const SceneUIFade = styled.div`
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition: opacity ${SCENE_FADE_IN_MS}ms ease-out;
`;

// Scene switching: currentScene is "main" | "minigame". Only the level content (Scene) is swapped;
// main-only elements (Lights, AnimatedBackground, ProximityDetector/E prompts) are gated by currentScene
// so minigame has its own lights and no modal triggers.

// ─── Starting scene: change to "minigame" to load minigame first (handy for dev) ───
const START_SCENE = "main"; // "main" | "minigame" (use "minigame" for dev)
const SHOW_DEBUG_OVERLAY = false; // robot coords, speed, collision debug (minigame)
const MINIGAME_FX_TRIGGER_SPEED = 17; // trigger impressive + visual max-speed FX earlier
const SOUND_VOLUME_ON = 1;
const SOUND_VOLUME_OFF = 0;
const SOUND_VOLUME_FADE_MS = 450;

// ─── WebGPU test: keep false. R3F/drei/postprocessing expect WebGL (getContext/getContextAttributes); WebGPURenderer has no WebGL context, so the stack throws. Set true only when dependencies support WebGPU. ───
const USE_WEBGPU = false;

// Component
// ------------
// Mobile/reduceQuality: viewport < 1024. Skip shadows and extra FX, not the renderer.
// Do not swap WebGL context flags (antialias / powerPreference) after mount.
const REDUCE_QUALITY_BREAKPOINT = 1024;
const CANVAS_GL = {
	powerPreference: "high-performance",
	antialias: true,
	stencil: false,
};
function useReduceQuality() {
	const [reduceQuality, setReduceQuality] = useState(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const update = () => setReduceQuality(window.innerWidth < REDUCE_QUALITY_BREAKPOINT);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);
	return reduceQuality;
}

const Experience = () => {
	const reduceQuality = useReduceQuality();
	const { setIntroComplete } = useIntro();
	const { triggerPress, triggerHover, triggerBuzz } = useHaptics();
	const [showIntroduction, setShowIntroduction] = useState(true);
	const [introExiting, setIntroExiting] = useState(false);
	const [soundEnabled, setSoundEnabled] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentScene, setCurrentScene] = useState(START_SCENE);
	const [transitionPhase, setTransitionPhase] = useState("idle");
	const [overlayOpacity, setOverlayOpacity] = useState(0);
	const [robotDebugPos, setRobotDebugPos] = useState({ x: 0, y: 0, z: 0 });
	const [showMinigameFallMenu, setShowMinigameFallMenu] = useState(false);
	const [showMinigameFallMenuContent, setShowMinigameFallMenuContent] = useState(false); // "You fell" + buttons; delayed on crash
	const [fallMenuOverlayOpacity, setFallMenuOverlayOpacity] = useState(1); // 0->1 fade on crash; 1 immediately on fall-through
	const [obstacleHitTriggerTime, setObstacleHitTriggerTime] = useState(null); // timestamp when obstacle hit (for shake + crash text)
	const [minigameRestartCounter, setMinigameRestartCounter] = useState(0);
	const [pendingMinigame, setPendingMinigame] = useState(false);
	const [minigameCountdownPhase, setMinigameCountdownPhase] = useState(null); // null | 3 | 2 | 1 | "go" | "done"
	// Display value for UI only; actual value sent on submit is in runPayloadRef (harder to find in DevTools)
	const [runD, setRunD] = useState(0);
	const runPayloadRef = useRef(0);
	const [minigameSpeed, setMinigameSpeed] = useState(5); // current scroll speed (5–15), reported by MinigameWorld
	const [minigameSpeedBumpTrigger, setMinigameSpeedBumpTrigger] = useState(0); // timestamp trigger for background shockwave
	const [minigameScoreMultiplier, setMinigameScoreMultiplier] = useState(1); // doubles each clone
	const [showSpeedBumpMessage, setShowSpeedBumpMessage] = useState(false); // "Speed increased!" for a few seconds
	const [restartTransitionPhase, setRestartTransitionPhase] = useState("idle"); // "idle" | "fadeOut" | "fadeIn"
	const [restartOverlayOpacity, setRestartOverlayOpacity] = useState(0);
	const [collisionDebugEnabled, setCollisionDebugEnabled] = useState(false); // minigame: show cyan collision wireframes (dev)
	// High scores (Supabase): top 10 list, name input, submit state
	const [top10Scores, setTop10Scores] = useState([]);
	const [top10LoadDone, setTop10LoadDone] = useState(false); // true only after fetch completes (avoids form flashing then hiding)
	const [top10FetchOk, setTop10FetchOk] = useState(false); // true only when fetch succeeded (don't show form if DB unavailable)
	const [highScoreName, setHighScoreName] = useState("");
	const [highScoreSubmitted, setHighScoreSubmitted] = useState(false);
	const [highScoreSubmitting, setHighScoreSubmitting] = useState(false);
	const transitionTimeoutRef = useRef(null);
	const transitionTargetRef = useRef(null);
	const restartTimeoutRef = useRef(null);
	const obstaclePopupDelayRef = useRef(null); // delay before showing fall menu after crash
	const obstacleCrashContentDelayedRef = useRef(false); // true while we're waiting to show content after crash (so fall detector doesn't set content immediately)
	const obstacleHitLockedRef = useRef(false); // prevents duplicate obstacle-hit handling for a single crash
	const speedBumpMessageTimeoutRef = useRef(null);
	const minigameReadyRef = useRef(false);
	const fadeOutCompleteRef = useRef(false);
	const [scorePopTick, setScorePopTick] = useState(0); // increments on timer so score pop runs at fixed rate
	const scorePopIntervalRef = useRef(null);
	// After refresh, audio is muted until user gesture. Show "Tap to start" on main or minigame until first interaction.
	const hasUserInteractedRef = useRef(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const [waitingForTapToStart, setWaitingForTapToStart] = useState(false);
	// Main progression hint: persists across scene changes in this session.
	// 1) Before first modal: visit green circles.
	// 2) After first modal, while locked: drone spotlight hint.
	// 3) After unlock: trap-door hint.
	const [hasOpenedAnyModal, setHasOpenedAnyModal] = useState(false);
	const [hasVisitedMinigame, setHasVisitedMinigame] = useState(false);
	// Door unlocked by drone countdown – used so "Drone unlocks access" only shows before door is open
	const [doorOpen, setDoorOpen] = useState(false);
	const [droneMessage, setDroneMessage] = useState({ show: false, text: "" });
	useEffect(() => {
		setDoorOpen(getDoorOpen());
	}, []);

	const handleDroneMessage = useCallback(({ show, text }) => {
		setDroneMessage({ show: !!show, text: text ?? "" });
	}, []);

	const applySoundEnabled = useCallback((enabled, { resume = false } = {}) => {
		const mgr = getSoundManager();
		if (!mgr) return;
		if (enabled) {
			mgr.setSoundEnabled(true);
			mgr.setMasterVolume(SOUND_VOLUME_ON, { smooth: true, durationMs: SOUND_VOLUME_FADE_MS });
			if (resume) mgr.resume();
		} else {
			mgr.setSoundEnabled(false, { stopImmediately: false });
			mgr.setMasterVolume(SOUND_VOLUME_OFF, {
				smooth: true,
				durationMs: SOUND_VOLUME_FADE_MS,
				onComplete: () => mgr.stopAll(),
			});
		}
	}, []);

	const markUserInteracted = useCallback(() => {
		hasUserInteractedRef.current = true;
		setHasUserInteracted(true);
		if (soundEnabled) getSoundManager()?.resume();
		setWaitingForTapToStart(false);
	}, [soundEnabled]);

	// Mark that the user has interacted (so music/audio can play and minigame countdown can start). Only resume audio when sound is enabled.
	useEffect(() => {
		const set = () => {
			hasUserInteractedRef.current = true;
			setHasUserInteracted(true);
			if (soundEnabled) getSoundManager()?.resume();
		};
		document.addEventListener("click", set, { once: true });
		document.addEventListener("touchstart", set, { once: true });
		document.addEventListener("keydown", set, { once: true });
		return () => {
			document.removeEventListener("click", set);
			document.removeEventListener("touchstart", set);
			document.removeEventListener("keydown", set);
		};
	}, [soundEnabled]);

	// Mark progression once any CTA modal is opened.
	useEffect(() => {
		const onModalOpened = () => {
			setHasOpenedAnyModal(true);
		};
		window.addEventListener("experience-modal-opened", onModalOpened);
		return () => window.removeEventListener("experience-modal-opened", onModalOpened);
	}, []);

	// Modal state broadcast from ModalContext (open/close).
	useEffect(() => {
		const onModalStateChanged = (event) => {
			setIsModalOpen(Boolean(event?.detail?.open));
		};
		window.addEventListener("experience-modal-state-changed", onModalStateChanged);
		return () => window.removeEventListener("experience-modal-state-changed", onModalStateChanged);
	}, []);

	// While modal is open: mute non-music gameplay sounds; duck music; stop drone.
	const MUSIC_DUCK_MS = 1000;
	useEffect(() => {
		const mgr = getSoundManager();
		if (!mgr) return;
		mgr.setSelectiveMute?.(isModalOpen, {
			exceptIds: [SOUND_IDS.MUSIC, SOUND_IDS.BUTTON_PRESS, SOUND_IDS.BUTTON_HOVER],
		});
		if (isModalOpen) {
			mgr.setVolumeOverride?.(SOUND_IDS.MUSIC, 0.08, { durationMs: MUSIC_DUCK_MS });
			mgr.stop(SOUND_IDS.DRONE);
			mgr.stop(SOUND_IDS.ALARM);
			mgr.stop(SOUND_IDS.ROBOTGAS);
			mgr.stop(SOUND_IDS.PULSE);
		} else {
			mgr.setVolumeOverride?.(SOUND_IDS.MUSIC, null, { durationMs: MUSIC_DUCK_MS });
		}
	}, [isModalOpen]);

	// Once player enters minigame at least once, hide the final trap-door hint.
	useEffect(() => {
		if (currentScene === "minigame") setHasVisitedMinigame(true);
	}, [currentScene]);

	const onMinigameSpeedChange = useCallback((speed, multiplier, isBump) => {
		if (showMinigameFallMenu) return;
		setMinigameScoreMultiplier(multiplier);
		if (isBump) {
			setMinigameSpeedBumpTrigger(Date.now());
			getSoundManager()?.play(SOUND_IDS.SPEED_INCREASE);
			if (speed >= MINIGAME_FX_TRIGGER_SPEED) {
				setTimeout(() => getSoundManager()?.play(SOUND_IDS.IMPRESSIVE), 300);
			}
			setShowSpeedBumpMessage(true);
			if (speedBumpMessageTimeoutRef.current) clearTimeout(speedBumpMessageTimeoutRef.current);
			speedBumpMessageTimeoutRef.current = setTimeout(() => {
				setShowSpeedBumpMessage(false);
				speedBumpMessageTimeoutRef.current = null;
			}, 2500);
		} else {
			setMinigameSpeed(speed); // ramping value from timer (throttled reports)
		}
	}, [showMinigameFallMenu]);

	const onRobotDebugPosition = useCallback((x, y, z) => {
		if (showMinigameFallMenu) return;
		setRobotDebugPos({ x, y, z });
	}, [showMinigameFallMenu]);

	const CRASH_DELAY_MS = 900; // delay before fade to black and popup start
	const CRASH_POPUP_DELAY_MS = CRASH_DELAY_MS;
	const CRASH_OVERLAY_FADE_MS = 1500;
	const CRASH_POPUP_FADE_MS = 300;

	const onMinigameFallStatus = useCallback((isFallen) => {
		setShowMinigameFallMenu(isFallen);
		if (!obstacleCrashContentDelayedRef.current) {
			setShowMinigameFallMenuContent(isFallen);
		}
		setFallMenuOverlayOpacity(1); // fall-through: overlay full immediately
		if (!isFallen) obstacleCrashContentDelayedRef.current = false;
	}, []);

	const onMinigameObstacleHit = useCallback(() => {
		if (obstacleHitLockedRef.current) return;
		obstacleHitLockedRef.current = true;
		triggerBuzz();
		getSoundManager()?.play(SOUND_IDS.CRASH);
		setObstacleHitTriggerTime(Date.now());
		obstacleCrashContentDelayedRef.current = true;
		setShowMinigameFallMenu(true); // overlay + freeze immediately
		setShowMinigameFallMenuContent(false);
		setFallMenuOverlayOpacity(0); // stay at 0 until delay elapses
		if (obstaclePopupDelayRef.current) clearTimeout(obstaclePopupDelayRef.current);
		obstaclePopupDelayRef.current = setTimeout(() => {
			obstacleCrashContentDelayedRef.current = false;
			setFallMenuOverlayOpacity(1); // start fade to black now
			setShowMinigameFallMenuContent(true); // show popup now
			obstaclePopupDelayRef.current = null;
		}, CRASH_POPUP_DELAY_MS);
	}, [triggerBuzz]);

	const completeFadeIn = useCallback((extraDelayMs = 0) => {
		setTransitionPhase("fadeIn");
		setOverlayOpacity(1);
		const startFadeOut = () => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => setOverlayOpacity(0));
			});
			transitionTimeoutRef.current = setTimeout(() => {
				setTransitionPhase("idle");
				setOverlayOpacity(0);
			}, FADE_DURATION_MS);
		};
		if (extraDelayMs > 0) {
			transitionTimeoutRef.current = setTimeout(startFadeOut, extraDelayMs);
		} else {
			startFadeOut();
		}
	}, []);

	const startTransitionTo = useCallback((targetScene) => {
		if (transitionPhase !== "idle") return;
		transitionTargetRef.current = targetScene;
		minigameReadyRef.current = false;
		fadeOutCompleteRef.current = false;
		setTransitionPhase("fadeOut");
		setOverlayOpacity(0);
		if (targetScene === "minigame") setPendingMinigame(true);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => setOverlayOpacity(1));
		});
		transitionTimeoutRef.current = setTimeout(() => {
			const target = transitionTargetRef.current;
			if (target === "main") {
				setCurrentScene("main");
				transitionTargetRef.current = null;
				completeFadeIn();
			} else if (target === "minigame") {
				fadeOutCompleteRef.current = true;
				// If model is already ready, switch and fade in now; else onMinigameReady will do it
				if (minigameReadyRef.current) {
					setCurrentScene("minigame");
					setRunD(0);
					runPayloadRef.current = 0;
					setMinigameSpeed(5);
					setMinigameScoreMultiplier(1);
					setShowSpeedBumpMessage(false);
					setPendingMinigame(false);
					transitionTargetRef.current = null;
					completeFadeIn(MINIGAME_FADE_IN_DELAY_MS);
				}
			}
		}, FADE_DURATION_MS);
	}, [transitionPhase, completeFadeIn]);

	const onMinigameReady = useCallback(() => {
		minigameReadyRef.current = true;
		// Only switch and fade in once fade-out has completed (500ms), so the transition is visible
		if (!fadeOutCompleteRef.current) return;
		setCurrentScene("minigame");
		setRunD(0);
		runPayloadRef.current = 0;
		setMinigameSpeed(5);
		setMinigameScoreMultiplier(1);
		setShowSpeedBumpMessage(false);
		setPendingMinigame(false);
		transitionTargetRef.current = null;
		completeFadeIn(MINIGAME_FADE_IN_DELAY_MS);
	}, [completeFadeIn]);

	const onTransitionToMinigame = useCallback(() => {
		startTransitionTo("minigame");
	}, [startTransitionTo]);

	const onTransitionToMain = useCallback(() => {
		startTransitionTo("main");
	}, [startTransitionTo]);

	const startRestartTransition = useCallback(() => {
		if (restartTransitionPhase !== "idle") return;
		if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
		setRestartTransitionPhase("fadeOut");
		setRestartOverlayOpacity(0);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => setRestartOverlayOpacity(1));
		});
		restartTimeoutRef.current = setTimeout(() => {
			setMinigameRestartCounter((c) => c + 1);
			setRunD(0);
			runPayloadRef.current = 0;
			setMinigameSpeed(5);
			setMinigameScoreMultiplier(1);
			setShowSpeedBumpMessage(false);
			if (speedBumpMessageTimeoutRef.current) clearTimeout(speedBumpMessageTimeoutRef.current);
			speedBumpMessageTimeoutRef.current = null;
			obstacleCrashContentDelayedRef.current = false;
			setFallMenuOverlayOpacity(1);
			setShowMinigameFallMenu(false);
			setShowMinigameFallMenuContent(false);
			obstacleHitLockedRef.current = false;
			// Short delay so React/R3F apply new state before we fade in (avoids buggy respawn)
			const fadeInDelayMs = 120;
			restartTimeoutRef.current = setTimeout(() => {
				setRestartTransitionPhase("fadeIn");
				setRestartOverlayOpacity(1);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => setRestartOverlayOpacity(0));
				});
				restartTimeoutRef.current = setTimeout(() => {
					setRestartTransitionPhase("idle");
					setRestartOverlayOpacity(0);
				}, FADE_DURATION_MS);
			}, fadeInDelayMs);
		}, FADE_DURATION_MS);
	}, [restartTransitionPhase]);

	useEffect(() => {
		return () => {
			if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
			if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
			if (obstaclePopupDelayRef.current) clearTimeout(obstaclePopupDelayRef.current);
			if (speedBumpMessageTimeoutRef.current) clearTimeout(speedBumpMessageTimeoutRef.current);
		};
	}, []);

	// Clear fall menu when we've left minigame (so popup "Back to main" doesn't fight with detector during transition)
	useEffect(() => {
		if (currentScene === "main") {
			obstacleCrashContentDelayedRef.current = false;
			obstacleHitLockedRef.current = false;
			setObstacleHitTriggerTime(null);
			setFallMenuOverlayOpacity(1);
			setShowMinigameFallMenu(false);
			setShowMinigameFallMenuContent(false);
		}
	}, [currentScene]);

	// Fetch top 10 when crash popup content is shown (to decide if score qualifies)
	useEffect(() => {
		if (!showMinigameFallMenuContent) return;
		setTop10LoadDone(false);
		setTop10FetchOk(false);
		let cancelled = false;
		fetchTop10WithStatus().then(({ data, error }) => {
			if (!cancelled) {
				setTop10LoadDone(true);
				if (error) setTop10FetchOk(false);
				else {
					setTop10Scores(data ?? []);
					setTop10FetchOk(true);
				}
			}
		});
		return () => { cancelled = true; };
	}, [showMinigameFallMenuContent]);

	// Reset high-score form state when crash overlay is closed
	useEffect(() => {
		if (!showMinigameFallMenu) {
			obstacleHitLockedRef.current = false;
			setHighScoreSubmitted(false);
			setHighScoreName("");
			setTop10LoadDone(false);
			setTop10FetchOk(false);
		}
	}, [showMinigameFallMenu]);

	// Cancel delayed crash content when restarting so it doesn't show after respawn
	useEffect(() => {
		obstacleCrashContentDelayedRef.current = false;
		obstacleHitLockedRef.current = false;
		if (obstaclePopupDelayRef.current) {
			clearTimeout(obstaclePopupDelayRef.current);
			obstaclePopupDelayRef.current = null;
		}
	}, [minigameRestartCounter]);

	// Clear obstacle hit trigger after shake + crash text duration so next hit can trigger again
	useEffect(() => {
		if (obstacleHitTriggerTime == null) return;
		const t = setTimeout(() => setObstacleHitTriggerTime(null), 600);
		return () => clearTimeout(t);
	}, [obstacleHitTriggerTime]);

	// Score pop at fixed interval so animation is always visible (not tied to rapid score updates)
	const SCORE_POP_INTERVAL_MS = 250;
	useEffect(() => {
		const active =
			currentScene === "minigame" &&
			minigameCountdownPhase === "done" &&
			!showMinigameFallMenu;
		if (!active) {
			if (scorePopIntervalRef.current) {
				clearInterval(scorePopIntervalRef.current);
				scorePopIntervalRef.current = null;
			}
			return;
		}
		scorePopIntervalRef.current = setInterval(() => {
			setScorePopTick((t) => t + 1);
		}, SCORE_POP_INTERVAL_MS);
		return () => {
			if (scorePopIntervalRef.current) {
				clearInterval(scorePopIntervalRef.current);
				scorePopIntervalRef.current = null;
			}
		};
	}, [currentScene, minigameCountdownPhase, showMinigameFallMenu]);

	// Minigame countdown: 3, 2, 1, GO! then "done". After refresh, audio is muted until user taps – wait for first interaction then start.
	// Do not depend on soundEnabled: toggling sound should not restart the countdown or pause the game.
	useEffect(() => {
		if (currentScene !== "minigame") {
			setMinigameCountdownPhase(null);
			setWaitingForTapToStart(false);
			return;
		}
		if (!hasUserInteractedRef.current) {
			setWaitingForTapToStart(true);
			return;
		}
		setWaitingForTapToStart(false);
		if (soundEnabled) getSoundManager()?.resume();
		setMinigameCountdownPhase(3);
		const start = Date.now();
		const interval = setInterval(() => {
			const elapsed = (Date.now() - start) / 1000;
			if (elapsed >= 3.5) {
				setMinigameCountdownPhase("done");
				clearInterval(interval);
			} else if (elapsed >= 3) {
				setMinigameCountdownPhase("go");
			} else if (elapsed >= 2) {
				setMinigameCountdownPhase(1);
			} else if (elapsed >= 1) {
				setMinigameCountdownPhase(2);
			} else {
				setMinigameCountdownPhase(3);
			}
		}, 50);
		return () => clearInterval(interval);
	}, [currentScene, minigameRestartCounter, waitingForTapToStart]);

	// Drone ambient loop: play only when in main scene, intro dismissed, sound enabled, and modal closed
	useEffect(() => {
		const mgr = getSoundManager();
		if (!mgr) return;
		if (currentScene === "main" && !showIntroduction && soundEnabled && !isModalOpen) {
			mgr.play(SOUND_IDS.DRONE, { loop: true });
		} else {
			mgr.stop(SOUND_IDS.DRONE);
		}
		return () => mgr.stop(SOUND_IDS.DRONE);
	}, [currentScene, showIntroduction, soundEnabled, isModalOpen]);

	const isOverlayBlocking = transitionPhase === "fadeOut" || transitionPhase === "fadeIn";
	const showFade = transitionPhase !== "idle" || overlayOpacity > 0;

	const handleEnterWithSound = useCallback(() => {
		setTimeout(() => {
			setShowIntroduction(false);
			setIntroComplete(true);
			setSoundEnabled(true);
			hasUserInteractedRef.current = true;
			setHasUserInteracted(true);
			setWaitingForTapToStart(false);
			applySoundEnabled(true, { resume: true });
		}, INTRO_SCENE_REVEAL_DELAY_MS);
	}, [applySoundEnabled]);

	const handleEnterWithoutSound = useCallback(() => {
		setTimeout(() => {
			setShowIntroduction(false);
			setIntroComplete(true);
			setSoundEnabled(false);
			hasUserInteractedRef.current = true;
			setHasUserInteracted(true);
			setWaitingForTapToStart(false);
			applySoundEnabled(false);
		}, INTRO_SCENE_REVEAL_DELAY_MS);
	}, [setIntroComplete, applySoundEnabled]);

	const handleIntroFadeStart = useCallback(() => {
		setIntroExiting(true);
	}, []);

	const handleSoundToggle = useCallback(() => {
		setSoundEnabled((prev) => {
			const next = !prev;
			applySoundEnabled(next, { resume: next });
			return next;
		});
	}, [applySoundEnabled]);

	// Single tree: intro overlay when showIntroduction; main view when introExiting or !showIntroduction
	// so the main view can mount hidden during intro fade-out, then fade in when intro unmounts.
	const showIntroOverlay = showIntroduction;
	const showMainView = introExiting || !showIntroduction;

	return (
		<ModalProvider>
			<ProximityProvider>
				<SoundProvider soundEnabled={soundEnabled}>
					{showIntroOverlay && (
						<div
							style={{
								position: "fixed",
								inset: 0,
								backgroundColor: "#000",
								zIndex: 9999,
							}}
						>
							<Introduction
								onEnterWithSound={handleEnterWithSound}
								onEnterWithoutSound={handleEnterWithoutSound}
								onFadeStart={handleIntroFadeStart}
							/>
						</div>
					)}
					{showMainView && (
					<SceneFadeWrap $visible={!showIntroduction}>
						<CountdownSounds currentScene={currentScene} phase={minigameCountdownPhase} />
						<Jacket>
					<Suspense fallback={null}>
						<GameplayPausedContext.Provider value={currentScene === "main" && isModalOpen}>
						<Canvas
							dpr={[1, 1.5]}
							shadows={!reduceQuality}
							frameloop={currentScene === "main" && isModalOpen ? "never" : "always"}
							gl={CANVAS_GL}
							{...(USE_WEBGPU && {
								gl: async (defaultProps) => {
									try {
										if (typeof navigator === "undefined" || !navigator.gpu) return undefined;
										const { WebGPURenderer } = await import("three/webgpu");
										const renderer = new WebGPURenderer(defaultProps);
										await renderer.init();
										return renderer;
									} catch {
										return undefined;
									}
								},
							})}
						>

					
					{/* Camera follows the robot; OrbitControls stay off. */}

					{/* NOTE • ENVIRONMENT – main only; minigame uses same black background */}
					<Environment currentScene={currentScene} />

					{/* NOTE • ANIMATED BACKGROUND – main only; hidden in minigame */}
					{currentScene === "main" && (
						<AnimatedBackground reduceQuality={reduceQuality === true} />
					)}

					{/* NOTE • LIGHTS – main has full set; minigame gets minimal lights only */}
					<Lights currentScene={currentScene} />

					{/* NOTE • OBJECTS – Scene switches LevelOne+Drone+Collisions vs Minigame (collisions from GLB) */}
					<Scene
						currentScene={currentScene}
						onTransitionToMinigame={onTransitionToMinigame}
						onTransitionToMain={onTransitionToMain}
						onRobotDebugPosition={onRobotDebugPosition}
						onMinigameFallStatus={onMinigameFallStatus}
						onMinigameObstacleHit={onMinigameObstacleHit}
						onMinigameScore={(v) => {
						if (showMinigameFallMenu) return;
						runPayloadRef.current = v;
						setRunD(v);
					}}
						onMinigameSpeedChange={onMinigameSpeedChange}
						minigameSpeed={minigameSpeed}
						minigameSpeedBumpTrigger={minigameSpeedBumpTrigger}
						minigameRestartCounter={minigameRestartCounter}
						pendingMinigame={pendingMinigame}
						onMinigameReady={onMinigameReady}
						minigameCountdownPhase={minigameCountdownPhase}
						minigameShowFallMenu={showMinigameFallMenu}
						minigameCrashTrigger={obstacleHitTriggerTime}
						collisionDebugEnabled={collisionDebugEnabled}
						onDoorOpen={() => setDoorOpen(true)}
						onDroneMessage={handleDroneMessage}
						gameplayPaused={isModalOpen}
						doorOpen={doorOpen}
						hasVisitedMinigame={hasVisitedMinigame}
					/>

					<PerspectiveCamera
						makeDefault
						fov={CAMERA_CONFIG[currentScene]?.fov ?? 14}
						near={CAMERA_CONFIG[currentScene]?.near ?? 0.1}
						far={CAMERA_CONFIG[currentScene]?.far ?? 200}
						position={CAMERA_CONFIG[currentScene]?.position ?? [13, 12, 20]}
					/>

					<CameraController
						currentScene={currentScene}
						minigameShakeTrigger={obstacleHitTriggerTime}
					/>

					<PostProcessing
						currentScene={currentScene}
						minigameSpeed={minigameSpeed}
						reduceQuality={reduceQuality === true}
					/>

					{/* Proximity detection for CTA meshes – main only; no E prompts in minigame */}
					<ProximityDetectorInternal currentScene={currentScene} />
				</Canvas>
						</GameplayPausedContext.Provider>
			</Suspense>

			<SceneUIFade $visible={!showIntroduction}>
			{/* Drone "Detected!" message: fixed position so it doesn't jitter when moving */}
			{droneMessage.show && (
				<div
					style={{
						position: "fixed",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						zIndex: 140,
						pointerEvents: "none",
					}}
				>
					<DroneMessageWrap>{droneMessage.text}</DroneMessageWrap>
				</div>
			)}

			{/* Fade overlay for scene transitions */}
			{showFade && (
				<FadeOverlay $opacity={overlayOpacity} $blocking={isOverlayBlocking} />
			)}

			{/* Fade overlay for minigame Restart: black fade out → restart → fade in (above fall menu) */}
			{currentScene === "minigame" && restartTransitionPhase !== "idle" && (
				<FadeOverlay
					$opacity={restartOverlayOpacity}
					$blocking={true}
					$zIndex={160}
				/>
			)}

			{/* Wait for first tap so audio can play (music on main, countdown in minigame). Shown on main if loaded first, or in minigame before countdown. */}
			{((currentScene === "main" && !hasUserInteracted) || (currentScene === "minigame" && waitingForTapToStart)) && (
				<div
					role="button"
					tabIndex={0}
					onClick={markUserInteracted}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							markUserInteracted();
						}
					}}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 145,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0,0,0,0.4)",
						cursor: "pointer",
						fontFamily: "var(--kode-mono), ui-monospace, monospace",
						fontSize: "1.5rem",
						fontWeight: 700,
						color: "#fff",
						textTransform: "uppercase",
						letterSpacing: "0.1em",
					}}
					aria-label="Tap to start"
				>
					Tap to start
				</div>
			)}

			{/* Minigame high score: top center, pops when value updates */}
			{currentScene === "minigame" && minigameCountdownPhase === "done" && !showMinigameFallMenu && (
				<MinigameScoreWrap>
					<div className="score-label">Score</div>
					<div className="score-value" key={scorePopTick}>
						{runD}
					</div>
					{showSpeedBumpMessage && (
						<div className="speed-bump-msg">Speed increased!</div>
					)}
				</MinigameScoreWrap>
			)}

			{/* Minigame countdown overlay: 3, 2, 1, GO! – each phase appears big and scales down; GO! uses MinigameCountdownGo so you can style it separately */}
			{currentScene === "minigame" && minigameCountdownPhase != null && minigameCountdownPhase !== "done" && (
				<MinigameCountdownWrap>
					{minigameCountdownPhase === "go" ? (
						<MinigameCountdownGo key="go">GO!</MinigameCountdownGo>
					) : (
						<MinigameCountdownNumber key={minigameCountdownPhase}>
							{minigameCountdownPhase}
						</MinigameCountdownNumber>
					)}
				</MinigameCountdownWrap>
			)}

			{/* Back to main level - only in minigame (hidden when fall menu is open) */}
			{currentScene === "minigame" && !showMinigameFallMenu && (
				<BackButtonStyled
					onMouseEnter={() => {
						triggerHover();
						getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
					}}
					onClick={() => {
						triggerPress();
						getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
						onTransitionToMain();
					}}
				>
					<span>
						<span>Back to main</span>
					</span>
				</BackButtonStyled>
			)}

			{/* Big "CRASH!" on screen when you hit an obstacle (clears with obstacleHitTriggerTime ~600ms) */}
			{currentScene === "minigame" && obstacleHitTriggerTime != null && (
				<CrashBanner>CRASH!</CrashBanner>
			)}

			{/* Minigame fall menu: black overlay (fades in on crash) + (delayed on crash) "You fell" + buttons (fade 0.3s) */}
			{currentScene === "minigame" && showMinigameFallMenu && (
				<CrashOverlay
					style={{
						transition: `all ${CRASH_OVERLAY_FADE_MS}ms ease-out`,
						opacity: fallMenuOverlayOpacity,
					}}
				>
					<div
						style={{
							opacity: showMinigameFallMenuContent && top10LoadDone ? 1 : 0,
							transition: `opacity ${CRASH_POPUP_FADE_MS}ms ease-out`,
							pointerEvents: showMinigameFallMenuContent && top10LoadDone ? "auto" : "none",
						}}
					>
						<CrashedTitle>Crashed!</CrashedTitle>
						<CrashedMessage>{getCrashMessage(runD)}</CrashedMessage>
						<CrashedScore>
							Final score <br />
							<span>{runD}</span>
						</CrashedScore>
						<CrashedButtons>
							<ButtonWhite
								type="button"
								onMouseEnter={() => {
									triggerHover();
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
								}}
								onClick={() => {
									triggerPress();
									getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
									startRestartTransition();
								}}
							>
								<span>
									<span>Restart</span>
								</span>
							</ButtonWhite>
							<ButtonGray
								type="button"
								onMouseEnter={() => {
									triggerHover();
									getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
								}}
								onClick={() => {
									triggerPress();
									getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
									onTransitionToMain();
								}}
							>
								<span>
									<span>Back to Main</span>
								</span>
							</ButtonGray>
						</CrashedButtons>
						{(() => {
							const tenthScore = top10Scores[9]?.score ?? -1;
							const qualifies = top10Scores.length < 10 || runD > tenthScore;
							const showHighScoreForm =
								showMinigameFallMenuContent && top10LoadDone && top10FetchOk && qualifies && !highScoreSubmitted;
							if (!showHighScoreForm) return null;
							const handleSubmit = () => {
								triggerPress();
								getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
								setHighScoreSubmitting(true);
								insertScore(highScoreName, runPayloadRef.current).then(({ ok }) => {
									if (ok) fetchTop10().then(setTop10Scores);
									setHighScoreSubmitted(true);
									setHighScoreSubmitting(false);
								});
							};
							return (
								<HighScoreForm>
									<div>You made it to TOP 10!</div>
									<HighScoreInput
										type="text"
										placeholder="Your name"
										value={highScoreName}
										onChange={(e) => setHighScoreName(e.target.value)}
										maxLength={12}
										disabled={highScoreSubmitting}
									/>
									<ButtonWhite
										type="button"
										disabled={highScoreSubmitting}
										onMouseEnter={() => getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER)}
										onClick={handleSubmit}
									>
										<span>
											<span>{highScoreSubmitting ? "Submitting…" : "Submit"}</span>
										</span>
									</ButtonWhite>
								</HighScoreForm>
							);
						})()}

						{showMinigameFallMenuContent && top10Scores.length > 0 && (
							<HighScoreLeaderboard>
								<ul>
									{top10Scores.map((row, i) => (
										<li key={row.id}>
											<span><strong>{i + 1}.</strong> {row.player_name || "Anonymous"}</span>
											<span>{row.score}</span>
										</li>
									))}
								</ul>
							</HighScoreLeaderboard>
						)}
					</div>
				</CrashOverlay>
			)}

			{/* Debug coords overlay – fixed 2D on window, only in minigame */}
			{SHOW_DEBUG_OVERLAY && currentScene === "minigame" && (
				<div
					style={{
						position: "fixed",
						left: 12,
						top: 12,
						zIndex: 200,
						padding: "10px 14px",
						background: "rgba(0, 0, 0, 0.85)",
						color: "#0f0",
						fontFamily: "monospace",
						fontSize: "13px",
						lineHeight: 1.5,
						borderRadius: "6px",
						border: "1px solid rgba(0, 255, 0, 0.4)",
					}}
				>
					<div style={{ pointerEvents: "none" }}>
						<div><strong>Robot</strong> x: {robotDebugPos.x.toFixed(3)} y: {robotDebugPos.y.toFixed(3)} z: {robotDebugPos.z.toFixed(3)}</div>
						<div><strong>Minigame GLB (center)</strong> x: {MINIGAME_GLB_POSITION[0].toFixed(3)} y: {MINIGAME_GLB_POSITION[1].toFixed(3)} z: {MINIGAME_GLB_POSITION[2].toFixed(3)}</div>
						<div><strong>Speed</strong> {minigameSpeed}</div>
						<div style={{ opacity: 0.8, fontSize: "11px", marginTop: 4 }}>Set MINIGAME_SPAWN_POSITION to robot coords above so spawn is on the floor.</div>
					</div>
					{typeof process !== "undefined" && process.env.NODE_ENV === "development" && (
						<label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
							<input
								type="checkbox"
								checked={collisionDebugEnabled}
								onChange={(e) => setCollisionDebugEnabled(e.target.checked)}
							/>
							<span>Collision debug (cyan)</span>
						</label>
					)}
				</div>
			)}

			{/* Action prompt - rendered outside Canvas */}
			<ActionPromptWrapper />
			<PulseSoundController />
			<HintMessages
				currentScene={currentScene}
				doorOpen={doorOpen}
				hasVisitedMinigame={hasVisitedMinigame}
				hasOpenedAnyModal={hasOpenedAnyModal}
			/>

			{/* Virtual touch navigation for robot (touch devices) */}
			<TouchNav currentScene={currentScene} />

			{/* Sound toggle: bottom-right, visible in main and minigame */}
			<SoundToggle soundEnabled={soundEnabled} onToggle={handleSoundToggle} />

			{/* Modal - single shell with per-page content */}
			<UnifiedModal />
			<MobileNav />
			</SceneUIFade>
					</Jacket>
					</SceneFadeWrap>
					)}
				</SoundProvider>
			</ProximityProvider>
		</ModalProvider>
	);
};

function HintMessages({ currentScene, doorOpen, hasVisitedMinigame, hasOpenedAnyModal }) {
	const { nearLasers } = useProximity();
	const isMain = currentScene === "main";
	const showLasers = isMain && nearLasers && !doorOpen;
	const showProgressHint = isMain && (!doorOpen || !hasVisitedMinigame) && !showLasers;

	return (
		<>
			<LasersMessage enabled={isMain} doorOpen={doorOpen} />
			<GlobalMessage visible={showProgressHint} bottom={GLOBAL_MESSAGE_BOTTOM_VISIT_PODS}>
				{!hasOpenedAnyModal
					? "Visit the green circles to access content"
					: !doorOpen
						? "Drones' spotlight unlocks a hidden minigame"
						: "Lasers are off, drop down the trap door to start the minigame"}
			</GlobalMessage>
		</>
	);
}

// Exports
// ------------
Experience.displayName = "Experience";
export default Experience;
