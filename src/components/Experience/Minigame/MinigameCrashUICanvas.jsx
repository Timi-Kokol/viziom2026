"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { getCrashMessage } from "./MinigameWorld";
import { getSoundManager, SOUND_IDS } from "../../../audio";

// Match Experience/styles.js: CrashedTitle, CrashedMessage, CrashedScore, CrashBanner, ButtonWhite, ButtonGray
const FONT_FAMILY = "var(--kode-mono), ui-monospace, monospace";
const MOBILE_BREAK = 768;

const TITLE_COLOR = "rgba(255, 255, 255, 0.95)";       // theme bc5 fallback
const MESSAGE_COLOR = "rgba(255, 255, 255, 0.85)";     // theme bc3 fallback
const SCORE_BG_COLOR = "rgba(255, 255, 255, 0.95)";    // score box background
const SCORE_TEXT_COLOR = "#111";
const BUTTON_WHITE_BG = "#fff";                         // ButtonWhite background
const BUTTON_WHITE_TEXT = "rgba(255, 255, 255, 0.95)";  // ButtonWhite text (brand)
const BUTTON_GRAY_BG = "#3b3b3b";                       // ButtonGray background
const BUTTON_GRAY_TEXT = "#fff";

function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

/**
 * Minigame crash UI drawn on a 2D canvas. No DOM for score/title/message –
 * nothing to edit in Inspect Element. Rendered outside Canvas (no R3F).
 */
export default function MinigameCrashUICanvas({
	crashBannerVisible = false,
	showFallMenu = false,
	showFallMenuContent = false,
	fallMenuOverlayOpacity = 1,
	minigameScore = 0,
	onRestart,
	onBackToMain,
	overlayFadeMs = 1500,
	popupFadeMs = 300,
}) {
	const canvasRef = useRef(null);
	const buttonRectsRef = useRef({ restart: null, back: null });
	const dprRef = useRef(1);

	const draw = useCallback(
		(ctx, width, height, dpr) => {
			ctx.save();
			ctx.scale(dpr, dpr);
			const w = width / dpr;
			const h = height / dpr;
			ctx.clearRect(0, 0, w, h);

			// 1) CRASH! banner – match CrashBanner: 15rem (150px), mobile 8rem (80px), text-shadow
			if (crashBannerVisible) {
				ctx.save();
				ctx.globalAlpha = 1;
				ctx.fillStyle = "#fff";
				const bannerSize = w < MOBILE_BREAK ? 80 : 150;
				ctx.font = `700 ${bannerSize}px ${FONT_FAMILY}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
				ctx.shadowBlur = 40;
				ctx.fillText("CRASH!", w / 2, h / 2);
				ctx.shadowColor = "rgba(200, 0, 0, 0.5)";
				ctx.shadowBlur = 80;
				ctx.fillText("CRASH!", w / 2, h / 2);
				ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
				ctx.shadowBlur = 0;
				ctx.shadowOffsetY = 2;
				ctx.shadowOffsetX = 0;
				ctx.fillText("CRASH!", w / 2, h / 2);
				ctx.restore();
			}

			// 2) Fall menu overlay + content
			if (showFallMenu) {
				ctx.globalAlpha = fallMenuOverlayOpacity;
				ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
				ctx.fillRect(0, 0, w, h);
				ctx.globalAlpha = 1;

				const contentAlpha = showFallMenuContent ? 1 : 0;
				ctx.globalAlpha = contentAlpha;
				if (contentAlpha < 0.01) {
					ctx.restore();
					return;
				}

				const cx = w / 2;
				const titleY = h * 0.32;
				const msgY = h * 0.4;
				const scoreLabelY = h * 0.48;
				const scoreValueY = h * 0.58;
				const buttonY = h * 0.72;
				const buttonH = 56;
				const buttonGap = 20;
				const buttonW = Math.min(200, (w - 60 - buttonGap) / 2);
				const restartX = cx - buttonW - buttonGap / 2;
				const backX = cx + buttonGap / 2;

				// Title
				ctx.fillStyle = TITLE_COLOR;
				ctx.font = `700 ${Math.min(66, w * 0.12)}px ${FONT_FAMILY}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText("You crashed!", cx, titleY);

				// Message
				ctx.fillStyle = MESSAGE_COLOR;
				ctx.font = `700 16px ${FONT_FAMILY}`;
				const message = getCrashMessage(minigameScore);
				const msgLines = message.split(/(?<=.{40})\s/).slice(0, 3);
				msgLines.forEach((line, i) => ctx.fillText(line, cx, msgY + i * 22));

				// Final score label
				ctx.fillStyle = TITLE_COLOR;
				ctx.font = `700 16px ${FONT_FAMILY}`;
				ctx.fillText("FINAL SCORE", cx, scoreLabelY);

				// Score value in a box
				const scoreStr = String(minigameScore);
				ctx.font = `700 ${Math.min(72, w * 0.14)}px ${FONT_FAMILY}`;
				const scoreW = ctx.measureText(scoreStr).width + 48;
				const scoreH = 80;
				const scoreX = cx - scoreW / 2;
				const scoreY = scoreValueY - scoreH / 2;
				ctx.fillStyle = SCORE_BG_COLOR;
				roundRect(ctx, scoreX, scoreY, scoreW, scoreH, 5);
				ctx.fill();
				ctx.fillStyle = SCORE_TEXT_COLOR;
				ctx.fillText(scoreStr, cx, scoreValueY);

				// Buttons
				ctx.font = `700 16px ${FONT_FAMILY}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";

				// Restart
				ctx.fillStyle = BUTTON_RESTART_COLOR;
				ctx.strokeStyle = "#fff";
				ctx.lineWidth = 1;
				roundRect(ctx, restartX, buttonY - buttonH / 2, buttonW, buttonH, 5);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "#111";
				ctx.fillText("Restart", restartX + buttonW / 2, buttonY);
				buttonRectsRef.current.restart = { x: restartX, y: buttonY - buttonH / 2, w: buttonW, h: buttonH };

				// Back to Main
				ctx.fillStyle = BUTTON_BACK_COLOR;
				ctx.strokeStyle = "#fff";
				roundRect(ctx, backX, buttonY - buttonH / 2, buttonW, buttonH, 5);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "#111";
				ctx.fillText("Back to Main", backX + buttonW / 2, buttonY);
				buttonRectsRef.current.back = { x: backX, y: buttonY - buttonH / 2, w: buttonW, h: buttonH };

				ctx.restore();
			} else {
				buttonRectsRef.current.restart = null;
				buttonRectsRef.current.back = null;
			}

			ctx.restore();
		},
		[
			crashBannerVisible,
			showFallMenu,
			showFallMenuContent,
			fallMenuOverlayOpacity,
			minigameScore,
		]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
		dprRef.current = dpr;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		draw(ctx, canvas.width, canvas.height, dpr);
	}, [draw]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ro = new ResizeObserver(() => {
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const dpr = dprRef.current;
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			draw(ctx, canvas.width, canvas.height, dpr);
		});
		ro.observe(canvas);
		return () => ro.disconnect();
	}, [draw]);

	const handlePointerDown = useCallback(
		(e) => {
			if (!showFallMenu || !showFallMenuContent) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const dpr = dprRef.current;
			const x = (e.clientX - rect.left) * (canvas.width / rect.width) / dpr;
			const y = (e.clientY - rect.top) * (canvas.height / rect.height) / dpr;
			const r = buttonRectsRef.current.restart;
			const b = buttonRectsRef.current.back;
			if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
				getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
				onRestart?.();
			} else if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
				getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
				onBackToMain?.();
			}
		},
		[showFallMenu, showFallMenuContent, onRestart, onBackToMain]
	);

	if (!crashBannerVisible && !showFallMenu) return null;

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			style={{
				position: "fixed",
				inset: 0,
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				width: "100%",
				height: "100%",
				zIndex: 90,
				pointerEvents: showFallMenu ? "auto" : "none",
				userSelect: "none",
				touchAction: "none",
			}}
			onPointerDown={handlePointerDown}
		/>
	);
}
