import styled, { css, keyframes } from 'styled-components';
import { Hero, HeroCopy, HeroTitle, HeroKicker, wipeCta } from './shared.styles';

export { Hero, HeroCopy, HeroTitle, HeroKicker };

export const PopupContentWrapper = styled.div`
	position: relative;
	overflow: visible;
`;

export const Details = styled.section`
	position: relative;
	z-index: 3;
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 0 var(--modal-inset);
	border-top: 1px solid rgba(255, 255, 255, 0.12);
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
	}
`;

export const DetailsCol = styled.div`
	padding: 4.8rem 0;

	&:last-child {
		padding-left: 6rem;
		border-left: 1px solid rgba(255, 255, 255, 0.12);
	}

	@media (max-width: 800px) {
		padding: 3.2rem 0;

		&:last-child {
			padding-left: 0;
			border-left: 0;
			border-top: 1px solid rgba(255, 255, 255, 0.12);
		}
	}
`;

export const Logo = styled.img`
	display: block;
	width: 16rem;
	height: auto;
	margin-bottom: 2.4rem;
`;

export const Address = styled.address`
	margin: 0;
	font-style: normal;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.5rem;
	font-weight: 400;
	line-height: 1.65;
	color: rgba(255, 255, 255, 0.92);
	white-space: pre-line;
`;

export const ContactLinks = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.6rem;
	padding-top: 0.4rem;
`;

export const ContactLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 1.2rem;
	width: fit-content;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.5rem;
	font-weight: 400;
	line-height: 1.4;
	color: #fff;
	text-decoration: none;
	transition: color 0.2s ease;

	svg {
		flex-shrink: 0;
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}

	&:hover {
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}

	&[data-underline='true'] {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
`;

export const FormSection = styled.section`
	position: relative;
	z-index: 3;
	padding: clamp(4rem, 8vw, 6rem) var(--modal-inset) clamp(6rem, 12vw, 10rem);
`;

export const FormIntro = styled.div`
	margin-bottom: 4rem;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.6rem;
	font-weight: 400;
	line-height: 1.65;
	color: rgba(255, 255, 255, 0.92);

	p {
		margin: 0 0 0.4rem;

		&:last-child {
			margin-bottom: 0;
		}
	}
`;

export const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;

	@media (max-width: 800px) {
		grid-template-columns: 1fr;
	}
`;

const fieldInvalidBorder = props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009';

const contactSendLine = keyframes`
	0% {
		transform: translateX(0);
		opacity: 0;
	}
	14% {
		opacity: 1;
	}
	86% {
		opacity: 1;
	}
	100% {
		transform: translateX(320%);
		opacity: 0;
	}
`;

const sendingFieldStyles = css`
	&[data-sending='true'] {
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 1px;
			background: rgba(255, 255, 255, 0.12);
			z-index: 2;
			pointer-events: none;
		}

		&::before {
			content: '';
			position: absolute;
			bottom: 0;
			left: -35%;
			width: 35%;
			height: 2px;
			background: linear-gradient(
				90deg,
				transparent 0%,
				${fieldInvalidBorder} 48%,
				${fieldInvalidBorder} 52%,
				transparent 100%
			);
			animation: ${contactSendLine} 1.45s cubic-bezier(0.42, 0.08, 0.2, 1) infinite;
			z-index: 3;
			pointer-events: none;
		}
	}
`;

export const FieldWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	min-width: 0;
`;

export const Field = styled.label`
	position: relative;
	display: block;
	border: 1px solid rgba(255, 255, 255, 0.28);
	padding: 2.2rem 1.6rem 1.2rem;
	background: transparent;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&:focus-within {
		border-color: rgba(255, 255, 255, 0.55);
	}

	&[data-invalid='true'] {
		border-color: ${fieldInvalidBorder};
		box-shadow: inset 0 0 0 1px ${fieldInvalidBorder};
	}

	&[data-invalid='true']:focus-within {
		border-color: ${fieldInvalidBorder};
	}

	span {
		position: absolute;
		top: 0;
		left: 1.2rem;
		transform: translateY(-50%);
		padding: 0 0.5rem;
		background: #000;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: 400;
		line-height: 1;
		color: rgba(255, 255, 255, 0.72);
		pointer-events: none;
		transition: color 0.2s ease;
	}

	&[data-invalid='true'] > span {
		color: ${fieldInvalidBorder};
	}

	span[data-required='true']::after {
		content: ' *';
		color: ${fieldInvalidBorder};
	}

	input,
	textarea {
		display: block;
		width: 100%;
		border: 0;
		padding: 0;
		background: transparent;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1.4;
		color: #fff;
		outline: none;
		appearance: none;
	}

	textarea {
		min-height: 14rem;
		resize: vertical;
	}

	/* Under 16px iOS Safari zooms the page when the field takes focus. */
	@media (max-width: 700px) {
		padding: 2rem 1.2rem 1.2rem;

		input,
		textarea {
			font-size: 1.6rem;
		}

		textarea {
			min-height: 11rem;
		}
	}

	${sendingFieldStyles}
`;

export const SelectField = styled.div`
	position: relative;
	display: block;
	border: 1px solid rgba(255, 255, 255, 0.28);
	padding: 2.2rem 1.6rem 1.2rem;
	background: #000;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&[data-open='true'],
	&:focus-within {
		border-color: rgba(255, 255, 255, 0.55);
	}

	&[data-invalid='true'] {
		border-color: ${fieldInvalidBorder};
		box-shadow: inset 0 0 0 1px ${fieldInvalidBorder};
	}

	&[data-invalid='true'][data-open='true'],
	&[data-invalid='true']:focus-within {
		border-color: ${fieldInvalidBorder};
	}

	> span {
		position: absolute;
		top: 0;
		left: 1.2rem;
		transform: translateY(-50%);
		padding: 0 0.5rem;
		background: #000;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: 400;
		line-height: 1;
		color: rgba(255, 255, 255, 0.72);
		pointer-events: none;
		z-index: 1;
		transition: color 0.2s ease;
	}

	&[data-invalid='true'] > span {
		color: ${fieldInvalidBorder};
	}

	> span[data-required='true']::after {
		content: ' *';
		color: ${fieldInvalidBorder};
	}

	${sendingFieldStyles}
`;

export const AttachmentField = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 1.2rem;
	border: 1px dashed rgba(255, 255, 255, 0.28);
	padding: 2.2rem 1.6rem 1.6rem;
	background: rgba(255, 255, 255, 0.02);
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&[data-invalid='true'] {
		border-color: ${fieldInvalidBorder};
		border-style: solid;
		box-shadow: inset 0 0 0 1px ${fieldInvalidBorder};
	}

	> span:first-child {
		position: absolute;
		top: 0;
		left: 1.2rem;
		transform: translateY(-50%);
		padding: 0 0.5rem;
		background: #000;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: 400;
		line-height: 1;
		color: rgba(255, 255, 255, 0.72);
	}

	&[data-invalid='true'] > span:first-child {
		color: ${fieldInvalidBorder};
	}

	${sendingFieldStyles}
`;

export const OptionalTag = styled.em`
	margin-left: 0.6rem;
	font-style: normal;
	font-size: 1.2rem;
	color: rgba(255, 255, 255, 0.42);
	text-transform: lowercase;
`;

export const AttachmentHint = styled.p`
	margin: 0;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem !important;
	font-weight: 400;
	line-height: 1.5;
	color: rgba(255, 255, 255, 0.52);
`;

export const AttachmentActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 1rem;
`;

export const AttachmentTrigger = styled.button`
	padding: 1rem 1.4rem;
	border: 1px solid rgba(255, 255, 255, 0.35);
	background: transparent;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.3rem;
	font-weight: 400;
	line-height: 1;
	color: #fff;
	cursor: pointer;
	transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;

	&:hover:not(:disabled) {
		border-color: ${fieldInvalidBorder};
		color: ${fieldInvalidBorder};
	}

	&:disabled {
		opacity: 0.45;
		cursor: default;
	}

	&:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
`;

export const FileList = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	margin: 0;
	padding: 0;
	list-style: none;
`;

export const FileItem = styled.li`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.2rem;
	padding: 1rem 1.2rem;
	border: 1px solid rgba(255, 255, 255, 0.16);
	background: rgba(0, 0, 0, 0.35);
`;

export const FileMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	min-width: 0;
`;

export const FileName = styled.span`
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.3rem;
	font-weight: 400;
	line-height: 1.35;
	color: #fff;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const FileSize = styled.span`
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.1rem;
	font-weight: 400;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.52);
`;

export const FileRemove = styled.button`
	flex-shrink: 0;
	padding: 0.4rem 0.8rem;
	border: 0;
	background: transparent;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.1rem;
	font-weight: 400;
	line-height: 1;
	color: rgba(255, 255, 255, 0.62);
	text-decoration: underline;
	text-underline-offset: 0.18em;
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover:not(:disabled) {
		color: ${fieldInvalidBorder};
	}

	&:disabled {
		opacity: 0.45;
		cursor: default;
	}
`;

export const SelectTrigger = styled.button`
	position: relative;
	display: block;
	width: 100%;
	padding: 0 2.4rem 0 0;
	border: 0;
	background: transparent;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.5rem;
	font-weight: 400;
	line-height: 1.4;
	color: #fff;
	text-align: left;
	cursor: pointer;
	outline: none;

	&[data-placeholder='true'] {
		color: rgba(255, 255, 255, 0.35);
	}

	@media (max-width: 700px) {
		font-size: 1.6rem;
	}

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		right: 1.6rem;
		width: 0.8rem;
		height: 0.8rem;
		border-right: 1.5px solid rgba(255, 255, 255, 0.55);
		border-bottom: 1.5px solid rgba(255, 255, 255, 0.55);
		transform: translateY(-65%) rotate(45deg);
		transition: transform 0.15s ease;
		pointer-events: none;
	}

	&[data-open='true']::after {
		transform: translateY(-35%) rotate(-135deg);
	}
`;

export const SelectMenu = styled.ul`
	position: absolute;
	top: 100%;
	left: -1px;
	right: -1px;
	z-index: 20;
	margin: 0;
	padding: 0;
	list-style: none;
	border: 1px solid rgba(255, 255, 255, 0.55);
	border-top: 0;
	background: #000;
`;

export const SelectOption = styled.li`
	button {
		display: block;
		width: 100%;
		padding: 1.2rem 1.6rem;
		border: 0;
		background: transparent;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1.4;
		color: #fff;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;

		&:hover {
			background: rgba(221, 0, 9, 0.12);
		}
	}

	&[data-active='true'] button {
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}
`;

export const Submit = styled.button`
	${wipeCta}
	width: 100%;
	margin-top: 0.4rem;
	padding: 1.8rem 2rem;
	letter-spacing: 0.14em;

	&:disabled {
		opacity: 0.92;
	}

	.send-bar {
		display: none;
	}

	&[data-sending='true'] .send-bar {
		display: block;
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		height: 2px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.22);
		pointer-events: none;
	}

	&[data-sending='true'] .send-bar::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: -35%;
		width: 35%;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.95) 48%,
			rgba(255, 255, 255, 0.95) 52%,
			transparent 100%
		);
		animation: ${contactSendLine} 1.45s cubic-bezier(0.42, 0.08, 0.2, 1) infinite;
	}
`;

export const Honeypot = styled.div`
	position: absolute;
	left: -9999px;
	width: 1px;
	height: 1px;
	overflow: hidden;
`;

export const FormStatus = styled.p`
	margin: 0;
	padding: 1.2rem 1.4rem;
	border: 1px solid rgba(255, 255, 255, 0.16);
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-size: 1.4rem;
	font-weight: 400;
	line-height: 1.5;
	color: rgba(255, 255, 255, 0.78);
	background: rgba(255, 255, 255, 0.03);

	&[data-tone='ok'] {
		border-color: rgba(255, 255, 255, 0.22);
		color: rgba(255, 255, 255, 0.92);
	}

	&[data-tone='err'] {
		border-color: ${fieldInvalidBorder};
		color: ${fieldInvalidBorder};
		background: rgba(221, 0, 9, 0.08);
	}
`;
