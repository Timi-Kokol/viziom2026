'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import { useIsMobile } from '@/utils/useResponsive';
import { PROJECTS } from '@/content/projects';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uGrid;
uniform float uAmt;
uniform float uSkew;
uniform float uFillMin;
uniform float uDropout;
uniform float uDim;
uniform float uTexAspect;
uniform float uPlaneAspect;
uniform vec2 uPointer;
uniform vec2 uTrail;
uniform vec2 uWake;
uniform float uHover;
uniform float uHoverRadius;
uniform float uHoverPush;
uniform float uHoverShrink;
uniform float uHoverSpin;
uniform float uHoverLift;
uniform float uHoverWake;
uniform float uHoverMax;

vec2 coverUv(vec2 uv) {
  float rs = max(uPlaneAspect, 0.001);
  float ri = max(uTexAspect, 0.001);
  vec2 s = ri > rs ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return clamp((uv - 0.5) * s + 0.5, 0.0, 1.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 g = vUv * uGrid;
  vec2 cellId = floor(g);
  vec2 f = fract(g);
  vec2 uvCell = (cellId + 0.5) / uGrid;

  float rnd = hash(cellId + 0.5);
  float jitter = mix(0.55, 1.45, hash(cellId + 7.3));
  float lag = hash(cellId + 3.1);

  // Each tile tracks a slightly older pointer position, so the cluster drags
  // behind the cursor and keeps swirling after it stops.
  vec2 ptr = mix(uPointer, uTrail, lag) * 0.5 + 0.5;
  vec2 toPtr = (uvCell - ptr) * vec2(uPlaneAspect, 1.0);
  float dist = length(toPtr);
  float near = 1.0 - smoothstep(uHoverRadius * 0.35, uHoverRadius, dist);
  float hv = uHover * near * near;

  // Cards further from the active slot dissolve harder, and each one keeps
  // dissolving across its own width, away from the active card.
  float gx = uSkew >= 0.0 ? vUv.x : 1.0 - vUv.x;
  float amt = clamp(uAmt * mix(0.85, 1.2, gx), 0.0, 1.0);
  float t = smoothstep(0.03, 0.42, max(amt, hv));

  float fill = mix(1.0, uFillMin, t) * mix(1.0, uHoverShrink, hv);

  // Tiles shove away from the cursor and trail along its motion, then spin.
  // Displacement is capped to keep a tile roughly within its own cell.
  vec2 dir = dist > 0.0001 ? toPtr / dist : vec2(0.0);
  vec2 push = (dir * uHoverPush + uWake * uHoverWake) * hv * jitter;
  push *= min(1.0, uHoverMax / max(length(push), 0.00001));

  float ang = hv * uHoverSpin * (rnd * 2.0 - 1.0);
  float ca = cos(ang);
  float sa = sin(ang);
  vec2 fc = f - 0.5 - push;
  fc = mat2(ca, -sa, sa, ca) * fc;

  float box = step(max(abs(fc.x), abs(fc.y)), fill * 0.5);
  float thin = clamp((amt - 0.45) * 1.8, 0.0, 1.0) * uDropout;
  float mask = box * step(thin, rnd);

  vec3 col = mix(texture2D(uMap, coverUv(vUv)).rgb, texture2D(uMap, coverUv(uvCell)).rgb, t);
  col *= mix(1.0, uDim, t);
  col *= 1.0 + hv * uHoverLift;

  gl_FragColor = vec4(col, mix(1.0, mask, t));
}
`;

const CLICK_DRAG = 10;
const PLANE = new THREE.PlaneGeometry(1, 1);
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

const SETTINGS = {
	cardScale: 0.72,
	cardAspect: 1,
	gap: 12,
	padTop: 0,
	cell: 16,
	fillMin: 0.62,
	dropout: 0.62,
	dim: 0.88,
	rampSlots: 2,
	dragDissolve: 0.34,
	decay: 0.986,
	snap: 8,
	maxVel: 6,
	flickLead: 0.2,
	maxFlick: 2,
	settleMs: 90,
	spinIn: 16,
	spinOut: 3.4,
	spinMin: 0.25,
	spinMax: 3,
	hoverRadius: 0.15,
	hoverPush: 0.7,
	hoverShrink: 2,
	hoverSpin: 0,
	hoverLift: 0.35,
	hoverWake: 0.42,
	hoverMax: 0.45,
	// Underdamped on purpose so the cluster overshoots and settles back;
	// critical damping here would be about 2 * sqrt(hoverStiff).
	hoverStiff: 260,
	hoverDamp: 13,
	hoverTrail: 6.5,
	wakeScale: 0.11,
};

function wrapDelta(index, current, count) {
	let d = index - current;
	d -= Math.round(d / count) * count;
	return d;
}

function wrapIndex(index, count) {
	return ((index % count) + count) % count;
}

// The active card sits at the content inset, so earlier slides peek into the
// gutter on its left. LEFT_SLACK reserves enough slots there that the
// wrap-around jump always happens off screen. The strip repeats the projects
// twice so a wide viewport never runs out of slots to the right either.
const LEFT_SLACK = 2;

function slotOffset(slotKey, current, slots) {
	const d = slotKey - current + LEFT_SLACK;
	return (((d % slots) + slots) % slots) - LEFT_SLACK;
}

function measure(settings, width, height, slots, inset) {
	const cardH = Math.max(height * settings.cardScale, 40);
	// Enough slots to the right of the inset to cover the canvas...
	const fillRight = (width - inset) / Math.max(slots - LEFT_SLACK, 1) - settings.gap;
	// ...and wide enough that the leftmost slack slot clears the left edge.
	const clearLeft = inset - LEFT_SLACK * settings.gap + 1;
	const cardW = Math.max(cardH * settings.cardAspect, fillRight, clearLeft);
	return { cardW, cardH, slot: cardW + settings.gap };
}

function Slide({
	texture,
	index,
	slotKey,
	slots,
	currentRef,
	interactingRef,
	count,
	hitIndexRef,
	cardHoverRef,
	hoverHotRef,
	viewRectRef,
	spinAmtRef,
	settingsRef,
	layoutRef,
}) {
	const meshRef = useRef(null);
	const hoverAim = useRef({ x: 0, y: 0 });
	const hoverPtr = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, amt: 0 });
	const { camera, size } = useThree();

	const uniforms = useMemo(
		() => ({
			uMap: { value: texture },
			uGrid: { value: new THREE.Vector2(24, 24) },
			uAmt: { value: 0 },
			uSkew: { value: 1 },
			uFillMin: { value: SETTINGS.fillMin },
			uDropout: { value: SETTINGS.dropout },
			uDim: { value: SETTINGS.dim },
			uTexAspect: { value: 1 },
			uPlaneAspect: { value: 1 },
			uPointer: { value: new THREE.Vector2(0, 0) },
			uTrail: { value: new THREE.Vector2(0, 0) },
			uWake: { value: new THREE.Vector2(0, 0) },
			uHover: { value: 0 },
			uHoverRadius: { value: SETTINGS.hoverRadius },
			uHoverPush: { value: SETTINGS.hoverPush },
			uHoverShrink: { value: SETTINGS.hoverShrink },
			uHoverSpin: { value: SETTINGS.hoverSpin },
			uHoverLift: { value: SETTINGS.hoverLift },
			uHoverWake: { value: SETTINGS.hoverWake },
			uHoverMax: { value: SETTINGS.hoverMax },
		}),
		[texture],
	);

	const material = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms,
				vertexShader: VERT,
				fragmentShader: FRAG,
				transparent: true,
				depthWrite: false,
				depthTest: false,
				toneMapped: false,
			}),
		[uniforms],
	);

	useEffect(() => {
		const img = texture.image;
		if (img?.width && img?.height) uniforms.uTexAspect.value = img.width / img.height;
		return () => material.dispose();
	}, [material, texture, uniforms]);

	useFrame((_, dt) => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const s = settingsRef.current;
		const frameDt = Math.min(dt, 0.05);
		const inset = layoutRef.current.inset;
		const { cardW, cardH, slot } = measure(s, size.width, size.height, slots, inset);
		layoutRef.current.slot = slot;

		const off = slotOffset(slotKey, currentRef.current, slots);
		mesh.scale.set(cardW, cardH, 1);
		mesh.position.set(
			-size.width / 2 + inset + cardW / 2 + off * slot,
			size.height / 2 - s.padTop - cardH / 2,
			0,
		);

		uniforms.uGrid.value.set(
			Math.max(Math.round(cardW / s.cell), 3),
			Math.max(Math.round(cardH / s.cell), 3),
		);
		uniforms.uPlaneAspect.value = cardW / Math.max(cardH, 1);
		uniforms.uFillMin.value = s.fillMin;
		uniforms.uDropout.value = s.dropout;
		uniforms.uDim.value = s.dim;
		uniforms.uHoverRadius.value = s.hoverRadius;
		uniforms.uHoverPush.value = s.hoverPush;
		uniforms.uHoverShrink.value = s.hoverShrink;
		uniforms.uHoverSpin.value = s.hoverSpin;
		uniforms.uHoverLift.value = s.hoverLift;
		uniforms.uHoverWake.value = s.hoverWake;
		uniforms.uHoverMax.value = s.hoverMax;

		// Dissolve grows with distance from the active slot in either direction, and
		// each card fades away from the active one across its own width.
		const spread = THREE.MathUtils.clamp(Math.abs(off), 0, s.rampSlots) / Math.max(s.rampSlots, 0.001);
		uniforms.uAmt.value = Math.max(spread, (spinAmtRef?.current ?? 0) * s.dragDissolve);
		uniforms.uSkew.value = off < 0 ? -1 : 1;

		const isActive = Math.abs(off) < 0.35;
		let hovering = false;
		const bridge = cardHoverRef?.current;
		if (isActive && bridge?.on && !interactingRef.current) {
			const rect = viewRectRef.current;
			_ndc.set(
				((bridge.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
				-((bridge.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
			);
			_raycaster.setFromCamera(_ndc, camera);
			const hit = _raycaster.intersectObject(mesh)[0];
			if (hit?.uv) {
				hovering = true;
				hoverAim.current.x = hit.uv.x * 2 - 1;
				hoverAim.current.y = hit.uv.y * 2 - 1;
			} else if (bridge.overMeta) {
				hovering = true;
				hoverAim.current.x = THREE.MathUtils.clamp(_ndc.x * 1.6, -0.9, 0.9);
				hoverAim.current.y = -0.85;
			}
		}
		if (hovering) hoverHotRef.current = true;

		const h = hoverPtr.current;
		if (hovering && h.amt < 0.01) {
			h.x = hoverAim.current.x;
			h.y = hoverAim.current.y;
			h.tx = h.x;
			h.ty = h.y;
			h.vx = 0;
			h.vy = 0;
		}
		h.amt = THREE.MathUtils.damp(h.amt, hovering ? 1 : 0, hovering ? 11 : 5, frameDt);

		// Spring toward the cursor rather than easing to it, so the cluster
		// overshoots, swings back and keeps moving for a moment after it stops.
		h.vx += (hoverAim.current.x - h.x) * s.hoverStiff * frameDt;
		h.vy += (hoverAim.current.y - h.y) * s.hoverStiff * frameDt;
		const drag = Math.exp(-s.hoverDamp * frameDt);
		h.vx *= drag;
		h.vy *= drag;
		h.x += h.vx * frameDt;
		h.y += h.vy * frameDt;
		h.tx = THREE.MathUtils.damp(h.tx, h.x, s.hoverTrail, frameDt);
		h.ty = THREE.MathUtils.damp(h.ty, h.y, s.hoverTrail, frameDt);

		uniforms.uPointer.value.set(h.x, h.y);
		uniforms.uTrail.value.set(h.tx, h.ty);
		uniforms.uWake.value.set(
			THREE.MathUtils.clamp(h.vx * s.wakeScale, -1, 1),
			THREE.MathUtils.clamp(h.vy * s.wakeScale, -1, 1),
		);
		uniforms.uHover.value = isActive ? h.amt : 0;
		mesh.renderOrder = 20 - Math.round(Math.abs(off));
	});

	return (
		<mesh
			ref={meshRef}
			geometry={PLANE}
			material={material}
			frustumCulled={false}
			onPointerDown={() => {
				hitIndexRef.current = index;
			}}
			onPointerOver={() => {
				const current = wrapIndex(Math.round(currentRef.current), count);
				document.body.style.cursor = index === current ? 'pointer' : 'grab';
			}}
			onPointerOut={() => {
				document.body.style.cursor = '';
			}}
		/>
	);
}

function FrameEnd({ hoverHotRef, onCardHover, emitActive }) {
	const prev = useRef(false);
	useFrame(() => {
		emitActive();
		const hot = Boolean(hoverHotRef.current);
		hoverHotRef.current = false;
		if (hot === prev.current) return;
		prev.current = hot;
		onCardHover?.(hot);
	});
	return null;
}

function Scene({
	currentRef,
	dirRef,
	velocityRef,
	interactingRef,
	keyTargetRef,
	count,
	hitIndexRef,
	cardHoverRef,
	onCardHover,
	hoverHotRef,
	viewRectRef,
	emitActive,
	spinAmtRef,
	settingsRef,
	layoutRef,
}) {
	const lastCurrentRef = useRef(currentRef.current);
	const textures = useTexture(
		PROJECTS.map((p) => p.image),
		(loaded) => {
			const list = Array.isArray(loaded) ? loaded : [loaded];
			list.forEach((tex) => {
				tex.colorSpace = THREE.NoColorSpace;
				tex.minFilter = THREE.LinearFilter;
				tex.magFilter = THREE.LinearFilter;
				tex.generateMipmaps = false;
				tex.anisotropy = 4;
				tex.needsUpdate = true;
			});
		},
	);

	useFrame((_, dt) => {
		const s = settingsRef.current;
		const clampedDt = Math.min(dt, 0.05);

		if (!interactingRef.current) {
			const keyTarget = keyTargetRef.current;
			if (keyTarget != null) {
				currentRef.current = THREE.MathUtils.damp(currentRef.current, keyTarget, s.snap, clampedDt);
				if (Math.abs(currentRef.current - keyTarget) < 0.004) {
					currentRef.current = keyTarget;
					keyTargetRef.current = null;
				}
				velocityRef.current = 0;
			} else {
				let velocity = velocityRef.current;
				velocity *= Math.pow(s.decay, clampedDt * 60);
				currentRef.current += velocity * clampedDt;

				if (Math.abs(velocity) < 0.5) {
					const snap = Math.round(currentRef.current);
					currentRef.current = THREE.MathUtils.damp(currentRef.current, snap, s.snap, clampedDt);
					velocity *= 0.9;
				}

				velocityRef.current = THREE.MathUtils.clamp(velocity, -s.maxVel, s.maxVel);
			}
		}

		const delta = currentRef.current - lastCurrentRef.current;
		lastCurrentRef.current = currentRef.current;
		if (Math.abs(delta) > 0.00001) dirRef.current = Math.sign(delta) || dirRef.current;

		const fromDelta = Math.abs(delta) / Math.max(clampedDt, 1 / 240);
		const raw = Math.max(fromDelta, Math.abs(velocityRef.current));
		const target = THREE.MathUtils.smoothstep(s.spinMin, s.spinMax, raw);
		const ease = target > spinAmtRef.current ? s.spinIn : s.spinOut;
		spinAmtRef.current = THREE.MathUtils.damp(spinAmtRef.current, target, ease, clampedDt);
	}, -1);

	const list = Array.isArray(textures) ? textures : [textures];

	useEffect(() => {
		list.forEach((tex) => {
			if (!tex) return;
			tex.colorSpace = THREE.NoColorSpace;
			tex.generateMipmaps = false;
			tex.needsUpdate = true;
		});
	}, [list]);

	return (
		<>
			{Array.from({ length: count * 2 }, (_, k) => (
				<Slide
					key={`${PROJECTS[k % count].id}-${k}`}
					texture={list[k % count]}
					index={k % count}
					slotKey={k}
					slots={count * 2}
					currentRef={currentRef}
					interactingRef={interactingRef}
					count={count}
					hitIndexRef={hitIndexRef}
					cardHoverRef={cardHoverRef}
					hoverHotRef={hoverHotRef}
					viewRectRef={viewRectRef}
					spinAmtRef={spinAmtRef}
					settingsRef={settingsRef}
					layoutRef={layoutRef}
				/>
			))}
			<FrameEnd hoverHotRef={hoverHotRef} onCardHover={onCardHover} emitActive={emitActive} />
		</>
	);
}

export default function ProjectsCarousel({ activeIndex, onActiveChange, cardHoverRef, onCardHover, onSelect }) {
	const isCompact = useIsMobile();
	const settingsRef = useRef(SETTINGS);
	settingsRef.current = SETTINGS;
	const wrapRef = useRef(null);
	const { triggerPress } = useHaptics();
	const currentRef = useRef(activeIndex);
	const velocityRef = useRef(0);
	const dirRef = useRef(1);
	const interactingRef = useRef(false);
	const lastXRef = useRef(0);
	const lastTRef = useRef(0);
	const movedRef = useRef(false);
	const hitIndexRef = useRef(null);
	const startXRef = useRef(0);
	const pointerDownRef = useRef(false);
	const lastIndexRef = useRef(activeIndex);
	const keyTargetRef = useRef(null);
	const hoverHotRef = useRef(false);
	const spinAmtRef = useRef(0);
	const layoutRef = useRef({ slot: 400, inset: 0 });
	const insetRef = useRef(null);
	const viewRectRef = useRef({ left: 0, top: 0, width: 1, height: 1 });
	const count = PROJECTS.length;

	const syncViewRect = useCallback(() => {
		const probe = insetRef.current;
		if (probe) layoutRef.current.inset = probe.getBoundingClientRect().width;
		const canvas = wrapRef.current?.querySelector('canvas');
		if (!canvas) return;
		const r = canvas.getBoundingClientRect();
		const rect = viewRectRef.current;
		rect.left = r.left;
		rect.top = r.top;
		rect.width = r.width;
		rect.height = r.height;
	}, []);

	const emitActive = useCallback(() => {
		// Hold the title still while the pointer is down so two names never
		// fight mid-drag. On release, jump to the slot we are snapping to.
		if (interactingRef.current) return;
		const target = keyTargetRef.current;
		const next = wrapIndex(Math.round(target != null ? target : currentRef.current), count);
		if (next !== lastIndexRef.current) {
			lastIndexRef.current = next;
			onActiveChange(next);
		}
	}, [count, onActiveChange]);

	const pick = useCallback(
		(index) => {
			if (movedRef.current) return;
			const current = wrapIndex(Math.round(currentRef.current), count);
			if (index === current) {
				getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
				triggerPress();
				onSelect?.();
				return;
			}
			const delta = wrapDelta(index, current, count);
			const from = keyTargetRef.current ?? Math.round(currentRef.current);
			keyTargetRef.current = from + delta;
			velocityRef.current = 0;
			dirRef.current = Math.sign(delta) || dirRef.current;
		},
		[count, triggerPress, onSelect],
	);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) return;

		syncViewRect();
		const ro = new ResizeObserver(syncViewRect);
		ro.observe(el);
		window.addEventListener('scroll', syncViewRect, true);

		let wheelTimer = 0;

		// Turn whatever momentum is left into a concrete slot target so the strip
		// always lands flush instead of coasting to a stop.
		const settle = () => {
			const s = settingsRef.current;
			const base = Math.round(currentRef.current);
			const projected = Math.round(currentRef.current + velocityRef.current * s.flickLead);
			keyTargetRef.current = THREE.MathUtils.clamp(
				projected,
				base - s.maxFlick,
				base + s.maxFlick,
			);
			velocityRef.current = 0;
		};

		const onPointerDown = (e) => {
			if (e.button !== 0) return;
			syncViewRect();
			pointerDownRef.current = true;
			movedRef.current = false;
			interactingRef.current = false;
			startXRef.current = e.clientX;
			lastXRef.current = e.clientX;
			lastTRef.current = performance.now();
			velocityRef.current = 0;
		};

		const onPointerMove = (e) => {
			if (!pointerDownRef.current || e.buttons === 0) return;
			const totalDx = e.clientX - startXRef.current;
			if (!movedRef.current) {
				if (Math.abs(totalDx) < CLICK_DRAG) return;
				movedRef.current = true;
				interactingRef.current = true;
				keyTargetRef.current = null;
				lastXRef.current = e.clientX;
				el.setPointerCapture(e.pointerId);
				el.style.cursor = 'grabbing';
				return;
			}
			const s = settingsRef.current;
			const slot = Math.max(layoutRef.current.slot, 1);
			const now = performance.now();
			const dt = Math.max(0.008, (now - lastTRef.current) / 1000);
			const dx = e.clientX - lastXRef.current;
			lastXRef.current = e.clientX;
			lastTRef.current = now;
			const step = -dx / slot;
			currentRef.current += step;
			velocityRef.current = THREE.MathUtils.clamp(step / dt, -s.maxVel, s.maxVel);
		};

		const onPointerUp = (e) => {
			const hit = hitIndexRef.current;
			const wasClick = pointerDownRef.current && !movedRef.current;
			pointerDownRef.current = false;
			interactingRef.current = false;
			el.style.cursor = '';
			try {
				el.releasePointerCapture(e.pointerId);
			} catch {
				/* already released */
			}
			if (wasClick) {
				velocityRef.current = 0;
				pick(hit != null ? hit : wrapIndex(Math.round(currentRef.current), count));
				hitIndexRef.current = null;
				return;
			}
			hitIndexRef.current = null;
			settle();
		};

		const onKeyDown = (e) => {
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			if (e.repeat) return;
			const tag = e.target?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
			e.preventDefault();
			const dir = e.key === 'ArrowRight' ? 1 : -1;
			const from = keyTargetRef.current ?? Math.round(currentRef.current);
			keyTargetRef.current = from + dir;
			velocityRef.current = 0;
			dirRef.current = dir;
		};

		const onWheel = (e) => {
			if (Math.abs(e.deltaX) < 8) return;
			e.preventDefault();
			const s = settingsRef.current;
			const slot = Math.max(layoutRef.current.slot, 1);
			const step = e.deltaX / slot;
			// Treated like a drag: follow the wheel exactly, then snap once it stops.
			interactingRef.current = true;
			keyTargetRef.current = null;
			currentRef.current += step;
			velocityRef.current = THREE.MathUtils.clamp(step * 14, -s.maxVel, s.maxVel);
			dirRef.current = Math.sign(e.deltaX) || dirRef.current;
			window.clearTimeout(wheelTimer);
			wheelTimer = window.setTimeout(() => {
				interactingRef.current = false;
				settle();
			}, s.settleMs);
		};

		el.addEventListener('pointerdown', onPointerDown, true);
		el.addEventListener('pointermove', onPointerMove);
		el.addEventListener('pointerup', onPointerUp);
		el.addEventListener('pointercancel', onPointerUp);
		el.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('keydown', onKeyDown);
		return () => {
			ro.disconnect();
			window.clearTimeout(wheelTimer);
			window.removeEventListener('scroll', syncViewRect, true);
			document.body.style.cursor = '';
			el.removeEventListener('pointerdown', onPointerDown, true);
			el.removeEventListener('pointermove', onPointerMove);
			el.removeEventListener('pointerup', onPointerUp);
			el.removeEventListener('pointercancel', onPointerUp);
			el.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [count, pick, syncViewRect]);

	return (
		<div
			ref={wrapRef}
			tabIndex={0}
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				touchAction: 'pan-y',
				outline: 'none',
			}}
		>
			{/* Resolves --content-inset to pixels so the active card can line up with
			    the hero copy and the project meta. */}
			<span
				ref={insetRef}
				aria-hidden
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: 'var(--content-inset, 0px)',
					height: 0,
					pointerEvents: 'none',
				}}
			/>
			<Canvas
				flat
				linear
				orthographic
				dpr={isCompact ? [1, 1.25] : [1, 1.75]}
				gl={{
					alpha: false,
					antialias: false,
					powerPreference: 'high-performance',
					outputColorSpace: THREE.LinearSRGBColorSpace,
					toneMapping: THREE.NoToneMapping,
					stencil: false,
				}}
				camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
				onCreated={({ gl }) => {
					gl.toneMapping = THREE.NoToneMapping;
					gl.outputColorSpace = THREE.LinearSRGBColorSpace;
					gl.setClearColor(0x000000, 1);
					syncViewRect();
				}}
				style={{ width: '100%', height: '100%', background: '#000' }}
			>
				<Suspense fallback={null}>
					<Scene
						currentRef={currentRef}
						dirRef={dirRef}
						velocityRef={velocityRef}
						interactingRef={interactingRef}
						keyTargetRef={keyTargetRef}
						count={count}
						hitIndexRef={hitIndexRef}
						cardHoverRef={cardHoverRef}
						onCardHover={onCardHover}
						hoverHotRef={hoverHotRef}
						viewRectRef={viewRectRef}
						emitActive={emitActive}
						spinAmtRef={spinAmtRef}
						settingsRef={settingsRef}
						layoutRef={layoutRef}
					/>
				</Suspense>
			</Canvas>
		</div>
	);
}
