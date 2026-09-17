'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';

const REVEAL_Y = 28;
const REVEAL_DURATION = 0.65;
const REVEAL_STAGGER = 0.08;

export function useModalContentReveal(scopeRef: RefObject<HTMLElement | null>) {
	useGSAP(
		() => {
			const root = scopeRef.current;
			if (!root) return;

			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

			const scroller = root.closest('[data-modal-scroller]') as HTMLElement | null;
			const heroItems = gsap.utils.toArray<HTMLElement>('[data-reveal="hero"]', root);
			const scrollItems = gsap.utils.toArray<HTMLElement>('[data-reveal]', root).filter(
				(el) => el.getAttribute('data-reveal') !== 'hero',
			);

			const ctx = gsap.context(() => {
				if (heroItems.length) {
					gsap.set(heroItems, { opacity: 0, y: REVEAL_Y });
					gsap.to(heroItems, {
						opacity: 1,
						y: 0,
						duration: REVEAL_DURATION,
						stagger: REVEAL_STAGGER,
						ease: 'power3.out',
						delay: 0.12,
					});
				}

				if (scrollItems.length && scroller) {
					gsap.set(scrollItems, { opacity: 0, y: REVEAL_Y });

					ScrollTrigger.batch(scrollItems, {
						scroller,
						start: 'top 88%',
						once: true,
						onEnter: (batch) => {
							gsap.to(batch, {
								opacity: 1,
								y: 0,
								duration: REVEAL_DURATION,
								stagger: REVEAL_STAGGER,
								ease: 'power3.out',
								overwrite: 'auto',
							});
						},
					});
				}
			}, root);

			return () => ctx.revert();
		},
		{ scope: scopeRef },
	);
}
