'use client';

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const MessageWrap = styled.div<{ $visible: boolean; $bottom?: number }>`
	position: fixed;
	bottom: 65px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 999;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	pointer-events: none;
	transition: opacity 0.25s ease;
`;

interface OnScreenMessageProps {
	visible: boolean;
	/** If set, call onHide after this many ms while visible */
	autoHideAfter?: number;
	onHide?: () => void;
	/** Distance from bottom in px (default 60). Use different values to stack messages. */
	bottom?: number;
	children: React.ReactNode;
	'aria-live'?: 'polite' | 'assertive' | 'off';
}

export default function OnScreenMessage({
	visible,
	autoHideAfter,
	onHide,
	bottom,
	children,
	'aria-live': ariaLive = 'polite',
}: OnScreenMessageProps) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!visible || autoHideAfter == null || !onHide) return;
		timerRef.current = setTimeout(onHide, autoHideAfter);
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [visible, autoHideAfter, onHide]);

	return (
		<MessageWrap $visible={visible} $bottom={bottom} aria-live={ariaLive}>
			{children}
		</MessageWrap>
	);
}
