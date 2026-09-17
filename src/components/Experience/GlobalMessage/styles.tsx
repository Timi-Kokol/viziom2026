"use client";

import styled from "styled-components";
import { bpd } from "@tackl";

/** Bottom position (px from viewport bottom) for "Visit the green pods" message */
export const GLOBAL_MESSAGE_BOTTOM_VISIT_PODS = 90;

/** Bottom position (px) for lasers / drone message */
export const GLOBAL_MESSAGE_BOTTOM_LASERS = 90;

interface GlobalMessageWrapProps {
    $visible?: boolean;
    $bottom?: number;
}

export const GlobalMessageWrap = styled.div<GlobalMessageWrapProps>`
	position: fixed;
	bottom: ${(p) => (p.$bottom != null ? p.$bottom : GLOBAL_MESSAGE_BOTTOM_VISIT_PODS)}px;
	left: 50%;
	transform: translateX(-50%);
	transform: ${(p) => (p.$visible ? 'translateX(-50) scale(1)' : 'translateX(-50%) scale(0)')};
	z-index: 999;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	pointer-events: none;
	transition: opacity 0.5s ease, transform 0.5s ease;
	animation: pulse 1.5s infinite ease;
	${bpd.m`
		bottom:140px !important;
		left:0;
		right:0;
		transform:translateX(0) !important;
		text-align:center;
	`}
	@keyframes pulse {
		0% { transform: translate(-50%,0) scale(1); }
		50% { transform: translate(-50%,0) scale(1.05); }
		100% { transform: translate(-50%,0) scale(1); }
	}
`;

export const GlobalMessageText = styled.span`
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-weight: 700;
	font-size: 16px;
	color: ${(props) => props.theme?.colors?.brand?.bc3?.[100] ?? "rgba(255, 255, 255, 0.9)"};
	text-transform: uppercase;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(10px);
	padding: 10px 20px;
	border-radius: 20px;
	overflow:hidden;
	display:block;
	${bpd.m`
		font-size:14px !important;
	`}
`;
