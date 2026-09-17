import styled from 'styled-components';
import { Hero, HeroCopy, HeroTitle, HeroKicker } from './shared.styles';

export { Hero, HeroCopy, HeroTitle, HeroKicker };

export const PopupContentWrapper = styled.div`
	position: relative;
	overflow: visible;
`;

export const ServiceKicker = styled.p`
	margin: 0 0 2.4rem;
	max-width: 78rem;
	&& {
		margin: 0 0 2.4rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: 1.55;
		text-transform: uppercase;
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}
`;

export const Intro = styled.div`
	position: relative;
	z-index: 3;
	padding: clamp(4.8rem, 10vw, 10rem) var(--modal-inset) 4rem;
`;

export const Copy = styled.p`
	margin: 0 0 2.8rem;
	max-width: 72rem;
	&& {
		margin: 0 0 2.8rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.6rem;
		font-weight: 400;
		line-height: 1.7;
	}

	strong {
		font-weight: 700;
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

export const Service = styled.section`
	position: relative;
	z-index: 3;
	display: grid;
	grid-template-areas: 'stack';
	padding: 2rem 0 6rem;
`;

export const Sequence = styled.div`
	grid-area: stack;
	position: relative;
	z-index: 0;
	align-self: start;
	justify-self: center;
	width: 88%;
	aspect-ratio: 1;
	pointer-events: none;

	> div {
		display: block;
		width: 100%;
		height: 100%;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Fades the emblem in from the top. */
	&::before {
		content: '';
		position: absolute;
		z-index: 1;
		left: 0;
		right: 0;
		top: 0;
		height: 10%;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 1) 0%,
			rgba(0, 0, 0, 0) 100%
		);
	}

	/* Fades the emblem out over the bottom so the title can sit on it. */
	&::after {
		content: '';
		position: absolute;
		z-index: 1;
		left: 0;
		right: 0;
		bottom: 0;
		height: 40%;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 1) 100%
		);
	}
`;

export const ServiceCopy = styled.div`
	grid-area: stack;
	position: relative;
	z-index: 2;
	/* top padding sets how far the title sits down the emblem */
	padding: 74% var(--modal-inset) 2rem;
`;

export const ServiceTitle = styled.h3`
	margin: 0 0 1.6rem;
	&& {
		margin: 0 0 1.6rem;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(3.2rem, 7.5vw, 5.2rem);
		font-weight: 500;
		line-height: 1.05;
		text-shadow: 0 0.4rem 1.6rem rgba(0, 0, 0, 0.55);
	}
`;

export const ServiceBody = styled.p`
	margin: 0 0 3.6rem;
	max-width: 72rem;
	&& {
		margin: 0 0 3.6rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.6rem;
		font-weight: 400;
		line-height: 1.7;
	}
`;

export const Columns = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem 6rem;
	max-width: 88rem;

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
		gap: 3.2rem;
	}
`;

export const Column = styled.div``;

export const ColumnTitle = styled.h4`
	margin: 0 0 1.8rem;
	padding-bottom: 1.2rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	&& {
		margin: 0 0 1.8rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		line-height: 1.3;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.45);
	}
`;

export const ColumnList = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;
	counter-reset: service-item;

	li {
		counter-increment: service-item;
		display: grid;
		grid-template-columns: 3.2rem minmax(0, 1fr);
		align-items: baseline;
		gap: 1.2rem;
		margin: 0;
		padding: 1.1rem 1.2rem 1.1rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.92);
		cursor: default;
		transition: background-color 0.2s ease, padding-left 0.2s ease, color 0.2s ease;

		&::before {
			content: counter(service-item, decimal-leading-zero);
			font-size: 1.2rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			color: rgba(255, 255, 255, 0.28);
			transition: color 0.2s ease;
		}

		&:hover {
			padding-left: 0.8rem;
			color: #fff;
			background: linear-gradient(90deg, rgba(221, 0, 9, 0.12), transparent 72%);
		}

		&:hover::before {
			color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
		}
	}
`;
