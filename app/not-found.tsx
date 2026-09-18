import type { Metadata } from 'next';
import NotFoundView from '@parts/NotFound';

export const metadata: Metadata = {
	title: 'Page not found',
	robots: {
		index: false,
		follow: false,
	},
};

const NotFound = () => {
	return <NotFoundView />;
};

NotFound.displayName = 'NotFound';
export default NotFound;
