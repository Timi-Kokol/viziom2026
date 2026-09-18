'use client';

import styled from 'styled-components';
import { bpd } from '@tackl';
import { ContentLayer, Title, Subtitle, ButtonRed } from '@parts/Experience/Introduction/styles';

export const PageContent = styled(ContentLayer)`
	padding-top: 42vh;

	${bpd.m`
		padding-top: 34vh;
	`}
`;

export const ErrorCode = styled(Title)`
	font-size: clamp(8rem, 12vw, 16rem);
	letter-spacing: 0.08em;
	margin: 0 0 1rem;
	line-height: 0.9;
	width: auto;
`;

export const Message = styled(Subtitle)`
	max-width: 320px;
	margin-bottom: 5rem;
`;

export const HomeLink = styled(ButtonRed)`
	width: 100%;
	text-decoration: none;
	display: inline-block;
	box-sizing: border-box;
`;
