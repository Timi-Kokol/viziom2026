'use client';

import styled from 'styled-components';
import { bpd } from '@tackl';

export const Wrapper = styled.button.attrs({ type: 'button' })`
	position: fixed;
	bottom: 60px;
	right: 60px;
	z-index: 102;
	width: 40px;
	height: 40px;
	padding: 0;
	border: 1px solid rgba(255, 255, 255, 0.5);
	border-radius: 5px;
	background: rgba(0, 0, 0, 0.4);
	color: #fff;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
	-webkit-tap-highlight-color: transparent;
	transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
	display:flex;
	align-items: center;
	justify-content: center;
	opacity: 0.4;
	&:hover {
		opacity:1;
	}
	&:focus {
		outline: none;
	}

	${bpd.l`
		z-index: 2203;
		bottom: auto;
		top: 35px;
		left: 3rem;
	`}
	.equalizer{
		position: relative;
		display: inline-block;
		cursor: pointer;
		width: 20px;
		height: 20px;
		.equalizer__bar {
			background: #fff;
			bottom: 1px;
			height: 3px;
			position: absolute;
			width: 3px;
			animation: ${(p) => (p.$enabled ? 'sound 800ms linear infinite alternate' : 'sound 800ms linear alternate')};
			border-radius:5px;
		}
	}
	.equalizer__bar:nth-of-type(1) {
			left: 1px;
		animation-duration: 500ms;
		animation-delay: 0ms;
	}
	.equalizer__bar:nth-of-type(2) {
		left: 5px;
		animation-duration: 500ms;
		animation-delay: 300ms;
	}
	.equalizer__bar:nth-of-type(3) {
	left: 9px;
		animation-duration: 500ms;
		animation-delay: 600ms;
	}
	.equalizer__bar:nth-of-type(4) {
	left: 13px;
		animation-duration: 500ms;
		animation-delay: 900ms;
	}
	.equalizer__bar:nth-of-type(5) {
	left: 17px;
		animation-duration: 500ms;
		animation-delay: 1200ms;
	}
	.equalizer__bar:nth-of-type(6) {
		left: 21px;
		animation-duration: 500ms;
		animation-delay: 1500ms;
	}

	@keyframes sound{0%{height:3px}100%{height:18px}}
`;
