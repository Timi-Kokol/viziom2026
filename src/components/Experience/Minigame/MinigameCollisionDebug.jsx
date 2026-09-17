"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameplayPaused } from "../GameplayPausedContext";

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

/** Build LineSegments geometry for mesh triangles in world space (for debug viz). */
function buildTriangleWireframeGeometry(mesh) {
	const geo = mesh.geometry;
	const pos = geo.getAttribute("position");
	if (!pos) return null;
	const index = geo.index;
	const matrixWorld = mesh.matrixWorld;
	const vertices = [];
	let i = 0;
	const count = index ? index.count : pos.count;
	while (i < count) {
		const i0 = index ? index.getX(i) : i;
		const i1 = index ? index.getX(i + 1) : i + 1;
		const i2 = index ? index.getX(i + 2) : i + 2;
		_v1.fromBufferAttribute(pos, i0).applyMatrix4(matrixWorld);
		_v2.fromBufferAttribute(pos, i1).applyMatrix4(matrixWorld);
		_v3.fromBufferAttribute(pos, i2).applyMatrix4(matrixWorld);
		vertices.push(_v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z);
		vertices.push(_v2.x, _v2.y, _v2.z, _v3.x, _v3.y, _v3.z);
		vertices.push(_v3.x, _v3.y, _v3.z, _v1.x, _v1.y, _v1.z);
		i += 3;
	}
	if (vertices.length === 0) return null;
	const geom = new THREE.BufferGeometry();
	geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geom.computeBoundingSphere();
	return geom;
}

/**
 * Draws collision debug in the minigame (dev only): cyan wireframes for the
 * actual mesh triangle geometry used for collision (name contains "collision").
 * Set enabled={true} to show the debug overlay (default: false).
 */
export default function MinigameCollisionDebug({
	currentScene = "main",
	enabled = false,
}) {
	const { scene } = useThree();
	const groupRef = useRef(null);
	const addedRef = useRef(false);
	const helpersRef = useRef(new Map()); // mesh.uuid -> lineHelper

	useEffect(() => {
		return () => {
			if (!groupRef.current) return;
			helpersRef.current.forEach((lineHelper) => {
				if (lineHelper?.geometry) lineHelper.geometry.dispose();
				if (lineHelper?.material) lineHelper.material.dispose();
			});
			helpersRef.current.clear();
			if (addedRef.current) {
				scene.remove(groupRef.current);
				addedRef.current = false;
			}
		};
	}, [scene]);

	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		if (!enabled) return;
		if (typeof process !== "undefined" && process.env.NODE_ENV !== "development") return;
		if (currentScene !== "minigame") {
			if (addedRef.current) {
				scene.remove(groupRef.current);
				addedRef.current = false;
			}
			return;
		}

		if (!groupRef.current) groupRef.current = new THREE.Group();
		if (!addedRef.current) {
			scene.add(groupRef.current);
			addedRef.current = true;
		}

		const meshes = [];
		scene.traverse((obj) => {
			if (obj.isMesh && obj.name && obj.name.toLowerCase().includes("collision")) {
				meshes.push(obj);
			}
		});

		const seen = new Set(meshes.map((m) => m.uuid));

		helpersRef.current.forEach((lineHelper, uuid) => {
			if (!seen.has(uuid)) {
				groupRef.current.remove(lineHelper);
				if (lineHelper.geometry) lineHelper.geometry.dispose();
				if (lineHelper.material) lineHelper.material.dispose();
				helpersRef.current.delete(uuid);
			}
		});

		meshes.forEach((mesh) => {
			mesh.updateMatrixWorld(true);
			const lineGeom = buildTriangleWireframeGeometry(mesh);
			let lineHelper = helpersRef.current.get(mesh.uuid);
			if (lineGeom) {
				if (lineHelper) {
					lineHelper.geometry.dispose();
					lineHelper.geometry = lineGeom;
				} else {
					lineHelper = new THREE.LineSegments(
						lineGeom,
						new THREE.LineBasicMaterial({ color: 0x00ffff, depthTest: false })
					);
					groupRef.current.add(lineHelper);
					helpersRef.current.set(mesh.uuid, lineHelper);
				}
				lineHelper.visible = true;
			} else if (lineHelper) {
				lineHelper.visible = false;
			}
		});
	});

	return null;
}
