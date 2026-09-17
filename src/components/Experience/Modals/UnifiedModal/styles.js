import styled, { keyframes } from 'styled-components';

export const Overlay = styled.div`
	--modal-shell-ms: 1000;
	--modal-shell-ease: cubic-bezier(0.78, 0, 0.22, 1);
	--modal-ui-delay-ms: 520;
	--content-open-delay-ms: 520;
	--content-open-ms: 900;
	--content-in-ms: 520;
	--content-out-ms: 460;

	/* The single horizontal rhythm every modal page aligns to. Content styles
	   read this instead of hard-coding an inset, so one ladder scales them all. */
	--modal-inset: 20rem;

	position: fixed;
	inset: 0;
	z-index: 2000;
	display:flex;
	pointer-events: none;

	/* Above 1400 the panel is wide enough that 20rem reads as designed; below it
	   the inset was eating more width than the copy it framed. */
	@media (max-width: 1400px) {
		--modal-inset: 12rem;
	}
	/* Below here the sidebar becomes a top bar and content goes full-bleed. */
	@media (max-width: 1024px) {
		--modal-inset: 6rem;
		flex-direction: column;
	}
	@media (max-width: 700px) {
		--modal-inset: 2.4rem;
	}

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
		opacity: 0;
		transition: opacity calc(var(--modal-shell-ms) * 1ms) ease;
	}
	&[data-open='true'] {
		pointer-events: auto;
	}
	&[data-open='true']::before {
		opacity: 1;
	}
	> * {
		position: relative;
		z-index: 1;
	}
`;

export const ModalSidebar = styled.div`
	background:#000;
	width:15vw;
	/* Nav type has a wide min-content, so without this the rail refuses to
	   shrink and pushes the content panel off screen. */
	min-width:20rem;
	flex:0 0 auto;
	height:100%;
	transition: transform calc(var(--modal-shell-ms) * 1ms) var(--modal-shell-ease);
	will-change: transform;
	transform: translateX(-100%);
	display:flex;
	flex-direction:column;
	&[data-open='true'] {
		transform: translateX(0);
	}

	/* Header + hamburger take over chrome below this width. */
	@media (max-width: 1024px) {
		display: none;
	}
`;

export const ContentArea = styled.div`
	background:#000;
	width:55vw;
	max-width:1200px;
	height:100%;
	margin-left:auto;
	position:relative;
	overflow: hidden;

	@media (max-width: 1024px) {
		width:100%;
		max-width:none;
		height:auto;
		flex:1 1 auto;
		min-height:0;
		margin-left:0;
	}
	transition: transform calc(var(--modal-shell-ms) * 1ms) var(--modal-shell-ease);
	will-change: transform;
	transform: translateX(100%);
	&[data-open='true'] {
		transform: translateX(0);
	}
	&:before {
		content:"";
		display:block;
		position:fixed;
		top:0;
		left:0;
		right:0;
		height:15rem;
		background: linear-gradient(180deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
		z-index:2;
		pointer-events: none;
	}
	&[data-modal='about']:before,
	&[data-modal='projects']:before,
	&[data-modal='casestudy']:before {
		display: none;
	}
	&:after {
		content:"";
		display:block;
		position:fixed;
		bottom:0;
		left:0;
		right:0;
		height:15rem;
		background: linear-gradient(0deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
		z-index:2;
		pointer-events: none;
	}
	&[data-modal='about']:after,
	&[data-modal='projects']:after,
	&[data-modal='casestudy']:after,
	&[data-modal='services']:after,
	&[data-modal='contact']:after {
		display: none;
	}
`;

export const CloseButton = styled.button`
	appearance: none;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	width: 28px;
	height: 28px;
	position: absolute;
	top: 24px;
	right: 24px;
	cursor: pointer;
	z-index: 2;
	transition: transform 0.4s ease-out, opacity 0.2s ease;

	/* Keeps the 28px dot mark but gives touch a 44px target. */
	&::before {
		content: '';
		position: absolute;
		inset: -8px;
	}

	@media (max-width: 700px) {
		top: 16px;
		right: 16px;
	}

	@media (max-width: 1024px) {
		display: none;
	}

	&[data-hidden='true'] {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}

	&:hover {
		transform: rotate(90deg) !important;
	}

	i {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 100%;
		background: #fff;
		pointer-events: none;
		transition: background-color 0.3s ease;

		&:nth-child(1) {
			top: 0;
			left: 0;
		}
		&:nth-child(2) {
			top: 0;
			right: 0;
		}
		&:nth-child(3) {
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
		&:nth-child(4) {
			bottom: 0;
			left: 0;
		}
		&:nth-child(5) {
			bottom: 0;
			right: 0;
		}
	}

	&:hover i {
		background: ${props => props.theme?.colors?.brand?.bc5?.[100] || '#DD0009'};
	}
`;

export const Logo = styled.div`
	margin: 50px 0 0 30px;
	img {
		display:inline-block;
	}

	@media (max-width: 1024px) {
		margin:0;
		flex:0 0 auto;
		img {
			display:block;
			height:2.4rem;
			width:auto;
		}
	}

	@media (max-width: 700px) {
		img {
			height:2rem;
		}
	}

	&[data-open='true'] {
		animation: LogoPopIn 1s cubic-bezier(0.22, 1, 0.36, 1)
			0.6s both;
	}
	@keyframes LogoPopIn {
		from { transform: translateY(-100%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
`;

export const BottomContent = styled.div`
	margin-top:auto;

	@media (max-width: 1024px) {
		margin-top:0;
		margin-left:auto;
		display:flex;
		align-items:center;
		gap:2.4rem;
		min-width:0;
	}
`;

const navLinkReveal = keyframes`
	from { transform: translateX(-100%); opacity: 0; }
	to { transform: translateX(0); opacity: 1; }
`;

export const NavLinks = styled.div`
	padding:30px;
	overflow: hidden;

	@media (max-width: 1024px) {
		padding:0;
		display:flex;
		align-items:center;
		gap:2rem;
		min-width:0;
		/* Safety valve for narrow phones — the four labels can outrun the bar. */
		overflow-x:auto;
		overflow-y:hidden;
		-webkit-overflow-scrolling:touch;
		scrollbar-width:none;
		&::-webkit-scrollbar {
			display:none;
		}
	}

	@media (max-width: 700px) {
		gap:1.4rem;
	}

	&[data-open='true'] > *:nth-child(1) {
		animation: ${navLinkReveal} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
	}
	&[data-open='true'] > *:nth-child(2) {
		animation: ${navLinkReveal} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
	}
	&[data-open='true'] > *:nth-child(3) {
		animation: ${navLinkReveal} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
	}
	&[data-open='true'] > *:nth-child(4) {
		animation: ${navLinkReveal} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
	}
`;

export const NavLink = styled.button`
	display:block;
	width:100%;
	background:transparent;
	border:none;
	text-align:left;
	cursor:pointer;
	font-size:24px;
	text-transform:uppercase;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-weight:400;
	padding:14px 0;
	color:#fff;
	transition: color 0.25s ease, padding 0.5s cubic-bezier(0.614, -0.429, 0.515, 1.386);
	position:relative;
	&:before {
		content:"";
		display:block;
		position:absolute;
		height:20px;
		width:9px;
		transform:translateY(-50%) scale(0);
		left:0;
		top:50%;
		border-radius:5px;
		background:${props => props.theme?.colors?.brand?.bc5?.[100]};
		transition: transform 0.5s cubic-bezier(0.614, -0.429, 0.515, 1.386);
	}
	&[data-active='true'] {
		color:${props => props.theme?.colors?.brand?.bc5?.[100] ?? '#fff'};
		padding-left:24px;
		&:before {
			transform:translateY(-50%) scale(1);
		}
	}
	&:hover {
		color:${props => props.theme?.colors?.brand?.bc5?.[100]};
	}

	@media (max-width: 1024px) {
		width:auto;
		flex:0 0 auto;
		padding:6px 0;
		font-size:1.5rem;
		white-space:nowrap;
		/* The rail's dot-and-indent marker doesn't read on a horizontal bar. */
		&:before {
			display:none;
		}
		&[data-active='true'] {
			padding-left:0;
		}
	}

	@media (max-width: 700px) {
		font-size:1.3rem;
	}
`;

export const SidebarCTA = styled.div`
	border-top:1px solid #3B3B3B;
	margin-inline:30px;
	padding:10px 0;

	@media (max-width: 1024px) {
		border-top:0;
		margin-inline:0;
		padding:0;
		flex:0 0 auto;
	}

	/* Below this the bar can't hold it; the in-content quote banners cover the CTA. */
	@media (max-width: 700px) {
		display:none;
	}

	&[data-open='true'] {
		animation: SidebarPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)
			0.6s both;
	}
	@keyframes SidebarPopIn {
		from { transform: translateX(-100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
`;

export const CTAButton = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	appearance: none;
	border: 0;
	background: transparent;
	color: inherit;
	text-align: left;
	cursor: pointer;
	font-family: var(--ibm-plex-mono), ui-monospace, monospace;
	font-size: 18px;
	position: relative;
	padding: 15px 0;
	transition: color 0.25s ease;

	@media (max-width: 1024px) {
		font-size: 1.4rem;
		padding: 6px 0;
	}

	span {
		min-width: 0;
	}

	i {
		flex: 0 0 5px;
		width: 5px;
		height: 5px;
		border-radius: 100%;
		background: ${(props) => props.theme?.colors?.brand?.bc5?.[100]};
		box-shadow:
			-5px -6px 0 0 ${(props) => props.theme?.colors?.brand?.bc5?.[100]},
			-5px 6px 0 0 ${(props) => props.theme?.colors?.brand?.bc5?.[100]};
		transition: box-shadow 0.3s cubic-bezier(0.66, 0, 0.34, 1);
		pointer-events: none;
	}

	&:hover {
		color: ${(props) => props.theme?.colors?.brand?.bc5?.[100]};
		i {
			box-shadow:
				0 0 0 0 ${(props) => props.theme?.colors?.brand?.bc5?.[100]},
				0 0 0 0 ${(props) => props.theme?.colors?.brand?.bc5?.[100]};
		}
	}
`;

export const RobotSidebar = styled.div`
	aspect-ratio: 1/1;
	margin-top:50px;
	canvas {
		display:block;
	}

	@media (max-width: 1024px) {
		display:none;
	}
	&[data-open='true'] {
		animation: RobotPopIn 0.8s cubic-bezier(0, 0.549, 0.231, 1)
			0.6s both;
	}
	@keyframes RobotPopIn {
		from { transform: translateY(100%);  }
		to { transform: translateY(0); }
	}
`;

export const PopupContent = styled.div`
	position: absolute;
	inset: 0;
	overflow: hidden;
	overscroll-behavior: none;
	touch-action: pan-y;
	background: transparent;
`;

const contentOpen = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const contentInDefault = keyframes`
	from { opacity: 0.99; }
	to { opacity: 1; }
`;

const contentOutDefault = keyframes`
	from { opacity: 1; }
	to { opacity: 0.99; }
`;

export const PopupContentInner = styled.div`
	position: relative;
	z-index: 1;
	min-height: 100%;
	--modal-gutter: var(--modal-inset);
	padding: var(--modal-gutter);
	will-change: opacity;

	&[data-modal='about'],
	&[data-modal='projects'],
	&[data-modal='casestudy'],
	&[data-modal='services'],
	&[data-modal='contact'] {
		--modal-gutter: 0px;
		padding: 0;
	}

	&[data-prereveal='true'][data-transition='idle'] {
		opacity: 0;
	}

	&[data-hold='true'] {
		visibility: hidden;
		pointer-events: none;
	}

	/* Global transition hooks */
	&[data-transition='open'] {
		animation: ${contentOpen} calc(var(--content-open-ms) * 1ms) cubic-bezier(0.22, 1, 0.36, 1)
			calc(var(--content-open-delay-ms) * 1ms) both;
	}
	&[data-transition='in'] {
		animation: ${contentInDefault} calc(var(--content-in-ms) * 1ms) cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	&[data-transition='out'] {
		animation: ${contentOutDefault} calc(var(--content-out-ms) * 1ms) cubic-bezier(0.36, 0, 0.66, -0.56) both;
	}

	/* Optional per-modal overrides (examples)
	&[data-modal='about'][data-transition='open'] { animation: ... }
	&[data-modal='about'][data-transition='in'] { animation: ... }
	&[data-modal='about'][data-transition='out'] { animation: ... }
	*/

	font-family: var(--ibm-plex-mono), ui-monospace, monospace;
	font-weight:400;
	h1, h2, h3, h4 {
		font-family: var(--ibm-plex-sans)
	}
	h1, h2 {
		font-size:clamp(3.2rem, 7vw, 5.2rem);
		font-weight:400;
	}
	h5 {
		font-family: var(--ibm-plex-mono), ui-monospace, monospace;
		font-size:clamp(1.8rem, 4.5vw, 2.4rem);
		font-weight:400;
		line-height:1.3;
		margin-bottom:clamp(2.4rem, 6vw, 5rem);
	}
	h6 {
		font-family: var(--kode-mono), ui-monospace, monospace;
		color:${props => props.theme?.colors?.brand?.bc5?.[100]};
		font-size:clamp(1.3rem, 3.4vw, 1.6rem);
		font-weight:700;
		text-transform:uppercase;
		margin-bottom:clamp(2.4rem, 6vw, 5rem);
	}
	p {
		margin-bottom:25px;
		font-family: var(--ibm-plex-mono), ui-monospace, monospace;
		font-weight:400;
		font-size:clamp(1.5rem, 3.6vw, 1.8rem);
	}
`;

export const ScrollBar = styled.div`
	position: absolute;
	left: 0;
	top: 0;
	width: 3px;
	height: 100%;
	background: #3B3B3B;
	pointer-events: none;
	z-index: 5;
	overflow: hidden;
	transform-origin: left center;
	transform: scaleX(1);
	&[data-open='true'] {
		animation: scrollBarGrowIn calc(var(--content-open-ms) * 1ms) cubic-bezier(0.22, 1, 0.36, 1)
			calc(var(--modal-ui-delay-ms) * 1ms) both;
	}
	@keyframes scrollBarGrowIn {
		from { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
		to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
	}
	> div {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: var(--scroll-thumb-height, 50px);
		background:${props => props.theme?.colors?.brand?.bc5?.[100]};
	}
`;