// Imports
// ------------
import { IBM_Plex_Mono, IBM_Plex_Sans, Kode_Mono } from 'next/font/google';
// import localFont from 'next/font/local';
import { Fonts } from './interface';

// SECTION • IBM Plex Sans (heading / body)
export const ibmPlexSans = IBM_Plex_Sans({
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600', '700'],
	variable: '--ibm-plex-sans',
	preload: true,
});

// SECTION • IBM Plex Mono (monospace alternative)
export const ibmPlexMono = IBM_Plex_Mono({
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '600', '700'],
	variable: '--ibm-plex-mono',
	preload: true,
});

// SECTION • Kode Mono (monospace) – variable font so font-weight 400–700 works
export const kodeMono = Kode_Mono({
	subsets: ['latin'],
	display: 'swap',
	weight: 'variable', // variable font (weight axis 400–700)
	variable: '--kode-mono',
	preload: true,
});

// SECTION • Local font configuration
// export const heebo = localFont({
// 	src: [
// 		{
// 			path: './heebo/Heebo-Light.woff2',
// 			weight: '300',
// 			style: 'normal',
// 		},
// 		{
// 			path: './heebo/Heebo-Regular.woff2',
// 			weight: '400',
// 			style: 'normal',
// 		},
// 		{
// 			path: './heebo/Heebo-Medium.woff2',
// 			weight: '500',
// 			style: 'normal',
// 		},
// 	],
// 	display: 'swap',
// 	variable: '--heebo',
// 	preload: true,
// });

// Exports
// ------------
export const fonts: Fonts = {
	family: {
		heading: `var(--ibm-plex-sans), Arial, sans-serif`,
		body: `var(--ibm-plex-sans), Arial, sans-serif`,
		mono: `var(--kode-mono), ui-monospace, monospace`,
		monoPlex: `var(--ibm-plex-mono), ui-monospace, monospace`,
		script: `var(--ibm-plex-sans), Arial, sans-serif`,
	},
	weight: {
		light: 300,
		regular: 400,
		medium: 500,
		semi: 600,
		bold: 700,
		heavy: 800,
		black: 900,
	},
};

