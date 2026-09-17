/**
 * Minigame collision: AABB vs mesh geometry (triangle narrow phase).
 * Uses broad phase (AABB vs AABB) then narrow phase (AABB vs each triangle in world space).
 * Based on Akenine-Möller triangle-box overlap (13 separating axes).
 */

import * as THREE from "three";

// Reusable vectors to avoid allocations in hot path
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _norm = new THREE.Vector3();
const _t1 = new THREE.Vector3();
const _t2 = new THREE.Vector3();

function checkBoxSeparation(minX, minY, minZ, maxX, maxY, maxZ, norm, v1, v2, v3) {
	const minQ =
		norm.x * (norm.x > 0 ? minX : maxX) +
		norm.y * (norm.y > 0 ? minY : maxY) +
		norm.z * (norm.z > 0 ? minZ : maxZ);
	const maxQ =
		norm.x * (norm.x > 0 ? maxX : minX) +
		norm.y * (norm.y > 0 ? maxY : minY) +
		norm.z * (norm.z > 0 ? maxZ : minZ);
	const q1 = norm.x * v1.x + norm.y * v1.y + norm.z * v1.z;
	const q2 = norm.x * v2.x + norm.y * v2.y + norm.z * v2.z;
	const q3 = norm.x * v3.x + norm.y * v3.y + norm.z * v3.z;
	const vMinQ = Math.min(q1, q2, q3);
	const vMaxQ = Math.max(q1, q2, q3);
	return minQ > vMaxQ || maxQ < vMinQ;
}

function edgeAxis(axis, minX, minY, minZ, maxX, maxY, maxZ, v1, v2, v3, t1) {
	t1.subVectors(v1, v2);
	switch (axis) {
		case 0:
			t1.set(0, -t1.z, t1.y);
			break;
		case 1:
			t1.set(-t1.z, 0, t1.x);
			break;
		case 2:
			t1.set(-t1.y, t1.x, 0);
			break;
	}
	return checkBoxSeparation(minX, minY, minZ, maxX, maxY, maxZ, t1, v1, v2, v3);
}

/**
 * Returns true if the AABB overlaps the triangle (v1, v2, v3) in world space.
 */
export function boxIntersectsTriangle(box, v1, v2, v3) {
	const minX = box.min.x;
	const minY = box.min.y;
	const minZ = box.min.z;
	const maxX = box.max.x;
	const maxY = box.max.y;
	const maxZ = box.max.z;

	// Triangle AABB cull
	const vMinX = Math.min(v1.x, v2.x, v3.x);
	const vMinY = Math.min(v1.y, v2.y, v3.y);
	const vMinZ = Math.min(v1.z, v2.z, v3.z);
	const vMaxX = Math.max(v1.x, v2.x, v3.x);
	const vMaxY = Math.max(v1.y, v2.y, v3.y);
	const vMaxZ = Math.max(v1.z, v2.z, v3.z);
	if (vMinX > maxX || vMinY > maxY || vMinZ > maxZ || vMaxX < minX || vMaxY < minY || vMaxZ < minZ) {
		return false;
	}

	_t1.subVectors(v2, v1);
	_t2.subVectors(v3, v1);
	_norm.crossVectors(_t1, _t2);

	if (
		checkBoxSeparation(minX, minY, minZ, maxX, maxY, maxZ, _norm, v1, v2, v3) ||
		edgeAxis(0, minX, minY, minZ, maxX, maxY, maxZ, v1, v2, v3, _t1) ||
		edgeAxis(0, minX, minY, minZ, maxX, maxY, maxZ, v1, v3, v2, _t1) ||
		edgeAxis(0, minX, minY, minZ, maxX, maxY, maxZ, v2, v3, v1, _t1) ||
		edgeAxis(1, minX, minY, minZ, maxX, maxY, maxZ, v1, v2, v3, _t1) ||
		edgeAxis(1, minX, minY, minZ, maxX, maxY, maxZ, v1, v3, v2, _t1) ||
		edgeAxis(1, minX, minY, minZ, maxX, maxY, maxZ, v2, v3, v1, _t1) ||
		edgeAxis(2, minX, minY, minZ, maxX, maxY, maxZ, v1, v2, v3, _t1) ||
		edgeAxis(2, minX, minY, minZ, maxX, maxY, maxZ, v1, v3, v2, _t1) ||
		edgeAxis(2, minX, minY, minZ, maxX, maxY, maxZ, v2, v3, v1, _t1)
	) {
		return false;
	}
	return true;
}

/**
 * Returns true if the given AABB overlaps any triangle of the mesh's geometry in world space.
 * Uses broad phase (box vs mesh AABB) first; meshBoxTemp is reused to avoid allocations.
 */
export function boxOverlapsMeshGeometry(box, mesh, meshBoxTemp) {
	if (!mesh.geometry) return false;
	mesh.updateMatrixWorld(true);
	if (meshBoxTemp) {
		meshBoxTemp.setFromObject(mesh);
		if (!box.intersectsBox(meshBoxTemp)) return false;
	} else {
		const temp = new THREE.Box3().setFromObject(mesh);
		if (!box.intersectsBox(temp)) return false;
	}

	const geo = mesh.geometry;
	const pos = geo.getAttribute("position");
	if (!pos) return false;
	const index = geo.index;
	const matrixWorld = mesh.matrixWorld;

	let i = 0;
	const count = index ? index.count : pos.count;
	while (i < count) {
		const i0 = index ? index.getX(i) : i;
		const i1 = index ? index.getX(i + 1) : i + 1;
		const i2 = index ? index.getX(i + 2) : i + 2;
		_v1.fromBufferAttribute(pos, i0).applyMatrix4(matrixWorld);
		_v2.fromBufferAttribute(pos, i1).applyMatrix4(matrixWorld);
		_v3.fromBufferAttribute(pos, i2).applyMatrix4(matrixWorld);
		if (boxIntersectsTriangle(box, _v1, _v2, _v3)) return true;
		i += 3;
	}
	return false;
}
