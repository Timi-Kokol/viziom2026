import styled from 'styled-components';
import { CTAButton } from '../UnifiedModal/styles';
import { CONTENT_INSET, Hero, HeroCopy, HeroTitle, HeroKicker } from './shared.styles';

export { Hero, HeroCopy, HeroTitle, HeroKicker };

export const PopupContentWrapper = styled.div`
	--content-inset: ${CONTENT_INSET};

	position: relative;
	overflow: hidden;
`;

/* Sized so the header and the whole carousel still land in one viewport. */
export const Stage = styled.section`
	position: relative;
	height: 56vh;
	min-height: 380px;
	max-height: 640px;
	overflow: hidden;
	background: #000;
	padding-top: 1.4rem;

	/* Landscape phones have less height than the min, which would clip the meta. */
	@media (max-height: 520px) {
		min-height: 260px;
	}
`;

export const ActiveMeta = styled.div`
	position: absolute;
	left: var(--content-inset);
	bottom: 6%;
	z-index: 4;
	width: max-content;
	max-width: calc(100% - var(--content-inset) - 4rem);
	text-align: left;
	pointer-events: none;

	@media (max-width: 1024px) {
		right: var(--content-inset);
		width: auto;
		max-width: none;
	}
`;

export const MoreButton = styled(CTAButton)`
	pointer-events: none;
	padding: 0;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #fff;
`;

export const MetaLink = styled.button`
	display: flex;
	align-items: flex-end;
	gap: 2.4rem;
	padding: 0;
	border: 0;
	background: transparent;
	font: inherit;
	color: inherit;
	text-align: left;
	text-decoration: none;
	cursor: pointer;
	pointer-events: auto;

	/* Title and meta row can't share a line once the panel goes full width. */
	@media (max-width: 1024px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 1.2rem;
		width: 100%;
	}

	&:hover ${MoreButton},
	&[data-hover='true'] ${MoreButton} {
		color: #fff;

		span:before {
			top: 50%;
			right: 0;
			transform: translateY(-50%);
		}

		span:after {
			bottom: 50%;
			right: 0;
			transform: translateY(50%);
		}
	}
`;

export const TitleStack = styled.div`
	display: grid;
	overflow: hidden;
	isolation: isolate;
	clip-path: inset(0);
`;

export const ProjectName = styled.h3`
	grid-area: 1 / 1;
	margin: 0;
	overflow: hidden;
	clip-path: inset(0);
	height: 0.9em;
	white-space: nowrap;
	&& {
		margin: 0;
		overflow: hidden;
		height: 0.9em;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size: clamp(3.2rem, 9vw, 6.4rem);
		font-weight: 500;
		line-height: 0.9;
		letter-spacing: -0.03em;
		text-transform: uppercase;
		color: #fff;
	}

	.line {
		display: block;
		overflow: hidden;
		height: 100%;
	}

	.char {
		display: inline-block;
		will-change: transform;
	}
`;

export const MetaRow = styled.div`
	display: flex;
	align-items: center;
	gap: 1.4rem;
	flex: 0 0 auto;
	width: 26rem;
	padding-bottom: 0.4rem;

	@media (max-width: 1024px) {
		width: 100%;
		max-width: 26rem;
	}
`;

export const ProjectRule = styled.span`
	display: block;
	flex: 1;
	height: 1px;
	transform-origin: left center;
	background: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
`;

export const MetaSide = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1.4rem;
	flex-shrink: 0;
`;

export const IndexStack = styled.div`
	display: grid;
	overflow: hidden;
	isolation: isolate;
	clip-path: inset(0);
`;

export const ProjectIndex = styled.span`
	grid-area: 1 / 1;
	display: block;
	overflow: hidden;
	clip-path: inset(0);
	height: 1em;
	white-space: nowrap;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1;
	color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};

	.line {
		display: block;
		overflow: hidden;
		height: 100%;
	}

	.char {
		display: inline-block;
		will-change: transform;
	}
`;

