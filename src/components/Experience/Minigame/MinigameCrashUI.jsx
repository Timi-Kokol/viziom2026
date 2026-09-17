"use client";

import React from "react";
import { getCrashMessage } from "./MinigameWorld";
import { getSoundManager, SOUND_IDS } from "../../../audio";
import { CrashOverlay, CrashBanner, CrashedTitle, CrashedMessage, CrashedScore, CrashedButtons, ButtonWhite, ButtonGray } from "../styles";

/**
 * Minigame crash UI (banner + fall menu). Rendered outside the Canvas so R3F
 * does not treat H2/DOM elements as Three.js objects.
 */
export default function MinigameCrashUI({
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
	const showBanner = crashBannerVisible;
	const showOverlay = showFallMenu;

	if (!showBanner && !showOverlay) return null;

	return (
		<>
			{showBanner && <CrashBanner>CRASH!</CrashBanner>}
			{showOverlay && (
				<CrashOverlay
					style={{
						transition: `all ${overlayFadeMs}ms ease-out`,
						opacity: fallMenuOverlayOpacity,
					}}
				>
					<div
						style={{
							opacity: showFallMenuContent ? 1 : 0,
							transition: `opacity ${popupFadeMs}ms ease-out`,
							pointerEvents: showFallMenuContent ? "auto" : "none",
						}}
					>
						<CrashedTitle>You crashed!</CrashedTitle>
						<CrashedMessage>{getCrashMessage(minigameScore)}</CrashedMessage>
						<CrashedScore>
							Final score <br />
							<span>{minigameScore}</span>
						</CrashedScore>
						<CrashedButtons>
							<ButtonWhite
								type="button"
								onMouseEnter={() => getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER)}
								onClick={() => {
									getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
									onRestart?.();
								}}
							>
								<span>
									<span>Restart</span>
								</span>
							</ButtonWhite>
							<ButtonGray
								type="button"
								onMouseEnter={() => getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER)}
								onClick={() => {
									getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
									onBackToMain?.();
								}}
							>
								<span>
									<span>Back to Main</span>
								</span>
							</ButtonGray>
						</CrashedButtons>
					</div>
				</CrashOverlay>
			)}
		</>
	);
}
