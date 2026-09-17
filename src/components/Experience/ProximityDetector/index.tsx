'use client';

import React, { useState, useRef, createContext, useContext, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getRobotGroupRef } from '../RobotController';
import { getLevelOneGLBScene } from '../LevelOne';
import { getDoorOpen } from '../doorState';
import { useGameplayPaused } from '../GameplayPausedContext';

// Types
interface CTAMesh {
	name: string;
	label: string;
	modalType: 'about' | 'projects' | 'services' | 'contact';
}

// Context to share proximity state between Canvas and DOM
const ProximityContext = createContext<{
	nearbyCTA: CTAMesh | null;
	setNearbyCTA: (cta: CTAMesh | null) => void;
	nearLasers: boolean;
	setNearLasers: (v: boolean) => void;
}>({
	nearbyCTA: null,
	setNearbyCTA: () => {},
	nearLasers: false,
	setNearLasers: () => {},
});

// Hook to use proximity context
export const useProximity = () => useContext(ProximityContext);

// Proximity detection settings
const PROXIMITY_DISTANCE = 1.3; // Distance in world units before trigger (E prompt)
const LASERS_PROXIMITY_DISTANCE = 1.5; // Distance before showing "Drone unlocks access" + lasers glow
const LASERS_GLOW_PULSE_MAX = 5;
const LASERS_GLOW_REST = 1;

// CTA green glow: only pulses when E is available (in proximity). Rest = no emission.
// NOTE: Traversing CTA/lasers every frame to update glow was killing FPS (20fps near CTAs). Fix: traverse once per CTA/lasers, cache material refs, then only set emissiveIntensity each frame.
const CTA_GLOW_PULSE_ENABLED = true;
const CTA_GLOW_PULSE_THROTTLE = 2; // run glow updates every N frames
const CTA_GLOW_PULSE_MAX = 15;
const CTA_GLOW_PULSE_SPEED = 3.4; // rad/s
const CTA_GLOW_REST = 1; // emission when not in range
// Ground portal sprite at CTA positions (main scene only)
const CTA_PORTAL_ENABLED = true;
const CTA_PORTAL_Y = 0.09; // slightly above ground to avoid z-fighting
const CTA_PORTAL_SIZE = 1;
const CTA_PORTAL_OPACITY = 1;
const CTA_PORTAL_COLS = 5;
const CTA_PORTAL_ROWS = 3;
const CTA_PORTAL_TOTAL_FRAMES = CTA_PORTAL_COLS * CTA_PORTAL_ROWS;
const CTA_PORTAL_FPS = 18;

// Detector component (runs inside Canvas) – main scene only; no E prompts in minigame
export const ProximityDetectorInternal = ({ currentScene = "main" }: { currentScene?: string }) => {
	const { setNearbyCTA, setNearLasers } = useProximity();
	const ctaAboutRef = useRef<THREE.Object3D | null>(null);
	const ctaProjectsRef = useRef<THREE.Object3D | null>(null);
	const ctaServicesRef = useRef<THREE.Object3D | null>(null);
	const ctaContactRef = useRef<THREE.Object3D | null>(null);
	const lasersRef = useRef<THREE.Object3D | null>(null);
	const frameCount = useRef(0);
	const initialDistances = useRef<{ [key: string]: number }>({});
	const prevClosestCTANameRef = useRef<string | null>(null);
	// Only call setNearbyCTA/setNearLasers when value changes (avoids 60 re-renders/sec when standing on CTA)
	const lastNearbyCTANameRef = useRef<string | null>(null);
	const lastNearLasersRef = useRef<boolean>(false);
	// Clone "green glow" materials only for CTA meshes so we don't affect other meshes that share the same material
	const ctaClonedMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
	// Clone lasers materials so glow only affects the lasers mesh
	const lasersClonedMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
	// Cached lists of glow materials per CTA / lasers – traverse once, then only set emissiveIntensity (avoids 20fps drop when standing on CTA)
	const ctaGlowMaterialsCacheRef = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());
	const lasersGlowMaterialsCacheRef = useRef<THREE.MeshStandardMaterial[] | null>(null);
	const robotPosRef = useRef(new THREE.Vector3());
	const ctaPosRef = useRef(new THREE.Vector3());
	const lasersPosRef = useRef(new THREE.Vector3());
	const portalPosRef = useRef(new THREE.Vector3());
	const portalMeshRefs = useRef<Array<THREE.Mesh | null>>([]);
	const portalTexture = useTexture('/sprites/portal.png');
	const portalFrameRef = useRef(0);
	const portalFrameTimerRef = useRef(0);

	useEffect(() => {
		portalTexture.wrapS = THREE.ClampToEdgeWrapping;
		portalTexture.wrapT = THREE.ClampToEdgeWrapping;
		portalTexture.repeat.set(1 / CTA_PORTAL_COLS, 1 / CTA_PORTAL_ROWS);
		portalTexture.offset.set(0, 1 - 1 / CTA_PORTAL_ROWS);
		portalTexture.needsUpdate = true;
	}, [portalTexture]);

	const ctas = useMemo(() => [
		{ ref: ctaAboutRef, name: 'ctaabout', label: 'About', modalType: 'about' as const },
		{ ref: ctaProjectsRef, name: 'ctaprojects', label: 'Projects', modalType: 'projects' as const },
		{ ref: ctaServicesRef, name: 'ctaservices', label: 'Services', modalType: 'services' as const },
		{ ref: ctaContactRef, name: 'ctacontact', label: 'Contact', modalType: 'contact' as const },
	], []);

	// Set CTA glow intensity. First time per CTA: traverse and cache material refs; after that only write emissiveIntensity (no traverse).
	const setCTAGlowIntensity = (ctaObject: THREE.Object3D, ctaName: string, intensity: number) => {
		let cached = ctaGlowMaterialsCacheRef.current.get(ctaName);
		if (!cached) {
			const list: THREE.MeshStandardMaterial[] = [];
			const visit = (obj: THREE.Object3D) => {
				if ((obj as THREE.Mesh).isMesh) {
					const mesh = obj as THREE.Mesh;
					const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
					materials.forEach((mat: THREE.Material, index: number) => {
						if (!mat || !mat.name) return;
						if (!mat.name.toLowerCase().includes('green glow')) return;
						const m = mat as THREE.MeshStandardMaterial;
						if (!('emissiveIntensity' in m)) return;
						const key = `${ctaName}-${mesh.uuid}-${index}`;
						let clone = ctaClonedMaterialsRef.current.get(key);
						if (!clone) {
							clone = m.clone() as THREE.MeshStandardMaterial;
							ctaClonedMaterialsRef.current.set(key, clone);
							if (Array.isArray(mesh.material)) mesh.material[index] = clone;
							else mesh.material = clone;
						}
						list.push(clone);
					});
				}
				obj.children.forEach((child) => visit(child));
			};
			visit(ctaObject);
			ctaGlowMaterialsCacheRef.current.set(ctaName, list);
			cached = list;
		}
		for (let i = 0; i < cached.length; i++) cached[i].emissiveIntensity = intensity;
	};

	// Set lasers glow intensity. First time: traverse and cache material refs; after that only write emissiveIntensity.
	const setLasersGlowIntensity = (lasersObject: THREE.Object3D, intensity: number) => {
		let cached = lasersGlowMaterialsCacheRef.current;
		if (!cached) {
			const list: THREE.MeshStandardMaterial[] = [];
			const visit = (obj: THREE.Object3D) => {
				if ((obj as THREE.Mesh).isMesh) {
					const mesh = obj as THREE.Mesh;
					const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
					materials.forEach((mat: THREE.Material, index: number) => {
						if (!mat) return;
						const m = mat as THREE.MeshStandardMaterial;
						if (!('emissiveIntensity' in m)) return;
						const key = `lasers-${mesh.uuid}-${index}`;
						let clone = lasersClonedMaterialsRef.current.get(key);
						if (!clone) {
							clone = m.clone() as THREE.MeshStandardMaterial;
							clone.transparent = true; // so LevelOne's opacity (door open) works on this clone
							lasersClonedMaterialsRef.current.set(key, clone);
							if (Array.isArray(mesh.material)) mesh.material[index] = clone;
							else mesh.material = clone;
						}
						list.push(clone);
					});
				}
				obj.children.forEach((child) => visit(child));
			};
			visit(lasersObject);
			lasersGlowMaterialsCacheRef.current = list;
			cached = list;
		}
		for (let i = 0; i < cached.length; i++) cached[i].emissiveIntensity = intensity;
	};

	const gameplayPaused = useGameplayPaused();
	useFrame(({ scene, clock }, delta) => {
		if (gameplayPaused) return;
		// In minigame: clear prompt and do not run proximity (no main-level CTAs). Only setState when value actually changes.
		if (currentScene !== "main") {
			if (lastNearbyCTANameRef.current !== null) {
				lastNearbyCTANameRef.current = null;
				setNearbyCTA(null);
			}
			if (lastNearLasersRef.current !== false) {
				lastNearLasersRef.current = false;
				setNearLasers(false);
			}
			return;
		}

		const robotGroupRef = getRobotGroupRef();
		if (!robotGroupRef?.current) {
			if (lastNearbyCTANameRef.current !== null) {
				lastNearbyCTANameRef.current = null;
				setNearbyCTA(null);
			}
			if (lastNearLasersRef.current !== false) {
				lastNearLasersRef.current = false;
				setNearLasers(false);
			}
			return;
		}

		frameCount.current++;
		const runProximity = frameCount.current >= 60;

		// Find all CTA nodes and lasers mesh from LevelOne GLB scene
		if (runProximity && (!ctaAboutRef.current || !ctaProjectsRef.current || !ctaServicesRef.current || !ctaContactRef.current || !lasersRef.current || frameCount.current % 60 === 0)) {
			const levelOneScene = getLevelOneGLBScene();
			if (levelOneScene) {
				levelOneScene.traverse((child: THREE.Object3D) => {
					const name = child.name?.toLowerCase() ?? '';
					if (name === 'ctaabout' && !ctaAboutRef.current) ctaAboutRef.current = child;
					else if (name === 'ctaprojects' && !ctaProjectsRef.current) ctaProjectsRef.current = child;
					else if (name === 'ctaservices' && !ctaServicesRef.current) ctaServicesRef.current = child;
					else if (name === 'ctacontact' && !ctaContactRef.current) ctaContactRef.current = child;
					else if (name === 'lasers' && !lasersRef.current) lasersRef.current = child;
				});
			}
		}

		if (runProximity) {
			// Only update the robot and CTA nodes we need – do NOT update the entire scene (was causing slow/floaty feel)
			robotGroupRef.current.updateMatrixWorld(true);
			robotGroupRef.current.getWorldPosition(robotPosRef.current);

			let closestCTA: CTAMesh | null = null;
			let closestDistance = Infinity;

			ctas.forEach(({ ref, name, modalType, label }) => {
				if (ref.current) {
					ref.current.updateMatrixWorld(true);
					ref.current.getWorldPosition(ctaPosRef.current);
					const distance = robotPosRef.current.distanceTo(ctaPosRef.current);
					if (!initialDistances.current[name]) initialDistances.current[name] = distance;
					if (distance < PROXIMITY_DISTANCE && distance < initialDistances.current[name] - 0.5 && distance < closestDistance) {
						closestDistance = distance;
						closestCTA = { name, label, modalType };
					}
				}
			});

			const closestName: string | null =
				closestCTA === null ? null : (closestCTA as CTAMesh).name;
			if (closestName !== lastNearbyCTANameRef.current) {
				lastNearbyCTANameRef.current = closestName;
				setNearbyCTA(closestCTA);
			}

			const doorOpen = getDoorOpen();
			let distToLasers = Infinity;
			let nearLasers = false;
			if (lasersRef.current && !doorOpen) {
				lasersRef.current.updateMatrixWorld(true);
				lasersRef.current.getWorldPosition(lasersPosRef.current);
				distToLasers = robotPosRef.current.distanceTo(lasersPosRef.current);
				nearLasers = distToLasers < LASERS_PROXIMITY_DISTANCE;
			}
			if (nearLasers !== lastNearLasersRef.current) {
				lastNearLasersRef.current = nearLasers;
				setNearLasers(nearLasers);
			}

			// Green glow pulsate (CTA + lasers): throttled so it doesn't delay robot/camera useFrame (was causing floaty feel)
			if (CTA_GLOW_PULSE_ENABLED && frameCount.current % CTA_GLOW_PULSE_THROTTLE === 0) {
				const currentClosest: string | null = closestCTA != null ? (closestCTA as CTAMesh).name : null;
				const prevClosest = prevClosestCTANameRef.current;
				prevClosestCTANameRef.current = currentClosest;

				const elapsedTime = clock.getElapsedTime();
				const pulse = (Math.sin(elapsedTime * CTA_GLOW_PULSE_SPEED) + 1) * 0.5 * CTA_GLOW_PULSE_MAX;
				const lasersPulse = (Math.sin(elapsedTime * CTA_GLOW_PULSE_SPEED) + 1) * 0.5 * LASERS_GLOW_PULSE_MAX;

				ctas.forEach(({ ref, name }) => {
					if (!ref.current) return;
					const isNowClosest = name === currentClosest;
					const wasClosest = name === prevClosest;
					if (isNowClosest) {
						setCTAGlowIntensity(ref.current, name, pulse);
					} else if (wasClosest) {
						setCTAGlowIntensity(ref.current, name, CTA_GLOW_REST);
					}
				});

				if (lasersRef.current && !doorOpen) {
					const nearLasers = distToLasers < LASERS_PROXIMITY_DISTANCE;
					setLasersGlowIntensity(lasersRef.current, nearLasers ? lasersPulse : LASERS_GLOW_REST);
				}
			}
		}

		// Portal sprites: pin to CTA world X/Z (flat on ground), visible only in main.
		if (CTA_PORTAL_ENABLED && currentScene === "main") {
			portalFrameTimerRef.current += delta;
			const frameDuration = 1 / Math.max(1, CTA_PORTAL_FPS);
			if (portalFrameTimerRef.current >= frameDuration) {
				portalFrameTimerRef.current = 0;
				portalFrameRef.current = (portalFrameRef.current + 1) % CTA_PORTAL_TOTAL_FRAMES;
				const frame = portalFrameRef.current;
				const col = frame % CTA_PORTAL_COLS;
				const row = Math.floor(frame / CTA_PORTAL_COLS);
				portalTexture.offset.x = col / CTA_PORTAL_COLS;
				portalTexture.offset.y = 1 - (row + 1) / CTA_PORTAL_ROWS;
			}
			ctas.forEach(({ ref }, index) => {
				const mesh = portalMeshRefs.current[index];
				if (!mesh) return;
				if (ref.current) {
					ref.current.updateMatrixWorld(true);
					ref.current.getWorldPosition(portalPosRef.current);
					mesh.position.set(portalPosRef.current.x, CTA_PORTAL_Y, portalPosRef.current.z);
					mesh.visible = true;
				} else {
					mesh.visible = false;
				}
			});
		}
	});

	return (
		<group visible={CTA_PORTAL_ENABLED && currentScene === "main"}>
			{ctas.map((cta, index) => (
				<mesh
					key={`cta-portal-${cta.name}`}
					ref={(el) => {
						portalMeshRefs.current[index] = el;
					}}
					userData={{ isDecoration: true }}
					rotation={[-Math.PI / 2, 0, 0]}
					visible={false}
				>
					<planeGeometry args={[CTA_PORTAL_SIZE, CTA_PORTAL_SIZE]} />
					<meshBasicMaterial
						map={portalTexture}
						transparent
						opacity={CTA_PORTAL_OPACITY}
						depthWrite={false}
						blending={THREE.AdditiveBlending}
					/>
				</mesh>
			))}
		</group>
	);
};

// Provider component
export const ProximityProvider = ({ children }: { children: React.ReactNode }) => {
	const [nearbyCTA, setNearbyCTA] = useState<CTAMesh | null>(null);
	const [nearLasers, setNearLasers] = useState(false);

	return (
		<ProximityContext.Provider value={{ nearbyCTA, setNearbyCTA, nearLasers, setNearLasers }}>
			{children}
		</ProximityContext.Provider>
	);
};
