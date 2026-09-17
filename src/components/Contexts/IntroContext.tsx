'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type IntroContextValue = {
	introComplete: boolean;
	setIntroComplete: (value: boolean) => void;
};

const IntroContext = createContext<IntroContextValue>({
	introComplete: false,
	setIntroComplete: () => {},
});

export function IntroProvider({ children }: { children: React.ReactNode }) {
	const [introComplete, setIntroComplete] = useState(false);
	const value = useMemo(() => ({ introComplete, setIntroComplete }), [introComplete]);
	return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro() {
	return useContext(IntroContext);
}
