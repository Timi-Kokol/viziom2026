'use client';

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const CursorWrap = styled.div`
	position: fixed;
	left: 0;
	top: 0;
	pointer-events: none;
	z-index: 99999;
	visibility: hidden;
	transition: visibility 0.15s ease, opacity 0.4s ease;
`;

const Dot = styled.div`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 1);
	position: absolute;
	left: 0;
	top: 0;
	transform: translate(-50%, -50%);
`;

const Ring = styled.div`
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: 2px solid rgba(221, 0, 9, 1);
	position: absolute;
	left: 0;
	top: 0;
	transition: width 0.2s ease, height 0.2s ease, border 0.2s ease;
	pointer-events: none;
`;

/** Smoothing for position and scale (0 = smoother, 1 = instant). Tutorial uses 0.17. */
const SPEED = 0.17;
/** Velocity above this updates rotation (reduces shakiness at low speed). */
const ROTATE_THRESHOLD = 20;
/** Max velocity for scale calculation. */
const VELOCITY_CAP = 150;
/** Fade out cursor after this many ms without movement. */
const IDLE_FADE_MS = 3000;

export default function CustomCursor() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const ringElRef = useRef<HTMLDivElement>(null);
	const ringRef = useRef({ x: -100, y: -100 });
	const targetRef = useRef({ x: -100, y: -100 });
	const previousMouseRef = useRef({ x: -100, y: -100 });
	const currentScaleRef = useRef(0);
	const currentAngleRef = useRef(0);
	const lastMoveTimeRef = useRef(Date.now());
	const rafRef = useRef<number>(0);

	useEffect(() => {
		const isPointerFine =
			typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
		if (!isPointerFine) return;

		document.documentElement.classList.add('custom-cursor-active');

		const animate = () => {
			const mouseX = targetRef.current.x;
			const mouseY = targetRef.current.y;
			const prev = previousMouseRef.current;
			const circle = ringRef.current;

			// MOVE: smooth follow
			circle.x += (mouseX - circle.x) * SPEED;
			circle.y += (mouseY - circle.y) * SPEED;

			// SQUEEZE: velocity-based scale
			const deltaMouseX = mouseX - prev.x;
			const deltaMouseY = mouseY - prev.y;
			previousMouseRef.current = { x: mouseX, y: mouseY };
			const mouseVelocity = Math.min(
				Math.sqrt(deltaMouseX ** 2 + deltaMouseY ** 2) * 4,
				VELOCITY_CAP
			);
			const scaleValue = (mouseVelocity / VELOCITY_CAP) * 0.5;
			currentScaleRef.current += (scaleValue - currentScaleRef.current) * SPEED;

			// ROTATE: align to movement direction, only when moving fast enough
			const angleDeg = (Math.atan2(deltaMouseY, deltaMouseX) * 180) / Math.PI;
			if (mouseVelocity > ROTATE_THRESHOLD) {
				currentAngleRef.current = angleDeg;
			}

			// Update DOM directly (no React re-renders)
			if (wrapRef.current) {
				wrapRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
				// Fade out after idle, fade in when moving again
				const idle = Date.now() - lastMoveTimeRef.current > IDLE_FADE_MS;
				wrapRef.current.style.opacity = idle ? '0' : '1';
			}
			if (ringElRef.current) {
				const sx = 1 + currentScaleRef.current;
				const sy = 1 - currentScaleRef.current;
				ringElRef.current.style.transform = `translate(${circle.x - mouseX}px, ${circle.y - mouseY}px) translate(-50%, -50%) rotate(${currentAngleRef.current}deg) scale(${sx}, ${sy})`;
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		const handleMove = (e: MouseEvent) => {
			lastMoveTimeRef.current = Date.now();
			const x = e.clientX;
			const y = e.clientY;
			targetRef.current = { x, y };
			if (wrapRef.current) {
				wrapRef.current.style.visibility = 'visible';
				wrapRef.current.style.opacity = '1';
			}
			if (!rafRef.current) {
				ringRef.current = { x, y };
				previousMouseRef.current = { x, y };
				rafRef.current = requestAnimationFrame(animate);
			}
		};

		const handleLeave = () => {
			if (wrapRef.current) wrapRef.current.style.visibility = 'hidden';
		};
		const handleEnter = () => {
			if (wrapRef.current) wrapRef.current.style.visibility = 'visible';
		};

		const handleOver = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const interactive = !!target.closest(
				'a, button, [role="button"], input, select, textarea, [data-cursor-hover]'
			);
			if (ringElRef.current) {
				ringElRef.current.style.width = interactive ? '26px' : '44px';
				ringElRef.current.style.height = interactive ? '26px' : '44px';
				ringElRef.current.style.border = interactive
					? '5px solid rgb(156, 255, 1)'
					: '1px solid rgb(156, 255, 1)';
			}
		};

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseleave', handleLeave);
		window.addEventListener('mouseenter', handleEnter);
		window.addEventListener('mouseover', handleOver);

		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseleave', handleLeave);
			window.removeEventListener('mouseenter', handleEnter);
			window.removeEventListener('mouseover', handleOver);
			document.documentElement.classList.remove('custom-cursor-active');
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
		};
	}, []);

	return (
		<CursorWrap ref={wrapRef} aria-hidden>
			<Dot />
			<Ring ref={ringElRef} />
		</CursorWrap>
	);
}
