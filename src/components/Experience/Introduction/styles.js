"use client";

import styled from "styled-components";
import { bpd } from "@tackl";

export const INTRO_FADE_OUT_MS = 600;

export const Wrapper = styled.div`
	position: fixed;
	inset: 0;
	z-index: 200;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	background: #000;
	color: #fff;
	text-align: center;
	padding: 2rem;
	box-sizing: border-box;
	opacity: ${(p) => (p.$exiting ? 0 : 1)};
	transition: opacity ${INTRO_FADE_OUT_MS}ms ease-out;
	pointer-events: ${(p) => (p.$exiting ? "none" : "auto")};
`;

/** Full-size canvas behind intro content for 3D robot head */
export const CanvasLayer = styled.div`
	position: absolute;
	inset: 0;
	z-index: 0;
`;

/** Keeps title, loader, buttons above the canvas and clickable */
export const ContentLayer = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top:40vh;
`;

export const Title = styled.h1`
	font-family: var(--ibm-plex-sans), Arial, sans-serif;
	font-size: clamp(3rem, 4vw, 4.2rem);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.02em;
	margin: 0 0 1rem;
	line-height: 1.2;
	width:420px;
	max-width:100%;
	${bpd.m`
		width:100%;
	`}
`;

export const Subtitle = styled.p`
	font-size: 14px;
	opacity: 0.85;
	max-width: 267px;
	margin: 0 0 2.5rem;
	line-height: 1.5;
`;

export const Since = styled.div`
	color:${props => props.theme.colors.brand.bc5?.[100]};
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size:14px;
	font-weight:700;
	text-transform: uppercase;
	text-align: center;
	position:relative;
	margin-bottom:30px;
	&:after, &:before {
	content:"";
		position:absolute;
		top:50%;
		right:100%;
		margin-right:20px;
		width:140px;
		height:1px;
		background:${props => props.theme.colors.brand.bc5?.[100]};
	}
	&:before {
		right:auto;
		left:100%;
		margin-right:0;
		margin-left:20px;
	}
	${bpd.m`
		&:before, &:after {
		width:65px;
		}
	`}
`;

const LOADER_FADE_MS = 500;
const BUTTONS_FADE_MS = 500;

export const LoaderTrack = styled.div`
	width: calc(100% - 20px);
	height: 4px;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 2px;
	overflow: hidden;
	margin-bottom: 2.5rem;
	margin-inline:50px;
	opacity: ${(p) => (p.$exiting ? 0 : 1)};
	transition: opacity ${LOADER_FADE_MS}ms ease-out;
	pointer-events: ${(p) => (p.$exiting ? "none" : "auto")};
`;

export const ButtonsFadeWrap = styled.div`
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition: opacity ${BUTTONS_FADE_MS}ms ease-out;
	${bpd.m`
		width:256px;
		max-width:100%;
	`}
`;

export const LoaderBar = styled.div`
	height: 100%;
	width: ${(p) => Math.min(100, p.$progress * 100)}%;
	background:${props => props.theme.colors.brand.bc3?.[100]};
	border-radius: 2px;
	transition: width 0.15s ease-out;
`;

export const Logo = styled.img`
	width: 161px;
	height:24px;
	display: block;
	position:fixed;
	top:60px;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	width: 410px;
	${bpd.m`
		display:block;
		width:100%;
	`}
`;

export const ButtonGray = styled.button`
		padding:15px;
		width:50%;
		border:none;
		cursor:pointer;
		overflow:hidden;
		display:inline-block;
		margin:0;
		background:#3b3b3b;
		color:#fff;
		font-size:14px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform:uppercase;
		position:relative;
		border-radius:5px;
		&:before, &:after {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			content:"";
			background:#fff;
		}
		&:before {
			width:135%;
			clip-path:polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
			transform:translate3d(-100%, 0,0);
		}
		&:after {
			width:105%;
			transform:translate3d(100%, 0,0);
			transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}
		span {
			display:block;
			position:relative;
			z-index:1;
			transition:color 0.3s ease-out 0.1s;
		}
		> span {
			overflow:hidden;
		}
		&:hover {
			&:before {
				transform:translate3d(0,0,0);
				transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			&:after {
				transform:translate3d(0,0,0);
				transition:transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			> span > span {
				animation: MoveRightInitial 0.2s forwards, MoveRightEnd 0.3s forwards 0.2s;
				color:${props => props.theme.colors.brand.bc5?.[100]};
			}
		}
		@keyframes MoveRightInitial {
			0% {
				transform:translate(0,0,);
			}
			100% {
				transform:translate(105%,0)
			}
		}
		@keyframes MoveRightEnd {
			0% {
				transform:translate(-100%, 0)
			}
			100% {
				transform:translate(0,0);
			}
		}
		${bpd.m`
			display:block;
			width:100%;
		`}
	`
;

export const ButtonRed = styled.button`
		padding:15px;
		width:50%;
		border:none;
		cursor:pointer;
		overflow:hidden;
		display:inline-block;
		margin:0;
		background:${props => props.theme.colors.brand.bc5?.[100]};
		color:#fff;
		font-size:14px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform:uppercase;
		position:relative;
		border-radius:5px;
		&:before, &:after {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			content:"";
			background:#fff;
		}
		&:before {
			width:135%;
			clip-path:polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
			transform:translate3d(-100%, 0,0);
		}
		&:after {
			width:105%;
			transform:translate3d(100%, 0,0);
			transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}
		span {
			display:block;
			position:relative;
			z-index:1;
		}
		> span {
			overflow:hidden;
		}
		&:hover {
			&:before {
				transform:translate3d(0,0,0);
				transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			&:after {
				transform:translate3d(0,0,0);
				transition:transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			> span > span {
				animation: MoveRightInitial 0.2s forwards, MoveRightEnd 0.3s forwards 0.2s;
				color:${props => props.theme.colors.brand.bc5?.[100]};
			}
		}
		@keyframes MoveRightInitial {
			0% {
				transform:translate(0,0,);
			}
			100% {
				transform:translate(105%,0)
			}
		}
		@keyframes MoveRightEnd {
			0% {
				transform:translate(-100%, 0)
			}
			100% {
				transform:translate(0,0);
			}
		}
		${bpd.m`
			display:block;
			width:100%;
			margin-bottom:10px;
		`}
	`
;
