import Header from '@parts/Header';
import SeoContent from '@parts/SeoContent';

const Server = async ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<SeoContent />
			<Header />
			{children}
		</>
	);
};

Server.displayName = 'Server';
export default Server;
