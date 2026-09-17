import styled, { css } from 'styled-components';

/* The vertical line every modal aligns its copy to. Resolved from the shell so
   one breakpoint ladder (Overlay in UnifiedModal/styles.js) moves every page. */
export const CONTENT_INSET = 'var(--modal-inset, 20rem)';

/* Shared modal header. Every modal uses these so the headers stay identical. */
export const Hero = styled.div`
	position: relative;
	width: 100%;
	height: 42vh;
	min-height: 280px;
	max-height: 480px;
	overflow: hidden;
	background: #000;

	@media (max-width: 700px) {
		height: 38vh;
		min-height: 220px;
	}
`;

export const HeroCopy = styled.div`
	position: absolute;
	left: ${CONTENT_INSET};
	right: ${CONTENT_INSET};
	bottom: 6rem;
	z-index: 3;
	text-align: left;
	pointer-events: none;

	@media (max-width: 700px) {
		bottom: 3.2rem;
	}
`;

export const HeroTitle = styled.h2`
	margin: 0;
	&& {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(3.6rem, 9vw, 7.2rem);
		font-weight: 500;
		line-height: 0.95;
		text-transform: uppercase;
	}
`;

export const kickerBox = css`
	display: inline-block;
	padding: 0.7rem 1.2rem;
	background: rgb(8, 0, 1);
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem;
	font-weight: 700;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: #fff;

	@media (max-width: 700px) {
		font-size: 1.2rem;
		letter-spacing: 0.1em;
	}
`;

export const HeroKicker = styled.p`
	margin: 1.8rem 0 0;
	&& {
		margin: 1.8rem 0 0;
		${kickerBox}
	}
`;

export const SectionKicker = styled.p`
	margin: 0 0 1.2rem;
	max-width: 78rem;
	&& {
		margin: 0 0 1.2rem;
		${kickerBox}
	}
`;

/* Chevron wipe used on the intro enter buttons. Text slides out and back in
   as a white fill covers the red. */
export const wipeCta = css`
	position: relative;
	display: inline-block;
	overflow: hidden;
	margin: 0;
	padding: 1.8rem 3.2rem;
	border: 0;
	border-radius: 5px;
	appearance: none;
	cursor: pointer;
	text-align: center;
	text-decoration: none;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #fff;
	background: ${(props) => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #fff;
	}

	&::before {
		width: 135%;
		clip-path: polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
		transform: translate3d(-100%, 0, 0);
	}

	&::after {
		width: 105%;
		transform: translate3d(100%, 0, 0);
		transition: transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
	}

	span {
		display: block;
		position: relative;
		z-index: 1;
	}

	> span {
		overflow: hidden;
	}

	&:hover:not(:disabled):not([data-sending='true']) {
		&::before {
			transform: translate3d(0, 0, 0);
			transition: transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}

		&::after {
			transform: translate3d(0, 0, 0);
			transition: transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}

		> span > span {
			animation: WipeCtaOut 0.2s forwards, WipeCtaIn 0.3s forwards 0.2s;
			color: ${(props) => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
		}
	}

	&:disabled {
		cursor: default;
	}

	&:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}

	@keyframes WipeCtaOut {
		0% {
			transform: translate(0, 0);
		}
		100% {
			transform: translate(105%, 0);
		}
	}

	@keyframes WipeCtaIn {
		0% {
			transform: translate(-100%, 0);
		}
		100% {
			transform: translate(0, 0);
		}
	}
`;

export const wipeCtaGray = css`
	${wipeCta}
	background: #3b3b3b;
`;
