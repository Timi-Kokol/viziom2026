'use client';

import React from 'react';
import { getSoundManager, SOUND_IDS } from '../../../../audio';
import { useHaptics } from '@/haptics';
import PixelateHero from './PixelateHero';
import {
	Banner,
	Inner,
	Kicker,
	Pulse,
	Row,
	Title,
	Arrow,
	Cluster,
	DotWrap,
	Dot,
} from './QuoteCta.styles';

type QuoteCtaProps = {
	onQuote?: () => void;
	kicker?: string;
	title?: string;
};

const QuoteCta: React.FC<QuoteCtaProps> = ({
	onQuote,
	kicker = 'Open for the right project',
	title = 'Get a quote',
}) => {
	const { triggerHover, triggerPress } = useHaptics();

	const handleHover = () => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);
		triggerHover();
	};

	const handleClick = () => {
		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);
		triggerPress();
		onQuote?.();
	};

	return (
		<Banner type="button" onMouseEnter={handleHover} onClick={handleClick} data-reveal>
			<PixelateHero />
			<Inner>
				<Kicker>
					<Pulse />
					{kicker}
				</Kicker>
				<Row>
					<Title>{title}</Title>
					<Arrow aria-hidden="true">
						<Cluster>
							<DotWrap $pos="top">
								<Dot $delay="0s" />
							</DotWrap>
							<DotWrap $pos="tip">
								<Dot $delay="0.18s" />
							</DotWrap>
							<DotWrap $pos="bot">
								<Dot $delay="0.08s" />
							</DotWrap>
						</Cluster>
					</Arrow>
				</Row>
			</Inner>
		</Banner>
	);
}; 

QuoteCta.displayName = 'QuoteCta';
export default QuoteCta;
