'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Wrapper, CanvasLayer, ButtonGroup } from '@parts/Experience/Introduction/styles';
import { PageContent, ErrorCode, Message, HomeLink } from './styles';

const IntroRobotHead = dynamic(() => import('@parts/Experience/Introduction/IntroRobotHead'), {
	ssr: false,
});

export default function NotFound() {
	const mouseRef = useRef({ x: 0, y: 0 });
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		setIsTouchDevice(
			Boolean('ontouchstart' in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0)),
		);
	}, []);

	const onMouseMove = useCallback((e) => {
		mouseRef.current = {
			x: (e.clientX / window.innerWidth) * 2 - 1,
			y: (e.clientY / window.innerHeight) * 2 - 1,
		};
	}, []);

	return (
		<Wrapper onMouseMove={onMouseMove}>
			<CanvasLayer>
				<IntroRobotHead mouseRef={mouseRef} isTouchDevice={isTouchDevice} />
			</CanvasLayer>
			<PageContent>
				<ErrorCode>404</ErrorCode>
				<Message>This page isn’t part of the experience. Head back home and pick up where you left off.</Message>
				<ButtonGroup>
					<HomeLink as="a" href="/">
						<span>
							<span>Back to homepage</span>
						</span>
					</HomeLink>
				</ButtonGroup>
			</PageContent>
		</Wrapper>
	);
}
