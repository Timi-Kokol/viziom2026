import styled from 'styled-components';
import { Hero, HeroCopy, HeroTitle, HeroKicker } from './shared.styles';

export { Hero, HeroCopy, HeroTitle, HeroKicker };

const sectionKicker = styled.p`
	margin: 0 0 1.2rem;
	&& {
		margin: 0 0 1.2rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}
`;

export const StackKicker = sectionKicker;
export const ProcessKicker = sectionKicker;

export const PopupContentWrapper = styled.div`
	position: relative;
	overflow: hidden;
`;

export const Portrait = styled.div`
	position: absolute;
	top: 4rem;
	right: 0;
	width: 60%;
	z-index: 2;
	pointer-events: none;

	img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: contain;
		-webkit-mask-image: linear-gradient(
			to bottom,
			#000 0%,
			#000 52%,
			rgba(0, 0, 0, 0.7) 72%,
			rgba(0, 0, 0, 0.25) 86%,
			transparent 100%
		);
		mask-image: linear-gradient(
			to bottom,
			#000 0%,
			#000 52%,
			rgba(0, 0, 0, 0.7) 72%,
			rgba(0, 0, 0, 0.25) 86%,
			transparent 100%
		);
	}
`;

export const Body = styled.div`
	position: relative;
	z-index: 3;
	padding: clamp(4.8rem, 10vw, 10rem) var(--modal-inset) 0;
`;

export const Lead = styled.p`
	margin: 0 0 3.2rem;
	line-height: 1.45;
	&& {
		margin: 0 0 3.2rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: clamp(1.8rem, 4.4vw, 2.4rem);
		font-weight: 400;
		line-height: 1.45;
		text-wrap: balance;
	}
`;

export const Copy = styled.p`
	margin: 0 0 2.4rem;
	line-height: 1.7;
	&& {
		margin: 0 0 2.4rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.6rem;
		font-weight: 400;
		line-height: 1.7;
	}
`;

export const Stack = styled.section`
	position: relative;
	z-index: 3;
	padding: clamp(4.8rem, 10vw, 10rem) var(--modal-inset) 0;
`;

export const StackTitle = styled.h3`
	margin: 0 0 5rem;
	&& {
		margin: 0 0 clamp(2.8rem, 6vw, 5rem);
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(2.6rem, 6vw, 3.6rem);
		font-weight: 500;
		line-height: 1.1;
		text-transform: uppercase;
	}
`;

export const StackGroups = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 4rem 3rem;
	margin-bottom: 5rem;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 4rem;
	}
`;

export const StackGroup = styled.div``;

export const StackGroupLabel = styled.h4`
	margin: 0 0 1.8rem;
	padding-bottom: 1.2rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	&& {
		margin: 0 0 1.8rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.45);
	}
`;

export const ChipGrid = styled.div`
	display: flex;
	flex-direction: column;
`;

export const Chip = styled.div`
	display: grid;
	grid-template-columns: 3.2rem 1fr;
	align-items: baseline;
	gap: 1.2rem;
	padding: 1.1rem 1.2rem 1.1rem 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	cursor: default;
	transition: background-color 0.2s ease, padding-left 0.2s ease;

	&:hover {
		padding-left: 0.8rem;
		background: linear-gradient(90deg, rgba(221, 0, 9, 0.12), transparent 70%);
	}
`;

export const ChipIndex = styled.span`
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.2rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: rgba(255, 255, 255, 0.28);
	transition: color 0.2s ease;

	${Chip}:hover & {
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}
`;

export const ChipName = styled.span`
	font-family: var(--ibm-plex-sans), Arial, sans-serif;
	font-size: 1.8rem;
	font-weight: 500;
	letter-spacing: 0.01em;
`;

export const Process = styled.section`
	position: relative;
	z-index: 3;
	padding: clamp(4rem, 8vw, 8rem) var(--modal-inset) 0;
`;

export const ProcessTitle = styled.h3`
	margin: 0 0 2.4rem;
	&& {
		margin: 0 0 2.4rem;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(2.6rem, 6vw, 3.6rem);
		font-weight: 500;
		line-height: 1.1;
		text-transform: uppercase;
	}
`;

export const ProcessList = styled.div`
	display: flex;
	flex-direction: column;
`;

export const ProcessStep = styled.div`
	margin-top: 2rem;
	display: grid;
	grid-template-columns: 5.6rem minmax(14rem, 0.8fr) minmax(0, 1.6fr);
	gap: 0 2.4rem;
	align-items: baseline;
	padding: 1.6rem 0;
	border-top: 1px solid rgba(255, 255, 255, 0.12);

	&:first-child {
		border-top: none;
	}

	@media (max-width: 800px) {
		grid-template-columns: 4.4rem 1fr;
		gap: 0.4rem 1.6rem;
		padding: 1.4rem 0;
	}
`;

export const ProcessIndex = styled.span`
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem;
	font-weight: 700;
	letter-spacing: 0.14em;
	color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
`;

export const ProcessName = styled.h4`
	margin: 0;
	&& {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: 2.2rem;
		font-weight: 500;
		line-height: 1.15;
		text-transform: uppercase;
	}
`;

export const ProcessText = styled.p`
	margin: 0;
	max-width: 42ch;
	&& {
		margin: 0;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.4rem;
		font-weight: 400;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.72);
	}

	@media (max-width: 800px) {
		grid-column: 2;
	}
`;
