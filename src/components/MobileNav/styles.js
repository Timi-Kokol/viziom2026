import styled, { keyframes } from 'styled-components';
import { bpd } from '@tackl';

const brand = (props) => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009';

export const MenuButton = styled.button.attrs({ type: 'button' })`
	display: none;
	appearance: none;
	margin: 0;
	padding: 0;
	border: 1px solid rgba(255, 255, 255, 0.5);
	border-radius: 5px;
	background: rgba(0, 0, 0, 0.4);
	width: 40px;
	height: 40px;
	cursor: pointer;
	pointer-events: auto;
	z-index: 2201;
	-webkit-tap-highlight-color: transparent;
	transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
	opacity: 0.4;

	&:hover,
	&[data-open='true'] {
		opacity: 1;
	}

	&:focus {
		outline: none;
	}

	&:focus-visible {
		outline: 1px solid ${brand};
		outline-offset: 4px;
	}

	${bpd.l`
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		top: 35px;
		right: 3rem;
	`}
`;

export const Burger = styled.span`
	position: relative;
	display: block;
	width: 16px;
	height: 12px;

	i {
		position: absolute;
		left: 0;
		width: 100%;
		height: 2px;
		border-radius: 2px;
		background: #fff;
		transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.2s ease, top 0.35s cubic-bezier(0.22, 1, 0.36, 1);

		&:nth-child(1) {
			top: 0;
		}
		&:nth-child(2) {
			top: 5px;
		}
		&:nth-child(3) {
			top: 10px;
		}
	}

	&[data-open='true'] {
		i:nth-child(1) {
			top: 5px;
			transform: rotate(45deg);
		}
		i:nth-child(2) {
			opacity: 0;
		}
		i:nth-child(3) {
			top: 5px;
			transform: rotate(-45deg);
		}
	}
`;

const panelIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

export const Panel = styled.div`
	display: none;
	position: fixed;
	inset: 0;
	z-index: 2200;
	background: #000;
	pointer-events: none;
	opacity: 0;

	${bpd.l`
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 14rem 3rem 6rem;
	`}

	&[data-open='true'] {
		pointer-events: auto;
		opacity: 1;
		animation: ${panelIn} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
`;

const linkReveal = keyframes`
	from { transform: translateY(1.2rem); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
`;

export const Links = styled.nav`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0;
`;

export const LinkBtn = styled.button`
	display: block;
	width: 100%;
	margin: 0;
	padding: 1.4rem 0;
	border: 0;
	background: transparent;
	text-align: left;
	cursor: pointer;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: clamp(2.8rem, 8vw, 4.2rem);
	font-weight: 400;
	line-height: 1.15;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	color: #fff;
	position: relative;
	transition: color 0.25s ease, padding 0.45s cubic-bezier(0.614, -0.429, 0.515, 1.386);

	&:before {
		content: '';
		display: block;
		position: absolute;
		height: 2rem;
		width: 0.9rem;
		transform: translateY(-50%) scale(0);
		left: 0;
		top: 50%;
		border-radius: 5px;
		background: ${brand};
		transition: transform 0.45s cubic-bezier(0.614, -0.429, 0.515, 1.386);
	}

	&[data-active='true'] {
		color: ${brand};
		padding-left: 2.4rem;

		&:before {
			transform: translateY(-50%) scale(1);
		}
	}

	${Panel}[data-open='true'] & {
		animation: ${linkReveal} 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	${Panel}[data-open='true'] &:nth-child(1) { animation-delay: 0.05s; }
	${Panel}[data-open='true'] &:nth-child(2) { animation-delay: 0.1s; }
	${Panel}[data-open='true'] &:nth-child(3) { animation-delay: 0.15s; }
	${Panel}[data-open='true'] &:nth-child(4) { animation-delay: 0.2s; }
`;

export const MenuCtaWrap = styled.div`
	width: 100%;
	margin: 3.2rem 0 0;
	padding-top: 1rem;
	border-top: 1px solid #3b3b3b;

	${Panel}[data-open='true'] & {
		animation: ${linkReveal} 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
	}
`;

export const MenuCta = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	appearance: none;
	margin: 0;
	padding: 1.8rem 0;
	border: 0;
	background: transparent;
	width: auto;
	max-width: 100%;
	text-align: left;
	cursor: pointer;
	font-family: var(--ibm-plex-mono), ui-monospace, monospace;
	font-size: 1.8rem;
	color: inherit;
	position: relative;
	transition: color 0.25s ease;

	span {
		min-width: 0;
	}

	i {
		flex: 0 0 5px;
		width: 5px;
		height: 5px;
		border-radius: 100%;
		background: ${brand};
		box-shadow:
			-5px -6px 0 0 ${brand},
			-5px 6px 0 0 ${brand};
		transition: box-shadow 0.3s cubic-bezier(0.66, 0, 0.34, 1);
		pointer-events: none;
	}

	&:hover {
		color: ${brand};

		i {
			box-shadow:
				0 0 0 0 ${brand},
				0 0 0 0 ${brand};
		}
	}
`;
