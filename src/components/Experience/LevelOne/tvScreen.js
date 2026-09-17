import * as THREE from "three";

const CANVAS_SIZE = 512;

export const SCREEN_SETUPS = [
	{
		id: "minigame",
		material: "screen-mini-game",
		src: "/videos/minigame-video.mp4",
	},
	{
		id: "development",
		material: "screen-development",
		src: "/videos/design-development.mp4",
	},
	{
		id: "3d",
		material: "screen-3d",
		src: "/videos/3d-video.mp4",
	},
];

const sharedById = new Map();
const usersById = new Map();

const meshMaterials = (mesh) => {
	const material = mesh?.material;
	if (!material) return [];
	return Array.isArray(material) ? material : [material];
};

export const findScreenMesh = (root, materialName) => {
	if (!root) return null;

	let found = null;
	root.traverse((child) => {
		if (found || !child.isMesh) return;
		if (child.userData?.screenMaterialName === materialName) {
			found = child;
			return;
		}
		if (meshMaterials(child).some((material) => material?.name === materialName)) {
			found = child;
		}
	});
	return found;
};

const createSharedScreen = (src) => {
	const video = document.createElement("video");
	video.src = src;
	video.loop = true;
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.preload = "metadata";
	video.setAttribute("playsinline", "");
	video.setAttribute("webkit-playsinline", "");
	video.setAttribute("muted", "");

	const canvas = document.createElement("canvas");
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;
	const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	texture.flipY = false;
	if ("channel" in texture) texture.channel = 1;

	const play = () => video.play().catch(() => {});
	const onLoaded = () => play();

	video.addEventListener("loadeddata", onLoaded);

	const playOnInteract = () => play();
	window.addEventListener("pointerdown", playOnInteract, { once: true });
	window.addEventListener("keydown", playOnInteract, { once: true });

	return {
		video,
		texture,
		draw: () => {
			if (!ctx || video.readyState < 2) return;
			ctx.drawImage(video, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
			texture.needsUpdate = true;
		},
		dispose: () => {
			video.removeEventListener("loadeddata", onLoaded);
			window.removeEventListener("pointerdown", playOnInteract);
			window.removeEventListener("keydown", playOnInteract);
			video.pause();
			video.src = "";
			texture.dispose();
		},
	};
};

export const acquireScreenVideo = (id, src) => {
	if (!sharedById.has(id)) sharedById.set(id, createSharedScreen(src));
	usersById.set(id, (usersById.get(id) ?? 0) + 1);
	return sharedById.get(id);
};

export const releaseScreenVideo = (id) => {
	const users = Math.max(0, (usersById.get(id) ?? 0) - 1);
	usersById.set(id, users);
	if (users > 0) return;
	sharedById.get(id)?.dispose();
	sharedById.delete(id);
	usersById.delete(id);
};

export const applyVideoToScreenMesh = (mesh, texture, materialName) => {
	if (!mesh?.isMesh) return null;

	mesh.userData.screenMaterialName = materialName;
	if (!mesh.userData.originalScreenMaterial) {
		mesh.userData.originalScreenMaterial = mesh.material;
	}

	if (mesh.geometry?.attributes?.uv1 && "channel" in texture) {
		texture.channel = 1;
	}

	const material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.FrontSide,
		toneMapped: true,
	});
	mesh.material = material;
	mesh.castShadow = false;
	mesh.receiveShadow = false;
	return material;
};

export const restoreScreenMesh = (mesh, material) => {
	if (!mesh?.isMesh) {
		material?.dispose();
		return;
	}
	const original = mesh.userData.originalScreenMaterial;
	if (original) mesh.material = original;
	material?.dispose();
};
