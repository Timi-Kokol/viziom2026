import styled, { css } from 'styled-components';
import { wipeCta, wipeCtaGray } from './shared.styles';

const brand = (props: { theme?: { colors?: { brand?: { bc5?: Record<number, string> } } } }) =>
	props.theme?.colors?.brand?.bc5?.[100] || '#DD0009';

export const Wrapper = styled.div`
	position: relative;
	overflow: visible;
`;

export const Hero = styled.div`
	position: relative;
	width: 100%;
	height: 54vh;
	min-height: 320px;
	max-height: 640px;
	overflow: hidden;
	background: #000;

	&::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 28%;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, #000 100%);
		pointer-events: none;
	}
`;

export const HeroImage = styled.img`
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center;
	will-change: transform, opacity;
`;

export const HeroCopy = styled.div`
	position: absolute;
	inset: 0;
	z-index: 2;
	display: grid;
	place-items: center;
	pointer-events: none;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	&& {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(5.6rem, 8vw, 9.6rem);
		font-weight: 500;
		line-height: 0.9;
		letter-spacing: -0.03em;
		text-transform: uppercase;
		color: #fff;
		text-shadow: 0 0.8rem 2.4rem rgba(0, 0, 0, 0.35);
	}
`;

export const Body = styled.div`
	position: relative;
	z-index: 3;
	padding: clamp(4.8rem, 9vw, 8rem) var(--modal-inset) clamp(6.4rem, 12vw, 10rem);
`;

export const Section = styled.section<{ $compact?: boolean }>`
	width: 100%;
	margin: 0;
	padding: ${({ $compact }) => ($compact ? '3.2rem' : '6.4rem')} 0 0;

	&:first-child {
		padding-top: 0;
	}

	&[data-media] + &[data-media] {
		padding-top: 2rem;
	}

	@media (max-width: 800px) {
		padding-top: ${({ $compact }) => ($compact ? '2.4rem' : '4.8rem')};

		&:first-child {
			padding-top: 0;
		}

		&[data-media] + &[data-media] {
			padding-top: 2rem;
		}
	}
`;

export const IntroText = styled.p`
	margin: 0 auto;
	max-width: 64rem;
	&& {
		margin: 0 auto;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.55;
		text-align: center;
		color: #fff;
	}
`;

export const CtaWrap = styled.div`
	display: flex;
	justify-content: center;
`;

export const FillButton = styled.a`
	${wipeCta}
	min-width: 22rem;
`;

export const FillButtonEl = styled.button`
	${wipeCta}
	min-width: 22rem;
`;

export const GrayButton = styled.button`
	${wipeCtaGray}
	min-width: 22rem;
`;

export const CtaRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.2rem;
	width: min(72rem, 100%);

	${FillButtonEl},
	${GrayButton} {
		width: 100%;
		min-width: 0;
	}

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
	}
`;

export const MetaGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem 8rem;
	width: 100%;
	max-width: 72rem;

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
		gap: 3.2rem;
	}
`;

export const MetaGroup = styled.div`
	& + & {
		margin-top: 3.2rem;
	}
`;

export const MetaTitle = styled.h2`
	margin: 0 0 1.6rem;
	&& {
		margin: 0 0 1.6rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.4rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: 1.3;
		text-transform: uppercase;
		color: #fff;
	}
`;

export const MetaList = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;
`;

export const MetaItem = styled.li`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	margin: 0 0 1rem;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.5rem;
	font-weight: 400;
	line-height: 1.45;
	color: rgba(255, 255, 255, 0.92);

	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.28em;
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

export const Bullet = styled.span`
	position: relative;
	width: 1rem;
	height: 1rem;
	margin-top: 0.35rem;
	flex-shrink: 0;

	i {
		position: absolute;
		width: 4px;
		height: 4px;
		background: ${brand};

		&:nth-child(1) {
			top: 0;
			left: 0;
		}

		&:nth-child(2) {
			bottom: 0;
			left: 0;
		}

		&:nth-child(3) {
			bottom: 0;
			right: 0;
		}
	}
`;

export const BodyText = styled.p`
	margin: 0;
	max-width: 72rem;
	&& {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: 1.8rem;
		font-weight: 400;
		line-height: 1.6;
		text-align: left;
		color: #fff;
	}
`;

export const TextColumns = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem 8rem;
	width: 100%;
	max-width: 72rem;

	p {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: 1.7rem;
		font-weight: 400;
		line-height: 1.6;
		text-align: left;
		color: rgba(255, 255, 255, 0.92);
	}

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
		gap: 2.4rem;
	}
`;

export const Media = styled.div`
	overflow: hidden;
	background: #111;

	img,
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`;

export const FullMedia = styled(Media)<{ $aspect?: string; $natural?: boolean }>`
	aspect-ratio: ${({ $natural, $aspect }) => ($natural ? 'auto' : $aspect || '16 / 9')};

	${({ $natural }) =>
		$natural &&
		`
		img,
		video {
			height: auto;
			object-fit: contain;
		}
	`}
`;

export const VideoWrap = styled(FullMedia)<{ $autoplay?: boolean }>`
	position: relative;

	${({ $autoplay }) =>
		$autoplay
			? `
		video {
			pointer-events: none;
		}
	`
			: ''}
`;

export const PlayButton = styled.button`
	position: absolute;
	inset: 0;
	z-index: 1;
	display: grid;
	place-items: center;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: #fff;
	cursor: pointer;

	svg {
		width: 8.8rem;
		height: 8.8rem;
		filter: drop-shadow(0 0.6rem 1.6rem rgba(0, 0, 0, 0.4));
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover svg {
		transform: scale(1.06);
	}
`;

export const ImageRow = styled.div<{ $aspect?: string }>`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	width: 100%;

	${Media} {
		min-width: 0;
		aspect-ratio: ${({ $aspect }) => $aspect || '4 / 3'};
	}

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
	}
`;

export const Slider = styled.div`
	position: relative;
	width: 100%;
`;

export const SliderViewport = styled.div`
	position: relative;
	display: grid;
	grid-template-areas: 'slide';
	aspect-ratio: 1 / 1.25;
	overflow: hidden;
	cursor: grab;
	user-select: none;
	touch-action: pan-y;

	&:active {
		cursor: grabbing;
	}
`;

export const SliderSlide = styled.div`
	grid-area: slide;
	position: relative;
	overflow: hidden;
	background: #111;
	will-change: clip-path, transform;
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		will-change: transform;
	}
`;

export const SliderProgress = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 4;
	height: 2px;
	background: rgba(255, 255, 255, 0.16);
	pointer-events: none;

	i {
		display: block;
		width: 100%;
		height: 100%;
		transform: scaleX(0);
		transform-origin: left center;
		background: ${brand};
	}
`;

export const SliderHud = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 3;
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: end;
	gap: 1.6rem;
	padding: 6.4rem 2.4rem 2.2rem;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 100%);
	pointer-events: none;
`;

export const SliderDir = styled.button<{ $side: 'prev' | 'next' }>`
	pointer-events: auto;
	justify-self: ${({ $side }) => ($side === 'prev' ? 'start' : 'end')};
	position: relative;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: #fff;
	cursor: pointer;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.3rem;
	font-weight: 700;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	transition: color 0.25s ease;

	span {
		position: relative;
		display: block;
		padding: ${({ $side }) => ($side === 'prev' ? '0 0 0 2.2rem' : '0 2.2rem 0 0')};
	}

	span::before,
	span::after,
	&::after {
		content: '';
		position: absolute;
		width: 5px;
		height: 5px;
		border-radius: 100%;
		background: ${brand};
		transition: all 0.3s cubic-bezier(0.66, 0, 0.34, 1);
	}

	${({ $side }) =>
		$side === 'next'
			? css`
					span::before {
						top: 1px;
						right: 5px;
					}
					span::after {
						bottom: 1px;
						right: 5px;
					}
					&::after {
						top: 50%;
						right: 0;
						transform: translateY(-50%);
					}
					&:hover {
						color: ${brand};
						span::before {
							top: 50%;
							right: 0;
							transform: translateY(-50%);
						}
						span::after {
							bottom: 50%;
							right: 0;
							transform: translateY(50%);
						}
					}
				`
			: css`
					span::before {
						top: 1px;
						left: 5px;
					}
					span::after {
						bottom: 1px;
						left: 5px;
					}
					&::after {
						top: 50%;
						left: 0;
						transform: translateY(-50%);
					}
					&:hover {
						color: ${brand};
						span::before {
							top: 50%;
							left: 0;
							transform: translateY(-50%);
						}
						span::after {
							bottom: 50%;
							left: 0;
							transform: translateY(50%);
						}
					}
				`}
`;

export const SliderIndex = styled.div`
	display: flex;
	align-items: baseline;
	gap: 0.8rem;
	overflow: hidden;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.3rem;
	font-weight: 700;
	letter-spacing: 0.16em;
	line-height: 1;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.45);
`;

export const SliderIndexCurrent = styled.span`
	display: grid;
	overflow: hidden;
	color: #fff;

	em {
		grid-area: 1 / 1;
		font-style: normal;
		color: ${brand};
	}

	em + em {
		opacity: 0;
	}
`;
