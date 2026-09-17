'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

type SequenceScrubProps = {
	frames: string[];
	alt: string;
	start?: string;
	end?: string;
	markers?: boolean;
};

type Frame = ImageBitmap | HTMLImageElement;

const DECODE_CONCURRENCY = 8;
// Per-frame catch-up at 60fps. Higher = tighter scroll lock, lower = smoother coast.
const PROGRESS_SMOOTH = 0.22;

const loadElement = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.decoding = 'async';
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load ${src}`));
		img.src = src;
	});

// Decoding up front keeps drawImage off the critical path while scrubbing.
const loadFrame = async (src: string, signal: AbortSignal): Promise<Frame> => {
	if (typeof createImageBitmap !== 'function') return loadElement(src);
	try {
		const res = await fetch(src, { signal });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await createImageBitmap(await res.blob());
	} catch (err) {
		if (signal.aborted) throw err;
		return loadElement(src);
	}
};

const SequenceScrub: React.FC<SequenceScrubProps> = ({
	frames,
	alt,
	start = 'top 80%',
	end = 'bottom 30%',
	markers = false,
}) => {
	const wrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const framesRef = useRef<(Frame | null)[]>([]);
	const drawnRef = useRef(-1);
	const targetProgressRef = useRef(0);
	const currentProgressRef = useRef(0);
	const [ready, setReady] = useState(false);

	const drawAt = (progress: number) => {
		const last = Math.max(0, framesRef.current.length - 1);
		const img0 = framesRef.current[0];
		if (!img0) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = ctxRef.current ?? canvas.getContext('2d', { alpha: false });
		if (!ctx) return;
		ctxRef.current = ctx;

		if (canvas.width !== img0.width || canvas.height !== img0.height) {
			canvas.width = img0.width;
			canvas.height = img0.height;
		}

		if (last === 0) {
			if (drawnRef.current === 0) return;
			drawnRef.current = 0;
			ctx.globalAlpha = 1;
			ctx.drawImage(img0, 0, 0);
			return;
		}

		const exact = progress * last;
		const i0 = Math.floor(exact);
		const i1 = Math.min(i0 + 1, last);
		const blend = exact - i0;

		// Skip redraws when nothing visible changed.
		const stamp = i0 + blend;
		if (stamp === drawnRef.current) return;

		const frame0 = framesRef.current[i0];
		if (!frame0) return;

		drawnRef.current = stamp;
		ctx.globalAlpha = 1;
		ctx.drawImage(frame0, 0, 0);

		const frame1 = framesRef.current[i1];
		if (frame1 && blend > 0.001) {
			ctx.globalAlpha = blend;
			ctx.drawImage(frame1, 0, 0);
			ctx.globalAlpha = 1;
		}
	};

	const draw = (index: number) => {
		const last = Math.max(0, framesRef.current.length - 1);
		drawAt(last > 0 ? index / last : 0);
	};

	useEffect(() => {
		const controller = new AbortController();
		const store: (Frame | null)[] = frames.map(() => null);
		framesRef.current = store;
		drawnRef.current = -1;
		targetProgressRef.current = 0;
		currentProgressRef.current = 0;
		setReady(false);

		let cursor = 0;
		let alive = true;

		const worker = async () => {
			while (alive && cursor < frames.length) {
				const i = cursor;
				cursor += 1;
				try {
					const frame = await loadFrame(frames[i], controller.signal);
					if (!alive) {
						if ('close' in frame) frame.close();
						return;
					}
					store[i] = frame;
					if (i === 0) draw(0);
				} catch {
					if (!alive) return;
				}
			}
		};

		Promise.all(
			Array.from({ length: Math.min(DECODE_CONCURRENCY, frames.length) }, worker),
		).then(() => {
			if (!alive) return;
			setReady(true);
		});

		return () => {
			alive = false;
			controller.abort();
			store.forEach((frame) => {
				if (frame && 'close' in frame) frame.close();
			});
			framesRef.current = [];
			ctxRef.current = null;
		};
	}, [frames]);

	useGSAP(
		() => {
			const wrap = wrapRef.current;
			if (!wrap || !ready) return;
			const last = Math.max(0, frames.length - 1);

			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				draw(last);
				return;
			}

			const scroller = wrap.closest('[data-modal-scroller]');
			if (!scroller) return;

			const sync = (progress: number, immediate = false) => {
				targetProgressRef.current = progress;
				if (immediate) currentProgressRef.current = progress;
			};

			const tick = () => {
				const target = targetProgressRef.current;
				let current = currentProgressRef.current;
				if (current === target) return;
				const step =
					1 - Math.pow(1 - PROGRESS_SMOOTH, gsap.ticker.deltaRatio());
				current += (target - current) * step;
				if (Math.abs(target - current) < 0.0004) current = target;
				currentProgressRef.current = current;
				drawAt(current);
			};

			const st = ScrollTrigger.create({
				trigger: wrap,
				scroller,
				start,
				end,
				markers,
				scrub: true,
				onUpdate: (self) => sync(self.progress),
				onRefresh: (self) => sync(self.progress, true),
			});

			gsap.ticker.add(tick);
			tick();

			return () => {
				gsap.ticker.remove(tick);
				st.kill();
			};
		},
		{ dependencies: [frames, ready, start, end, markers] },
	);

	return (
		<div ref={wrapRef} aria-label={alt} role="img">
			<canvas ref={canvasRef} />
		</div>
	);
};

SequenceScrub.displayName = 'SequenceScrub';
export default SequenceScrub;
