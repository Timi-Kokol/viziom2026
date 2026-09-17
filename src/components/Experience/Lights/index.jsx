"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRobotGroupRef } from "../RobotController";
import { useGameplayPaused } from "../GameplayPausedContext";

// Red robot light: offset from robot center (same base as white light, then these are added)
const RED_LIGHT_OFFSET_X = -0.5;
const RED_LIGHT_OFFSET_Y = -2.5;
const RED_LIGHT_OFFSET_Z = 1;

const Lights = ({ currentScene = "main" }) => {
	const robotPointLightRef = useRef();
	const robotRedPointLightRef = useRef();
	const directionalLightRef = useRef();
	const deskComputerPointLightRef = useRef();
	const deskServerPointLightRef = useRef();
	const reactorPointLightRef = useRef();
	const orangeDeskPointLightRef = useRef();
	const livingRoomPointLightRef = useRef();
	const contactRoomPointLightRef = useRef();
	const triggerComputerPointLightRef = useRef();
	const triggerServerPointLightRef = useRef();
	const triggerLivingPointLightRef = useRef();
	const triggerContactPointLightRef = useRef();
	const introductionRoomPointLightRef = useRef();
	const robotLightWorldPosRef = useRef(new THREE.Vector3());

	const gameplayPaused = useGameplayPaused();

	// Update point lights to follow robot - use world coordinates (main and minigame)
	useFrame(() => {
		if (gameplayPaused) return;
		const robotGroupRef = getRobotGroupRef();
		if (robotGroupRef?.current) {
			robotGroupRef.current.updateMatrixWorld(true);
			robotGroupRef.current.getWorldPosition(robotLightWorldPosRef.current);
			const p = robotLightWorldPosRef.current;
			const x = p.x + 0.5;
			const y = 2;
			const z = p.z - 0.5;
			if (robotPointLightRef.current) {
				robotPointLightRef.current.position.set(x, y, z);
				robotPointLightRef.current.updateMatrix();
				robotPointLightRef.current.updateMatrixWorld(true);
			}
			if (robotRedPointLightRef.current) {
				robotRedPointLightRef.current.position.set(
					x + RED_LIGHT_OFFSET_X,
					y + RED_LIGHT_OFFSET_Y,
					z + RED_LIGHT_OFFSET_Z
				);
				robotRedPointLightRef.current.updateMatrix();
				robotRedPointLightRef.current.updateMatrixWorld(true);
			}
		}
		// Priority must stay 0. Any positive priority tells R3F that something else
		// renders manually, so without EffectComposer mounted the canvas stays black.
	});

	// Minigame: ambient + key light + same robot-following point light as main scene
	if (currentScene === "minigame") {
		return (
			<>
				<ambientLight intensity={0.1} />
				{/* <directionalLight
					position={[5, 10, 5]}
					intensity={0.2}
					castShadow
					shadow-mapSize={[1024, 1024]}
					shadow-bias={-0.001}
					shadow-radius={3}
					shadow-camera-near={0.1}
					shadow-camera-far={15}
				/> */}
				<pointLight
					castShadow
					ref={robotPointLightRef}
					color="white"
					intensity={5}
					distance={5.5}
					decay={2}
					shadow-mapSize={[128, 128]}
					shadow-bias={-0.01}
				/>
				<pointLight
					ref={robotRedPointLightRef}
					color="red"
					intensity={9}
					distance={5.5}
					decay={5}
				/>
			</>
		);
	}

	

	return (
		<>
			{/* robot light */}
			<pointLight
				castShadow
				ref={robotPointLightRef}
				color="white"
				intensity={2}
				distance={5.5}
				decay={3}
				shadow-mapSize={[128, 128]}
				shadow-bias={-0.01}
			/>
			{/* red robot light - follows robot in main and minigame */}
			<pointLight
				ref={robotRedPointLightRef}
				color="red"
				intensity={15}
				distance={1.5}
				decay={5}
			/>

			{/* desk light computer room - no castShadow to stay under 16 texture units */}
			<pointLight
				ref={deskComputerPointLightRef}
				position={[-2, 1.5, -8.3]} 
				color="#FF0008"
				intensity={2}
				distance={5.5}
				decay={1.5}
			/>

			{/* trigger  computer room*/}	
			<pointLight
				ref={triggerComputerPointLightRef}
				position={[-3.8, 0.1, -8.1]} 
				color="#48ff00"
				intensity={1}
				distance={1}
				decay={0.5}
			/>

			{/* trigger  Server room*/}	
			<pointLight
				ref={triggerServerPointLightRef}
				position={[4.7, 0.1, -6.1]} 
				color="#48ff00"
				intensity={1}
				distance={1}
				decay={0.5}
			/>

			{/* trigger  Living room*/}	
			<pointLight
				ref={triggerLivingPointLightRef}
				position={[3.7, 0.1, -12.4]} 
				color="#48ff00"
				intensity={1}
				distance={1}
				decay={0.5}
			/>

			{/* trigger  Contact room*/}	
			<pointLight
				ref={triggerContactPointLightRef}
				position={[-1.7, 0.1, -15.9]} 
				color="#48ff00"
				intensity={1}
				distance={1}
				decay={0.5}
			/>

			{/* desk light server room - no castShadow to stay under 16 texture units */}
			<pointLight
				ref={deskServerPointLightRef}
				position={[2, 1.5, -8.3]} 
				color="#FF0008"
				intensity={2}
				distance={4.5}
				decay={1.5}
			/>

			{/* reactor light */}	
			<pointLight
				ref={reactorPointLightRef}
				position={[0.1, 2, -9]} 
				color="red"
				intensity={6}
				distance={2.5}
				decay={1.5}
			/>

			{/* orange desk light */}	
			<pointLight
				ref={orangeDeskPointLightRef}
				position={[6, 1.3, -6.3]} 
				color="orange"
				intensity={2}
				distance={1.5}
				decay={1.5}
			/>

			{/* living room light - no castShadow to stay under 16 texture units */}
			<pointLight
				ref={livingRoomPointLightRef}
				position={[2.7, 1.5, -12.3]} 
				color="#FF0008"
				intensity={5}
				distance={5.5}
				decay={2.5}
			/>

			{/* intro room light */}	
			<pointLight
				//castShadow
				ref={introductionRoomPointLightRef}
				position={[0, 1.5, 0]} 
				color="#FF0008"
				intensity={5}
				distance={9.5}
				decay={2.5}
			/>

			{/* contact room light - no castShadow to stay under 16 texture units */}
			<pointLight
				ref={contactRoomPointLightRef}
				position={[-2, 2, -13]} 
				color="#FF0008"
				intensity={15}
				distance={5.5}
				decay={2.5}
			/>




			{/* directional light – sun-like fill, casts shadows over the scene */}
			{/* <directionalLight
				ref={directionalLightRef}
				position={[12, 18, 10]}
				intensity={0.8}
				color="#FF0008"
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-bias={-0.0005}
				shadow-radius={2}
				shadow-camera-near={0.5}
				shadow-camera-far={45}
				shadow-camera-left={-12}
				shadow-camera-right={12}
				shadow-camera-top={12}
				shadow-camera-bottom={-20}
			/> */}

			{/* <pointLight
				position={[0, 2, 0]} // x, y, z
				color="white" // light color
				intensity={30} // brightness
				distance={3.2} // range of light
				decay={0} // light falloff
				castShadow // enables shadows from this light
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-bias={-0.001}
			/> */}
		</>
	);
};

Lights.displayName = "Lights";
export default Lights;
