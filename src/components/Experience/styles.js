// Imports
// ------------
import styled, { css } from 'styled-components';
import { Section, Div, Button, H2, H3, bpd} from '@tackl';
import {} from '@tackl/type';

// Exports
// ------------
export const Jacket = styled(Section)(
	(props) => css`
		position: relative;
		width: 100%;
		height: 100vh;
	`
);

export const CrashOverlay = styled(Div)(
	(props) => css`
		position: fixed;
		inset: 0;
		z-index: 90;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(15px);
		background: rgba(0, 0, 0, 0.5);
		> div {
			display: flex;
			flex-direction: column;
			align-items: center;
			width:460px;
			max-width:100%;
			padding:20px;
			margin:0 20px;
			padding-top:130px;
		}
	`
);

export const CrashedTitle = styled(H2)(
	(props) => css`
		font-size: 6.6rem;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform: uppercase;
		color: ${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
		margin-bottom: 10px;
		${bpd.m`
			font-size:3.6rem;
		`}
	`
);

export const CrashedMessage = styled(H3)(
	(props) => css`
		font-size: 16px;
		font-weight:700;
		text-transform: uppercase;
		text-align:center;
		color: ${props => props.theme?.colors?.brand?.bc3?.[100] ?? 'rgba(255, 255, 255, 0.85)'};
	`
);

export const CrashedScore = styled(Div)(
	(props) => css`
		padding:15px 0;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		font-size:16px;
		margin-top:10px;
		text-align:center;
		text-transform:uppercase;
		width:100%;
		span {
			background:${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
			font-weight:700;
			padding:10px;
			display:block;
			margin-top:6px;
			font-size:7rem;
			border-radius:5px;
			${bpd.m`
				font-size:4.6rem;
			`}
		}
	`
);

export const CrashedButtons = styled(Div)(
	(props) => css`
		display:flex;
		gap:20px;
		width:100%;
		> button {
			flex: 1 50%;
		}
	`
);

export const HighScoreForm = styled(Div)(
	(props) => css`
		width: 100%;
		max-width: 420px;
		margin-top: 24px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		> div:first-child {
			flex: 0 0 100%;
			font-family: var(--kode-mono), ui-monospace, monospace;
			font-size: 16px;
			font-weight: 700;
			text-transform: uppercase;
			color: #fff;
			margin-bottom: 4px;
			text-align: center;
		}
		> input {
			flex: 1 1 120px;
			min-width: 0;
		}
		> button {
			flex: 0 0 auto;
		}
	`
);

export const HighScoreInput = styled.input(
	(props) => css`
		padding: 12px 16px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-size: 16px;
		font-weight: 600;
		text-transform: uppercase;
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 5px;
		height: 48px;
		transition: all 0.2s ease;
		&::placeholder {
			color: rgba(255, 255, 255, 0.5);
		}
		&:focus {
			border-color: #fff;
			color: #fff;
		}
	`
);

export const HighScoreLeaderboard = styled(Div)(
	(props) => css`
		width: 100%;
		margin-top: 5px;
		font-family: var(--ibm-plex-sans), Arial, sans-serif;
		font-weight:700;
		font-size: 13px;
		text-transform: uppercase;
		color:#fff;
		${bpd.m`
			font-size:12px;
		`}
		ul {
			list-style: none;
			margin: 8px 0 0;
			padding: 0;
			columns:2;
		}
		li {
			display: flex;
			justify-content: space-between;
			gap: 12px;
			padding: 4px 20px 4px 0;
			${bpd.m`
				padding-right:5px;
			`}
		}
		strong {
			color:#fff;
		}
		li span:last-child {
			font-weight: 700;
			font-family: var(--kode-mono), ui-monospace, monospace;
			color: ${props => props.theme?.colors?.brand?.bc5?.[100]};
		}
	`
);

/** Big "CRASH!" text that flashes on screen when you hit an obstacle (before the fall menu). */
export const CrashBanner = styled(Div)(
	(props) => css`
		position: fixed;
		inset: 0;
		z-index: 88;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight: 700;
		font-size: 15rem;
		text-transform: uppercase;
		color: #fff;
		text-shadow: 0 0 40px rgba(255, 0, 0, 0.8), 0 0 80px rgba(200, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
		animation: crashBannerPop 0.4s ease-out forwards;
		@keyframes crashBannerPop {
			0% {
				opacity: 0;
				transform: scale(0.5);
			}
			30% {
				opacity: 1;
				transform: scale(1.15);
			}
			80% {
				opacity: 1;
				transform: scale(1);
			}
			100% {
				opacity: 0;
				transform: scale(0.5);
			}
		}
		${bpd.m`
			font-size:8rem;
		`}
	`
);

export const BackButtonStyled = styled(Button)(
	(props) => css`
		position: fixed;
		top: 130px;
		left: 50%;
		transform: translateX(-50%);
		z-index:96;

		${bpd.m`
			top: 11rem;
			z-index: 97;
		`}
		overflow:hidden;
		padding:15px 35px;
		border:none;
		cursor:pointer;
		display:inline-block;
		margin:0;
		background:#3b3b3b;
		color:#fff;
		font-size:14px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform:uppercase;
		border-radius:5px;
		&:before, &:after {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			content:"";
			background:${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
		}
		&:before {
			width:135%;
			clip-path:polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
			transform:translate3d(-100%, 0,0);
		}
		&:after {
			width:105%;
			transform:translate3d(100%, 0,0);
			transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}
		span {
			display:block;
			position:relative;
			z-index:1;
		}
		> span {
			overflow:hidden;
		}
		&:hover {
			&:before {
				transform:translate3d(0,0,0);
				transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			&:after {
				transform:translate3d(0,0,0);
				transition:transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			> span > span {
				animation: MoveRightInitial 0.2s forwards, MoveRightEnd 0.3s forwards 0.2s;
			}
		}
		@keyframes MoveRightInitial {
			0% {
				transform:translate(0,0,);
			}
			100% {
				transform:translate(105%,0)
			}
		}
		@keyframes MoveRightEnd {
			0% {
				transform:translate(-100%, 0)
			}
			100% {
				transform:translate(0,0);
			}
		}
	`
);

export const ButtonGray = styled(Button)(
	(props) => css`
		padding:15px;
		border:none;
		cursor:pointer;
		overflow:hidden;
		display:inline-block;
		margin:0;
		background:#3b3b3b;
		color:#fff;
		font-size:14px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform:uppercase;
		position:relative;
		border-radius:5px;
		&:before, &:after {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			content:"";
			background:${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
		}
		&:before {
			width:135%;
			clip-path:polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
			transform:translate3d(-100%, 0,0);
		}
		&:after {
			width:105%;
			transform:translate3d(100%, 0,0);
			transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}
		span {
			display:block;
			position:relative;
			z-index:1;
		}
		> span {
			overflow:hidden;
		}
		&:hover {
			&:before {
				transform:translate3d(0,0,0);
				transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			&:after {
				transform:translate3d(0,0,0);
				transition:transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			> span > span {
				animation: MoveRightInitial 0.2s forwards, MoveRightEnd 0.3s forwards 0.2s;
			}
		}
		@keyframes MoveRightInitial {
			0% {
				transform:translate(0,0,);
			}
			100% {
				transform:translate(105%,0)
			}
		}
		@keyframes MoveRightEnd {
			0% {
				transform:translate(-100%, 0)
			}
			100% {
				transform:translate(0,0);
			}
		}
		${bpd.m`
			display:block;
			width:100%;
		`}
	`
);

export const ButtonWhite = styled(Button)(
	(props) => css`
		padding:15px;
		border:none;
		cursor:pointer;
		overflow:hidden;
		display:inline-block;
		margin:0;
		background:#fff;
		color:${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
		font-size:14px;
		font-family: var(--kode-mono), ui-monospace, monospace;
		font-weight:700;
		text-transform:uppercase;
		position:relative;
		border-radius:5px;
		&:before, &:after {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			content:"";
			background:${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
		}
		&:before {
			width:135%;
			clip-path:polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 0% 0%);
			transform:translate3d(-100%, 0,0);
		}
		&:after {
			width:105%;
			transform:translate3d(100%, 0,0);
			transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
		}
		span {
			display:block;
			position:relative;
			z-index:1;
		}
		> span {
			overflow:hidden;
		}
		&:hover {
			&:before {
				transform:translate3d(0,0,0);
				transition:transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			&:after {
				transform:translate3d(0,0,0);
				transition:transform 0.01s 0.3s cubic-bezier(0.7, 0, 0.2, 1);
			}
			> span > span {
				animation: MoveRightInitial 0.2s forwards, MoveRightEnd 0.3s forwards 0.2s;
				color:#fff;
			}
		}
		@keyframes MoveRightInitial {
			0% {
				transform:translate(0,0,);
			}
			100% {
				transform:translate(105%,0)
			}
		}
		@keyframes MoveRightEnd {
			0% {
				transform:translate(-100%, 0)
			}
			100% {
				transform:translate(0,0);
			}
		}
	`
);

export const MinigameScoreWrap = styled(Div)(
	(props) => css`
		position: fixed;
		top: 220px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 130;
		pointer-events: none;
		text-align: center;
		& .score-label {
			font-size: 20px;
			font-family: var(--kode-mono), ui-monospace, monospace;
			font-weight:700;
			color: ${props => props.theme?.colors?.brand?.bc5?.[100] ?? 'rgba(255, 255, 255, 0.95)'};
			text-transform: uppercase;
			margin-bottom: 2px;
		}
		& .score-value {
			font-size: 36px;
			font-weight: 800;
			color: #fff;
			text-shadow: 0 0 20px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5);
			animation: scorePopKeyframes 0.25s ease-out;
		}
		& .speed-bump-msg {
			margin-top: 8px;
			font-size: 18px;
			font-weight: 700;
			font-family: var(--kode-mono), ui-monospace, monospace;
			color: ${props => props.theme?.colors?.brand?.bc3?.[100] ?? 'rgba(255, 255, 255, 0.85)'};
			text-transform:uppercase;
		}
		@keyframes scorePopKeyframes {
			0% { transform: scale(1); }
			40% { transform: scale(1.3); }
			100% { transform: scale(1); }
		}	
	}
	`
);

/** Minigame countdown overlay container (3, 2, 1, GO!) */
export const MinigameCountdownWrap = styled.div`
	position: fixed;
	inset: 0;
	z-index: 140;
	pointer-events: none;
	display: flex;
	align-items: center;
	justify-content: center;
`;

/** Countdown number (3, 2, 1) – appears big then scales down (use key={phase} so animation runs each time) */
export const MinigameCountdownNumber = styled.span`
	display: inline-block;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-weight: 700;
	font-size: 15rem;
	color: #fff;
	text-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);
	animation: countdownScaleDown 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
	@keyframes countdownScaleDown {
		0% { transform: scale(1.6); }
		100% { transform: scale(1); }
	}
	${bpd.m`
		font-size:10rem;
	`}
`;

/** Countdown "GO!" – style separately from 3, 2, 1 (same scale-down animation by default) */
export const MinigameCountdownGo = styled.span`
	display: inline-block;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-weight: 800;
	font-size: 40vh;
	color: #fff;
	text-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);
	animation: countdownScaleDownGo 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
	@keyframes countdownScaleDownGo {
		0% { 
			transform: scale(0.5);
			opacity:1;
		}
		100% { 
			transform: scale(1);
			opacity:0;
		}
	}
	${bpd.m`
		font-size:25vh;
	`}
`;

