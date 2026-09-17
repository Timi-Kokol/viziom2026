import { ImageResponse } from 'next/og';
import { VIZIOM_V_PATHS as V } from '@/lib/brandMark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
	const markW = 118;
	const markH = 88;

	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#000000',
				}}
			>
				<svg width={markW} height={markH} viewBox={V.viewBox} fill="none">
					<path d={V.red} fill="#DD0009" />
					<path d={V.white} fill="#ffffff" />
				</svg>
			</div>
		),
		{ ...size },
	);
}
