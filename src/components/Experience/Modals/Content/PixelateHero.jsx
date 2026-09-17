'use client';

import { useEffect, useRef } from 'react';

// ─── Tweakable params ─────────────────────────────────────────────────────────
// Color:     red, black
// Grid:      cellPx, overlap
// Idle:      breatheSpeed/Amount, driftSpeedU/V, driftAmountU/V, morphRate
// Pointer:   pointerFollow, influenceFollow, springRate, falloff, radial, swirl, wake
// Perf:      idleFps, interactFps, sourceMax, sampleTaps (1 = cheaper, 4 = smoother)
const SETTINGS = {
	source: '/pixelate.jpg',
	cellPx: 32,
	overlap: 2,

	red: [240, 0, 4],
	black: [8, 0, 1],

	breatheSpeed: 0.8,
	breatheAmount: 0.13,
	driftSpeedU: 0.14,
	driftSpeedV: 0.11,
	driftAmountU: 0.034,
	driftAmountV: 0.026,
	morphRate: 1.6,

	pointerFollow: 7,
	influenceFollow: 8,
	springRate: 10,
	falloff: 7.5,
	radial: 0.72,
	swirl: 0.55,
	wake: 0.9,

	idleFps: 12,
	interactFps: 60,
	sourceMax: 180,
	sampleTaps: 1,
};

const wrap01 = (n) => n - Math.floor(n);

const PixelateHero = () => {
	const hostRef = useRef(null);
	const canvasRef = useRef(null);

	useEffect(() => {
		const host = hostRef.current;
		const canvas = canvasRef.current;
		if (!host || !canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const {
			source,
			cellPx,
			overlap,
			red,
			black,
			breatheSpeed,
			breatheAmount,
			driftSpeedU,
			driftSpeedV,
			driftAmountU,
			driftAmountV,
			morphRate,
			pointerFollow,
			influenceFollow,
			springRate,
			falloff,
			radial,
			swirl,
			wake,
			idleFps,
			interactFps,
			sourceMax,
			sampleTaps,
		} = SETTINGS;

		let cols = 0;
		let rows = 0;
		let cellW = cellPx;
		let cellH = cellPx;
		let field = null;
		let fieldReady = false;
		let ox = null;
		let oy = null;
		let distSq = null;
		let order = null;
		let src = null;
		let srcW = 0;
		let srcH = 0;
		let imgAspect = 1;
		let raf = 0;
		let lastDraw = 0;
		let start = 0;
		let disposed = false;
		let looping = false;
		let pageVisible = document.visibilityState !== 'hidden';
		let inView = true;
		let tilesMoving = false;

		let pointerX = 0.5;
		let pointerY = 0.5;
		let pointerTargetX = 0.5;
		let pointerTargetY = 0.5;
		let influence = 0;
		let influenceTarget = 0;
		let prevPX = 0.5;
		let prevPY = 0.5;
		let wakeX = 0;
		let wakeY = 0;

		const shouldRun = () =>
			!disposed && !reducedMotion && pageVisible && inView && !!src;

		const stopLoop = () => {
			looping = false;
			if (raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
		};

		const resize = () => {
			const rect = host.getBoundingClientRect();
			const cssW = Math.max(2, Math.floor(rect.width));
			const cssH = Math.max(2, Math.floor(rect.height));
			const nextCols = Math.max(2, Math.round(cssW / cellPx));
			const nextRows = Math.max(2, Math.round(cssH / cellPx));
			if (nextCols === cols && nextRows === rows && canvas.width === cssW && canvas.height === cssH) return;
			cols = nextCols;
			rows = nextRows;
			cellW = cssW / cols;
			cellH = cssH / rows;
			canvas.width = cssW;
			canvas.height = cssH;
			const n = cols * rows;
			field = new Float32Array(n * 3);
			ox = new Float32Array(n);
			oy = new Float32Array(n);
			distSq = new Float32Array(n);
			order = new Array(n);
			for (let i = 0; i < n; i++) order[i] = i;
			fieldReady = false;
			tilesMoving = false;
		};

		const sample = (u, v, tapU, tapV) => {
			if (sampleTaps < 4) {
				const sx = Math.min(srcW - 1, (wrap01(u) * srcW) | 0);
				const sy = Math.min(srcH - 1, (wrap01(v) * srcH) | 0);
				const si = (sy * srcW + sx) * 4;
				return [src[si], src[si + 1], src[si + 2]];
			}
			let r = 0;
			let g = 0;
			let b = 0;
			for (let ty = -1; ty <= 1; ty += 2) {
				for (let tx = -1; tx <= 1; tx += 2) {
					const su = wrap01(u + tx * tapU);
					const sv = wrap01(v + ty * tapV);
					const sx = Math.min(srcW - 1, (su * srcW) | 0);
					const sy = Math.min(srcH - 1, (sv * srcH) | 0);
					const si = (sy * srcW + sx) * 4;
					r += src[si];
					g += src[si + 1];
					b += src[si + 2];
				}
			}
			return [r * 0.25, g * 0.25, b * 0.25];
		};

		const paintCell = (i) => {
			const x = i % cols;
			const y = (i / cols) | 0;
			const w = cellW + overlap;
			const h = cellH + overlap;
			const cx = (x + 0.5) * cellW + ox[i];
			const cy = (y + 0.5) * cellH + oy[i];
			const fi = i * 3;
			ctx.fillStyle = `rgb(${field[fi] | 0},${field[fi + 1] | 0},${field[fi + 2] | 0})`;
			ctx.fillRect(cx - w * 0.5, cy - h * 0.5, w, h);
		};

		const draw = (now) => {
			if (!src || !field) return;
			if (!start) start = now;

			const dt = lastDraw ? Math.min(0.05, (now - lastDraw) / 1000) : 0.016;
			const follow = 1 - Math.exp(-dt * pointerFollow);
			pointerX += (pointerTargetX - pointerX) * follow;
			pointerY += (pointerTargetY - pointerY) * follow;
			influence += (influenceTarget - influence) * (1 - Math.exp(-dt * influenceFollow));

			const vx = dt > 0 ? (pointerX - prevPX) / dt : 0;
			const vy = dt > 0 ? (pointerY - prevPY) / dt : 0;
			prevPX = pointerX;
			prevPY = pointerY;
			const wakeFollowAmt = 1 - Math.exp(-dt * 6);
			wakeX += (vx - wakeX) * wakeFollowAmt;
			wakeY += (vy - wakeY) * wakeFollowAmt;

			const t = (now - start) * 0.001;
			const breathe = 1 + Math.sin(t * breatheSpeed) * breatheAmount;
			const driftU = Math.sin(t * driftSpeedU) * driftAmountU;
			const driftV = Math.cos(t * driftSpeedV) * driftAmountV;
			const morph = fieldReady ? 1 - Math.exp(-dt * morphRate) : 1;
			const spring = 1 - Math.exp(-dt * springRate);
			const unit = Math.min(cellW, cellH);
			const physics = influence > 0.002 || tilesMoving;

			const viewAspect = cols / Math.max(rows, 1);
			const coverX = imgAspect > viewAspect ? viewAspect / imgAspect : 1;
			const coverY = imgAspect > viewAspect ? 1 : imgAspect / viewAspect;
			const invW = 1 / cols;
			const invH = 1 / rows;
			const tapU = coverX * invW * 0.35;
			const tapV = coverY * invH * 0.35;

			let moving = false;
			const n = cols * rows;

			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < cols; x++) {
					const i = y * cols + x;
					const uvx = (x + 0.5) * invW;
					const uvy = (y + 0.5) * invH;
					const vxUv = (uvx - 0.5) * breathe + 0.5;
					const vyUv = (uvy - 0.5) * breathe + 0.5;
					const u = 0.5 + (vxUv - 0.5) * coverX + driftU;
					const v = 0.5 + (vyUv - 0.5) * coverY + driftV;
					const [sr, sg, sb] = sample(u, v, tapU, tapV);
					const fi = i * 3;
					field[fi] += (sr - field[fi]) * morph;
					field[fi + 1] += (sg - field[fi + 1]) * morph;
					field[fi + 2] += (sb - field[fi + 2]) * morph;

					if (!physics) continue;

					const dx = uvx - pointerX;
					const dy = uvy - pointerY;
					const d2 = dx * dx + dy * dy;
					distSq[i] = d2;
					const heat = influence * Math.exp(-d2 * falloff);
					const dist = Math.sqrt(d2) + 0.06;
					const tx = (dx / dist) * heat * unit * radial + (-dy / dist) * heat * unit * swirl + wakeX * heat * unit * wake;
					const ty = (dy / dist) * heat * unit * radial + (dx / dist) * heat * unit * swirl + wakeY * heat * unit * wake;
					ox[i] += (tx - ox[i]) * spring;
					oy[i] += (ty - oy[i]) * spring;
					if (ox[i] * ox[i] + oy[i] * oy[i] > 0.04) moving = true;
				}
			}

			tilesMoving = moving || influence > 0.01;
			ctx.fillStyle = `rgb(${black[0]},${black[1]},${black[2]})`;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			if (physics) {
				order.sort((a, b) => distSq[b] - distSq[a]);
				for (let i = 0; i < n; i++) paintCell(order[i]);
			} else {
				for (let i = 0; i < n; i++) paintCell(i);
			}

			fieldReady = true;
			lastDraw = now;
		};

		const loop = (now) => {
			if (!shouldRun()) {
				stopLoop();
				return;
			}
			raf = requestAnimationFrame(loop);
			const interacting = influenceTarget > 0 || influence > 0.02 || tilesMoving;
			const minMs = 1000 / (interacting ? interactFps : idleFps);
			if (now - lastDraw < minMs) return;
			draw(now);
		};

		const startLoop = () => {
			if (!shouldRun() || looping) return;
			looping = true;
			raf = requestAnimationFrame(loop);
		};

		const pointerPos = (event) => {
			const rect = host.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			pointerTargetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
			pointerTargetY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
			influenceTarget = 1;
		};

		const onPointerLeave = () => {
			influenceTarget = 0;
		};

		const onVisibility = () => {
			pageVisible = document.visibilityState !== 'hidden';
			if (pageVisible) startLoop();
			else stopLoop();
		};

		const remapToRedBlack = (imageData) => {
			const d = imageData.data;
			const dr = red[0] - black[0];
			const dg = red[1] - black[1];
			const db = red[2] - black[2];
			for (let i = 0; i < d.length; i += 4) {
				const luma = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
				let redAmt = 1 - (luma - 0.4) / 0.45;
				if (redAmt < 0) redAmt = 0;
				else if (redAmt > 1) redAmt = 1;
				redAmt *= redAmt;
				d[i] = black[0] + redAmt * dr;
				d[i + 1] = black[1] + redAmt * dg;
				d[i + 2] = black[2] + redAmt * db;
				d[i + 3] = 255;
			}
			return imageData.data;
		};

		const image = new Image();
		image.onload = () => {
			if (disposed) return;
			const scale = Math.min(1, sourceMax / Math.max(image.width, image.height));
			srcW = Math.max(2, Math.round(image.width * scale));
			srcH = Math.max(2, Math.round(image.height * scale));
			imgAspect = srcW / srcH;
			const offscreen = document.createElement('canvas');
			offscreen.width = srcW;
			offscreen.height = srcH;
			const offCtx = offscreen.getContext('2d');
			if (!offCtx) return;
			offCtx.drawImage(image, 0, 0, srcW, srcH);
			src = remapToRedBlack(offCtx.getImageData(0, 0, srcW, srcH));
			resize();
			draw(performance.now());
			startLoop();
		};
		image.src = source;

		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
			resize();
			if (src) draw(performance.now());
		}) : null;
		if (ro) ro.observe(host);

		if (!reducedMotion) {
			host.addEventListener('pointermove', pointerPos, { passive: true });
			host.addEventListener('pointerdown', pointerPos, { passive: true });
			host.addEventListener('pointerleave', onPointerLeave);
		}
		document.addEventListener('visibilitychange', onVisibility);

		const io = typeof IntersectionObserver !== 'undefined'
			? new IntersectionObserver((entries) => {
				inView = entries.some((entry) => entry.isIntersecting);
				if (inView) startLoop();
				else stopLoop();
			}, { rootMargin: '80px', threshold: 0.01 })
			: null;
		if (io) io.observe(host);

		return () => {
			disposed = true;
			stopLoop();
			image.onload = null;
			document.removeEventListener('visibilitychange', onVisibility);
			host.removeEventListener('pointermove', pointerPos);
			host.removeEventListener('pointerdown', pointerPos);
			host.removeEventListener('pointerleave', onPointerLeave);
			if (ro) ro.disconnect();
			if (io) io.disconnect();
		};
	}, []);

	const bg = `rgb(${SETTINGS.black[0]},${SETTINGS.black[1]},${SETTINGS.black[2]})`;

	return (
		<div
			ref={hostRef}
			aria-hidden
			style={{
				position: 'absolute',
				inset: 0,
				background: bg,
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
					background: bg,
				}}
			/>
		</div>
	);
};

PixelateHero.displayName = 'PixelateHero';
export default PixelateHero;
