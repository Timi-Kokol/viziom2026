'use client';

import React, { useRef } from 'react';
import PixelateHero from './PixelateHero';
import QuoteCta from './QuoteCta';
import { useModalContentReveal } from './useModalContentReveal';
import {
	PopupContentWrapper,
	Hero,
	HeroCopy,
	HeroTitle,
	HeroKicker,
	Portrait,
	Body,
	Lead,
	Copy,
	Stack,
	StackKicker,
	StackTitle,
	StackGroups,
	StackGroup,
	StackGroupLabel,
	ChipGrid,
	Chip,
	ChipIndex,
	ChipName,
	Process,
	ProcessKicker,
	ProcessTitle,
	ProcessList,
	ProcessStep,
	ProcessIndex,
	ProcessName,
	ProcessText,
} from './AboutContent.styles';

type AboutContentProps = {
	onQuote?: () => void;
};

const STACK = [
	{
		label: 'Build',
		items: ['Next.js', 'WordPress', 'React', 'Three.js', 'WebGL'],
	},
	{
		label: 'Design',
		items: ['Figma', 'After Effects', 'Blender', 'Spline'],
	},
	{
		label: 'Flow',
		items: ['Cursor', 'Slack', 'Jira', 'GitHub', 'Vercel', 'Supabase'],
	},
];

const STEPS = [
	{
		n: '01',
		title: 'Brief',
		text: 'I pin down the constraint, the weird idea, and what done actually looks like. No mystery scope.',
	},
	{
		n: '02',
		title: 'Design',
		text: 'Look, motion, and interaction in one pass — so it already behaves like itself before I write a line.',
	},
	{
		n: '03',
		title: 'Code',
		text: 'Built in the browser, not handed off as a picture. Real components. Real performance.',
	},
	{
		n: '04',
		title: 'Ship',
		text: 'Production, launch, and a handoff you can still use in week two.',
	},
	{
		n: '05',
		title: 'Maintain',
		text: 'Fixes, tweaks, the next idea — so it does not rot the week it goes live.',
	},
];

const AboutContent: React.FC<AboutContentProps> = ({ onQuote }) => {
	const rootRef = useRef<HTMLDivElement>(null);
	useModalContentReveal(rootRef);
	let index = 0;

	return (
		<PopupContentWrapper ref={rootRef}>
			<Hero>
				<PixelateHero />
				<HeroCopy>
					<HeroTitle data-reveal="hero">About</HeroTitle>
					<HeroKicker data-reveal="hero">Me, in a nutshell</HeroKicker>
				</HeroCopy>
			</Hero>

			<Portrait data-reveal>
				<img src="/timi-kokol.png" alt="Timi Kokol" />
			</Portrait>

			<Body>
				<Lead data-reveal>
					I build custom web experiences for people that value quality.
				</Lead>
				<Copy data-reveal>
					I have been doing this long enough to see where projects usually go sideways: a design that is not good enough, a CMS that fights the editor, motion that tanks the frame rate.
				</Copy>
				<Copy data-reveal>
					You work with me, not a chain of accounts. I will say when something is a bad idea and suggest an alternative. I will quote the real shape of the work, and stay reachable after launch. Quality over volume — I take fewer projects so I can actually stay in them.
				</Copy>
			</Body>

			<Stack>
				<StackKicker data-reveal>Current loadout</StackKicker>
				<StackTitle data-reveal>What I actually use</StackTitle>
				<StackGroups>
					{STACK.map((group) => (
						<StackGroup key={group.label}>
							<StackGroupLabel data-reveal>{group.label}</StackGroupLabel>
							<ChipGrid>
								{group.items.map((name) => {
									index += 1;
									const n = String(index).padStart(2, '0');
									return (
										<Chip key={name} data-reveal>
											<ChipIndex>{n}</ChipIndex>
											<ChipName>{name}</ChipName>
										</Chip>
									);
								})}
							</ChipGrid>
						</StackGroup>
					))}
				</StackGroups>
			</Stack>

			<Process>
				<ProcessKicker data-reveal>How it goes</ProcessKicker>
				<ProcessTitle data-reveal>Brief. Design. Code. Ship. Maintain.</ProcessTitle>
				<ProcessList>
					{STEPS.map((step) => (
						<ProcessStep key={step.n} data-reveal>
							<ProcessIndex>{step.n}</ProcessIndex>
							<ProcessName>{step.title}</ProcessName>
							<ProcessText>{step.text}</ProcessText>
						</ProcessStep>
					))}
				</ProcessList>
			</Process>

			<QuoteCta onQuote={onQuote} />
		</PopupContentWrapper>
	);
};

AboutContent.displayName = 'AboutContent';
export default AboutContent;
