// Imports
// ------------
import { Header, bpd } from '@tackl';
import {} from '@tackl/type';
import styled, { css } from 'styled-components';

// Exports
// ------------
export const Jacket = styled(Header)<{ $visible?: boolean; $modalOpen?: boolean; $menuOpen?: boolean }>(
	props => css`
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 95;
		display: flex;
		align-items: center;
		justify-content:center;
		padding: 60px 60px 0 60px;
		pointer-events: none;
		opacity: ${props.$visible ? 1 : 0};
		transition: opacity 500ms ease-out;

		${bpd.l`
			/* Stay under minigame HUD unless a modal or the hamburger panel needs the chrome on top. */
			z-index: ${props.$visible && (props.$modalOpen || props.$menuOpen) ? 2202 : 95};
			padding: 35px 3rem 0;
			align-items: center;
			min-height: calc(35px + 40px);
		`}
		&:before {
			content:"";
			position:absolute;
			inset:0 0 auto 0;
			height:200px;
			background: linear-gradient(180deg, #000,rgba(0, 0, 0, 0));
			z-index:-1;
			pointer-events: none;
		}
	`
);

export const Logo = styled.img`
	width: 161px;
	height:24px;
	display: block;
	pointer-events: none;

	${bpd.m`
		width: 120px;
		height: auto;
	`}
`;

export const Brand = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
`;

export const HeaderClose = styled.button`
	display: none;
	appearance: none;
	margin: 0;
	padding: 0.8rem 0 0;
	border: 0;
	background: transparent;
	cursor: pointer;
	pointer-events: auto;
	position: absolute;
	top: calc(100% + 15px);
	left: 50%;
	transform: translateX(-50%);
	z-index: 2;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1;
	text-transform: uppercase;
	color: #fff;
	white-space: nowrap;

	${bpd.l`
		display: none;

		&[data-visible='true'] {
			display: block;
		}
	`}
`;

const headerLink = css`
	appearance: none;
	border: 0;
	background: transparent;
	padding: 0;
	pointer-events: auto;
	cursor: pointer;
	color: inherit;
	text-align: inherit;

	&:focus-visible {
		outline: 1px solid ${props => props.theme.colors.brand.bc5?.[100] || '#DD0009'};
		outline-offset: 6px;
	}
`;

export const Slogan = styled.button`
	margin-right:auto;
	width:250px;
	${headerLink}
	${bpd.l`
		display:none;
	`}
	h2 {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size:18px;
		font-weight:400;
		line-height: 1.15;
	}
	h3 {
		margin: 3px 0 0;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size:12px;
		font-weight:700;
		line-height: 1.2;
		text-transform: uppercase;
		color: ${props => props.theme.colors.brand.bc5?.[100]};
	}
`;

export const CTA = styled.button`
	margin-left:auto;
	width:250px;
	${headerLink}
	text-align:right;

	${bpd.l`
		display:none;
	`}
	h2,
	h3 {
		text-align:right;
	}
	h2 {
		margin: 0;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-size:18px;
		font-weight:400;
		line-height: 1.15;
	}
	h3 {
		margin: 3px 0 0;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size:12px;
		font-weight:700;
		line-height: 1.2;
		text-transform: uppercase;
		color: ${props => props.theme.colors.brand.bc5?.[100]};
	}
`;

export const Line = styled.span`
	position: relative;
	display: block;
	overflow: hidden;
	height: 1.15em;
	white-space: nowrap;

	> span {
		display: block;
		white-space: nowrap;

		&:last-child {
			position: absolute;
			inset: 0;
		}
	}

	.word {
		display: inline-block;
		white-space: nowrap;
	}

	.char {
		display: inline-block;
		will-change: transform;
	}
`;