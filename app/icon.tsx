import { ImageResponse } from 'next/og';
import { VIZIOM_V_PATHS as V } from '@/lib/brandMark';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
	const markW = 24;
	const markH = 18;

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
