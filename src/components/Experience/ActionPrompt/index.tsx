'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { bpd } from "@tackl";
import { getSoundManager, SOUND_IDS } from '../../../audio';

const TOUCH_ICON_SIZE = 28;

const PromptContainer = styled.div<{ $visible: boolean }>`
	position: fixed;
	bottom: 150px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1000;
	opacity: ${props => props.$visible ? 1 : 0};
	pointer-events: ${props => props.$visible ? 'auto' : 'none'};
	transition: opacity 0.3s ease;
	${bpd.m`
		bottom:190px !important;
	`}
`;

const PromptButton = styled.button`
	width:55px;
	height:55px;
	line-height:55px;
	border:none;
	cursor:pointer;
	overflow:hidden;
	display:inline-block;
	margin:0;
	border:1px solid #fff;
	color:${props => props.theme.colors.brand.bc5?.[100]};
	color:#fff;
	font-size:20px;
	font-family: var(--kode-mono), ui-monospace, monospace;
	font-weight:700;
	text-transform:uppercase;
	position:relative;
	border-radius:5px;
	transition:border-color 0.3s ease;
	&:before, &:after {
		position:absolute;
		top:0;
		left:0;
		width:100%;
		height:100%;
		content:"";
		background:${props => props.theme.colors.brand.bc5?.[100]};
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
	img {
		display: block;
		width: ${TOUCH_ICON_SIZE}px;
		height: ${TOUCH_ICON_SIZE}px;
		margin: 0 auto;
		object-fit: contain;
		pointer-events: none;
	}
	&:hover {
		border-color:${props => props.theme.colors.brand.bc5?.[100]};
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
`;

interface ActionPromptProps {
	visible: boolean;
	label: string;
	onClick: () => void;
}

const ActionPrompt: React.FC<ActionPromptProps> = ({ visible, label, onClick }) => {
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	useEffect(() => {
		setIsTouchDevice(
			Boolean('ontouchstart' in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0))
		);
	}, []);

	return (
		<PromptContainer $visible={visible}>
			<PromptButton
				onMouseEnter={() => getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER)}
				onClick={onClick}
			>
				<span>
					<span>
						{isTouchDevice ? (
							<img src="/icon-touch.svg" alt="Tap" width={TOUCH_ICON_SIZE} height={TOUCH_ICON_SIZE} />
						) : (
							'E'
						)}
					</span>
				</span>
			</PromptButton>
		</PromptContainer>
	);
};

ActionPrompt.displayName = 'ActionPrompt';
export default ActionPrompt;
