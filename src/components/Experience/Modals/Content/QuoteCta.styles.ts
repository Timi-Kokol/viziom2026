import styled, { keyframes, css } from 'styled-components';
import { kickerBox } from './shared.styles';

const pulse = keyframes`
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.4; transform: scale(0.72); }
`;

const chase = keyframes`
	0%, 72%, 100% { transform: scale(1); }
	18% { transform: scale(1.38); }
`;

export const Banner = styled.button`
	display: block;
	position: relative;
	z-index: 3;
	overflow: hidden;
	width: calc(100% + 2 * var(--modal-gutter, 0px));
	margin: clamp(6rem, 12vw, 12rem) calc(-1 * var(--modal-gutter, 0px)) calc(-1 * var(--modal-gutter, 0px));
	padding: clamp(4rem, 8vw, 6.4rem) var(--modal-inset) clamp(4.8rem, 9vw, 7.2rem);
	border: 0;
	text-align: left;
	cursor: pointer;
	appearance: none;
	font: inherit;
	color: #fff;
	background: rgb(8, 0, 1);

	&:hover,
	&:focus-visible {
		outline: none;
	}

	&:focus-visible {
		box-shadow: inset 0 0 0 2px #fff;
	}
`;

export const Inner = styled.div`
	position: relative;
	z-index: 1;
	pointer-events: none;
`;

export const Kicker = styled.p`
	display: inline-flex;
	align-items: center;
	gap: 1rem;
	margin: 0 0 2.4rem;
	&& {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		margin: 0 0 0.4rem;
		${kickerBox}
	}
`;

export const Pulse = styled.span`
	width: 0.9rem;
	height: 0.9rem;
	border-radius: 50%;
	background: #fff;
	animation: ${pulse} 1.5s ease-in-out infinite;
	flex-shrink: 0;
`;

export const Row = styled.div`
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 3.2rem;
	align-items: center;

	@media (max-width: 800px) {
		grid-template-columns: 1fr auto;
		gap: 2.4rem;
	}
`;

export const Title = styled.h3`
	margin: 0;
	&& {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(3.2rem, 8vw, 7.2rem);
		font-weight: 500;
		line-height: 0.92;
		text-transform: uppercase;
		color: #fff;
	}
`;

export const Arrow = styled.span`
	position: relative;
	display: block;
	width: 8.8rem;
	height: 8.8rem;
	flex-shrink: 0;
	border: 2px solid #fff;
	border-radius: 50%;
	background: transparent;
	transition:
		transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
		background-color 0.3s ease,
		border-color 0.3s ease;

	${Banner}:hover & {
		transform: translateX(0.8rem);
		background: #fff;
		border-color: #fff;
	}

	@media (max-width: 800px) {
		width: 6.8rem;
		height: 6.8rem;
	}

	@media (max-width: 480px) {
		width: 5.2rem;
		height: 5.2rem;
	}
`;

export const Cluster = styled.span`
	position: absolute;
	top: 50%;
	left: 50%;
	width: 2.3rem;
	height: 2.8rem;
	transform: translate(-50%, -50%);
`;

type DotPos = 'top' | 'bot' | 'tip';

export const DotWrap = styled.span<{ $pos: DotPos }>`
	position: absolute;
	width: 0.9rem;
	height: 0.9rem;
	transition: top 0.4s cubic-bezier(0.66, 0, 0.34, 1),
		bottom 0.4s cubic-bezier(0.66, 0, 0.34, 1),
		left 0.4s cubic-bezier(0.66, 0, 0.34, 1),
		right 0.4s cubic-bezier(0.66, 0, 0.34, 1),
		transform 0.4s cubic-bezier(0.66, 0, 0.34, 1);

	${({ $pos }) =>
		$pos === 'top' &&
		css`
			top: 0;
			left: 0;
		`}

	${({ $pos }) =>
		$pos === 'bot' &&
		css`
			bottom: 0;
			left: 0;
		`}

	${({ $pos }) =>
		$pos === 'tip' &&
		css`
			top: 50%;
			right: 0;
			transform: translateY(-50%);
		`}
`;

export const Dot = styled.span<{ $delay?: string }>`
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: #fff;
	animation: ${chase} 1.35s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay || '0s'};
	will-change: transform;
	transition: background-color 0.25s ease;

	${Banner}:hover & {
		background: ${(props) => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
		animation-duration: 0.55s;
	}
`;
