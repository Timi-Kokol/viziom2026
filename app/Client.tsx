'use client';

import '@parts/AnimationPlugins';
import Contexts from '@parts/Contexts';
import CustomCursor from '@parts/CustomCursor';
import { GlobalStyle, theme } from '@theme';
import StyledComponentsRegistry from '@utils/registry';
import { ViewTransitions } from '@utils/viewTransitions';
import { gsap } from 'gsap';
import type { LenisRef } from 'lenis/react';
import { ReactLenis } from 'lenis/react';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { ThemeProvider } from 'styled-components';

const GridExposer = dynamic(() => import('@parts/GridExposer'), {
	ssr: false,
});

const Client = ({ children }: { children: React.ReactNode }) => {
	const lenisRef = useRef<LenisRef>(null);

	useEffect(() => {
		function update(time: number) {
			lenisRef.current?.lenis?.raf(time * 1000);
		}

		gsap.ticker.add(update);

		return () => gsap.ticker.remove(update);
	}, []);

	return (
		<ViewTransitions>
			<main id="page" style={{ viewTransitionName: 'page' }}>
				<StyledComponentsRegistry>
					<ThemeProvider theme={theme} key="themeprovider">
						<GlobalStyle />
						<CustomCursor />
						{process.env.NODE_ENV === 'development' && <GridExposer />}
						<Contexts>
							<ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />
							{children}
						</Contexts>
					</ThemeProvider>
				</StyledComponentsRegistry>
			</main>
		</ViewTransitions>
	);
};

Client.displayName = 'Client';
export default Client;
