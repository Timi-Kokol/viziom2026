"use client";

// Imports
// ------------
import React, { useRef, useState, Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import Collisions from "../Collisions";
import Robot from "../Robot"
import Drone from "../Drone";
import LevelOne from "../LevelOne";
import MinigameGuide from "../MinigameGuide";
import MinigameWorld from "../Minigame/MinigameWorld";
import MinigameBackground from "../Minigame/MinigameBackground";
import DebugCoords from "../Minigame/DebugCoords";
import MinigameFallDetector from "../Minigame/MinigameFallDetector";
import MinigameObstacleDetector from "../Minigame/MinigameObstacleDetector";
import MinigameReadyWaiter from "../Minigame/MinigameReadyWaiter";

import { RobotController } from "../RobotController";

const MINIGAME_GLB_URL = "/models/minigame_compressed.glb";

/** Preload GLBs as soon as Canvas is up. Trail sprite preloaded in Introduction. */
function PreloadGLBs() {
	useGLTF.preload(MINIGAME_GLB_URL);
	useGLTF.preload("/models/minigame-guide.glb");
	return null;
}

// ─── Minigame layout: tune these so the robot spawns on top of minigame.glb ───
// Robot spawns at MINIGAME_SPAWN_POSITION when you fall into minigame. Set the GLB
// position and ground height so the floor of the GLB is under the robot.
export const MINIGAME_GLB_POSITION = [0, 0, 0]; // [x, y, z] – position of minigame.glb (origin = track start, robot spawns at 0,0,0)
export const MINIGAME_GLB_SCALE = [1, 1, 1]; // [x, y, z] – scale; use e.g. [10, 10, 10] if the model is tiny
export const MINIGAME_SPAWN_POSITION = [0, 0, 0]; // [x, y, z] – where the robot spawns when entering minigame or on Restart
// Spawn above the floor on enter/Restart so robot never spawns inside geometry. Tune if needed.
export const MINIGAME_SPAWN_Y_OFFSET = 0.7;
// Component
// ------------
const Scene = ({
	currentScene = "main",
	onTransitionToMinigame,
	onTransitionToMain,
	onRobotDebugPosition,
	onMinigameFallStatus,
	onMinigameObstacleHit,
	onMinigameScore,
	onMinigameSpeedChange,
	minigameSpeed = 5,
	minigameSpeedBumpTrigger = 0,
	minigameRestartCounter = 0,
	pendingMinigame = false,
	onMinigameReady,
	minigameCountdownPhase = null,
	minigameShowFallMenu = false,
	minigameCrashTrigger = null,
	collisionDebugEnabled = false,
	onDoorOpen = null,
	onDroneMessage = null,
	gameplayPaused = false,
	doorOpen = false,
	hasVisitedMinigame = false,
}) => {
	const ref1 = useRef();
	const ref2 = useRef();
	const ref3 = useRef();
	const ref4 = useRef();
	const ref5 = useRef();

	//state control for access to the man animation between components
	const [activeAnimation, setActiveAnimation] = useState("gesture");
	const toggleAnimation = () => {
		setActiveAnimation((prev) => (prev === "gesture" ? "flair" : "gesture"));
	};

	const isMain = currentScene === "main";
	const isMinigame = currentScene === "minigame";

	const robotMinigameSpawnPosition = useMemo(
		() =>
			isMinigame
				? [MINIGAME_SPAWN_POSITION[0], MINIGAME_SPAWN_POSITION[1] + MINIGAME_SPAWN_Y_OFFSET, MINIGAME_SPAWN_POSITION[2]]
				: MINIGAME_SPAWN_POSITION,
		[isMinigame]
	);

	return (
		<>
			{/* Preload GLBs so they're in cache */}
			<PreloadGLBs />

			{/* When about to transition to minigame, wait for model to load then call onMinigameReady (may suspend) */}
			{pendingMinigame && onMinigameReady && (
				<Suspense fallback={null}>
					<MinigameReadyWaiter onReady={onMinigameReady} />
				</Suspense>
			)}

			{/* Keep the main GLB mounted. Unmounting it for the minigame leaves the
			    cached scene detached, so Back to main comes back as a black void. */}
			<group visible={isMain}>
				<LevelOne position={[0, 0, 0]} />
				<MinigameGuide
					position={[0, 0, 0]}
					scale={[1, 1, 1]}
					visible={doorOpen && !hasVisitedMinigame}
				/>
				<Drone
					position={[0, 0, 0]}
					onDoorOpen={onDoorOpen}
					onDroneMessage={onDroneMessage}
					isPaused={gameplayPaused || isMinigame}
				/>
			</group>

			{/* Minigame level: key forces full remount on restart so no state/refs/Three objects accumulate */}
			{isMinigame && (
				<>
					<MinigameBackground
						minigameSpeed={minigameSpeed}
						bumpTrigger={minigameSpeedBumpTrigger}
						minigameCountdownPhase={minigameCountdownPhase}
						minigameShowFallMenu={minigameShowFallMenu}
					/>
					<MinigameWorld
						key={`minigame-world-${minigameRestartCounter}`}
						basePosition={MINIGAME_GLB_POSITION}
						baseScale={MINIGAME_GLB_SCALE}
						minigameCountdownPhase={minigameCountdownPhase}
						currentScene={currentScene}
						minigameRestartCounter={minigameRestartCounter}
						minigameShowFallMenu={minigameShowFallMenu}
						collisionDebugEnabled={collisionDebugEnabled}
						onScore={onMinigameScore}
						onSpeedChange={onMinigameSpeedChange}
					/>
				</>
			)}

			{/* Debug: reports robot world position to parent for fixed 2D overlay */}
			{isMinigame && <DebugCoords key={`minigame-debug-${minigameRestartCounter}`} onRobotPosition={onRobotDebugPosition} />}
			{/* When in minigame and robot has fallen (after having been on ground at least once), show fall menu */}
			{isMinigame && (
				<MinigameFallDetector
					key={`minigame-fall-${minigameRestartCounter}`}
					onFallStatus={onMinigameFallStatus}
					minigameRestartCounter={minigameRestartCounter}
				/>
			)}
			{/* When in minigame: if robot touches any mesh whose name contains "collision", show fall menu */}
			{isMinigame && (
				<MinigameObstacleDetector
					key={`minigame-obstacle-${minigameRestartCounter}`}
					onObstacleHitFeedback={onMinigameObstacleHit}
					minigameCountdownPhase={minigameCountdownPhase}
					minigameRestartCounter={minigameRestartCounter}
				/>
			)}

			{/* Physics key by scene only (main vs minigame); restart does NOT remount – MinigameWorld + cache clear handle fresh state */}
			<Physics key={isMinigame ? "minigame" : "main"} gravity={[0, -9.81, 0]}>
				{/* Main: collisions.glb. Minigame: collisions from minigame.glb meshes (no separate ground). */}
				{isMain && <Collisions position={[0, 0, 0]} scale={[1, 1, 1]} />}

				{/* Player: spawns at MINIGAME_SPAWN_POSITION (+ Y offset in minigame) when entering minigame; minigameRestartCounter resets on Restart */}
				<RobotController
					sceneId={currentScene}
					minigameSpawnPosition={robotMinigameSpawnPosition}
					minigameRestartCounter={minigameRestartCounter}
					onFallThrough={isMain ? onTransitionToMinigame : undefined}
					minigameShowFallMenu={minigameShowFallMenu}
					minigameCrashTrigger={minigameCrashTrigger}
					gameplayPaused={gameplayPaused}
				/>
			</Physics>

			{/* <Robot position={[0, -0.7, 1]} scale={[1, 1, 1]} /> */}
			{/* <Dancer
				ref={ref5}
				position={[0, -0.8, 0]}
				activeAnimation={activeAnimation}
			/> */}
			{/* <Logo ref={ref3} position={[0, -0.3, 0]} onClick={toggleAnimation} /> */}
			{/* <HologramBottom ref={ref4} position={[0, -1.1, 0]} /> */}
		</>
	);
};

// Exports
// ------------
Scene.displayName = "Scene";
export default React.memo(Scene);
