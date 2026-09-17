"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { GlobalMessageWrap, GlobalMessageText } from "./styles";
import { GLOBAL_MESSAGE_BOTTOM_VISIT_PODS, GLOBAL_MESSAGE_BOTTOM_LASERS } from "./styles";

export interface GlobalMessageProps {
	visible: boolean;
	onHide?: () => void;
	autoHideAfter?: number;
	bottom?: number;
	children?: ReactNode;
	"aria-live"?: "polite" | "assertive" | "off";
}

/**
 * Reusable on-screen message (e.g. "Visit the green pods", lasers message).
 * Layout and bottom position are in styles; supports optional auto-hide.
 */
export default function GlobalMessage({
	visible,
	onHide,
	autoHideAfter,
	bottom,
	children,
	"aria-live": ariaLive = "polite",
}: GlobalMessageProps) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!visible || autoHideAfter == null || typeof onHide !== "function") return;
		timerRef.current = setTimeout(onHide, autoHideAfter);
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [visible, autoHideAfter, onHide]);

	return (
		<GlobalMessageWrap $visible={visible} $bottom={bottom} aria-live={ariaLive}>
			<GlobalMessageText>{children}</GlobalMessageText>
		</GlobalMessageWrap>
	);
}

export { GLOBAL_MESSAGE_BOTTOM_VISIT_PODS, GLOBAL_MESSAGE_BOTTOM_LASERS };
