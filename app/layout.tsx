import '@/theme/tackl/waffl/WebComponent';
import type { Metadata, Viewport } from 'next';
import Client from './Client';
import Server from './Server';
import { ibmPlexMono, ibmPlexSans, kodeMono } from '@theme/fonts';
import { getJsonLd, getMetadataBase, getSiteUrl, SITE } from '@/lib/seo';
import '@css/global.css';

const siteUrl = getSiteUrl();
const title = `${SITE.tagline} | ${SITE.name}`;

export const metadata: Metadata = {
	metadataBase: getMetadataBase(),
	title: {
		default: title,
		template: `%s | ${SITE.name}`,
	},
	description: SITE.description,
	applicationName: SITE.name,
	authors: [{ name: SITE.founder, url: siteUrl }],
	creator: SITE.founder,
	publisher: SITE.name,
	category: 'technology',
	referrer: 'origin-when-cross-origin',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
			'max-video-preview': -1,
		},
	},
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		locale: SITE.ogLocale,
		url: '/',
		siteName: SITE.name,
		title,
		description: SITE.description,
	},
	twitter: {
		card: 'summary_large_image',
		title,
		description: SITE.description,
	},
	appleWebApp: {
		capable: true,
		title: SITE.name,
		statusBarStyle: 'black-translucent',
	},
	...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
		? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
		: {}),
};

export const viewport: Viewport = {
	themeColor: '#000000',
	colorScheme: 'dark',
	width: 'device-width',
	initialScale: 1,
};

const fontClass = `${ibmPlexSans.variable} ${ibmPlexMono.variable} ${kodeMono.variable}`;

const RootLayout = ({ children }: { children: React.ReactNode }) => {
	const jsonLd = getJsonLd();

	return (
		<html lang="en" className={fontClass} suppressHydrationWarning>
			<body>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<Client>
					<Server>{children}</Server>
				</Client>
			</body>
		</html>
	);
};

RootLayout.displayName = 'RootLayout';
export default RootLayout;
