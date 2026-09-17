import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/seo';

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					background: '#000000',
					color: '#ffffff',
					padding: 72,
					fontFamily: 'Georgia, Times New Roman, serif',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						fontSize: 28,
						letterSpacing: 10,
						textTransform: 'uppercase',
						color: '#DD0009',
						fontFamily: 'Arial, Helvetica, sans-serif',
					}}
				>
					<div
						style={{
							width: 14,
							height: 14,
							background: '#DD0009',
						}}
					/>
					{SITE.name}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
					<div
						style={{
							fontSize: 74,
							lineHeight: 0.95,
							letterSpacing: -2,
							maxWidth: 980,
						}}
					>
						{SITE.tagline}
					</div>
					<div
						style={{
							fontSize: 28,
							color: 'rgba(255,255,255,0.62)',
							fontFamily: 'Arial, Helvetica, sans-serif',
						}}
					>
						{SITE.kicker}
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						fontSize: 22,
						color: 'rgba(255,255,255,0.55)',
						fontFamily: 'Arial, Helvetica, sans-serif',
					}}
				>
					<div>Next.js · WordPress · WebGL</div>
					<div>viziom.si</div>
				</div>
			</div>
		),
		{ ...size },
	);
}
