const EMBED_SRC = 'https://app.cal.com/embed/embed.js';
const CAL_ORIGIN = 'https://app.cal.com';
const BRAND = '#DD0009';

type CalFn = ((...args: unknown[]) => void) & {
	loaded?: boolean;
	ns?: Record<string, CalFn>;
	q?: unknown[];
};

declare global {
	interface Window {
		Cal?: CalFn;
	}
}

export function getCalLink(): string {
	const raw = process.env.NEXT_PUBLIC_CAL_LINK?.trim() ?? '';
	if (!raw) return '';

	try {
		if (/^https?:\/\//i.test(raw)) {
			return new URL(raw).pathname.replace(/^\/+|\/+$/g, '');
		}
	} catch {
		// fall through
	}

	return raw
		.replace(/^(https?:\/\/)?(www\.)?cal\.com\//i, '')
		.replace(/^\/+|\/+$/g, '');
}

function installSnippet() {
	if (typeof window === 'undefined' || window.Cal) return;

	(function (C: Window, A: string, L: string) {
		const p = function (a: { q?: unknown[] }, ar: unknown) {
			a.q = a.q || [];
			a.q.push(ar);
		};
		const d = C.document;
		C.Cal =
			C.Cal ||
			(function () {
				const cal = C.Cal as CalFn;
				const ar = arguments;
				if (!cal.loaded) {
					cal.ns = {};
					cal.q = cal.q || [];
					d.head.appendChild(d.createElement('script')).src = A;
					cal.loaded = true;
				}
				if (ar[0] === L) {
					const api = function () {
						p(api, arguments);
					} as CalFn;
					const namespace = ar[1];
					api.q = api.q || [];
					if (typeof namespace === 'string') {
						cal.ns = cal.ns || {};
						cal.ns[namespace] = cal.ns[namespace] || api;
						p(cal.ns[namespace], ar);
						p(cal, ['initNamespace', namespace]);
					} else {
						p(cal, ar);
					}
					return;
				}
				p(cal, ar);
			} as CalFn);
	})(window, EMBED_SRC, 'init');
}

let uiConfigured = false;
let modalOpen = false;
const modalListeners = new Set<(open: boolean) => void>();
let watchingClose = false;
let sawOpenBox = false;
let modalObserver: MutationObserver | null = null;

function setCalModalOpen(open: boolean) {
	if (!open) sawOpenBox = false;
	if (modalOpen === open) return;
	modalOpen = open;
	modalListeners.forEach((listener) => listener(open));
}

export function subscribeCalModalOpen(listener: (open: boolean) => void) {
	modalListeners.add(listener);
	listener(modalOpen);
	return () => {
		modalListeners.delete(listener);
	};
}

function isCalBoxOpen(box: Element) {
	const state = box.getAttribute('state');
	if (state === 'closed' || state === 'failed') return false;
	const style = window.getComputedStyle(box);
	if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
	return true;
}

function syncCalModalFromDom() {
	const anyOpen = Array.from(document.querySelectorAll('cal-modal-box')).some(isCalBoxOpen);
	if (anyOpen) {
		sawOpenBox = true;
		return;
	}
	if (sawOpenBox) setCalModalOpen(false);
}

function watchCalModalClose() {
	if (typeof window === 'undefined' || watchingClose || !window.Cal) return;
	watchingClose = true;

	const onClose = () => setCalModalOpen(false);
	window.Cal('on', { action: '__closeIframe', callback: onClose });
	window.Cal('on', { action: '*', callback: (event: { detail?: { type?: string } }) => {
		if (event?.detail?.type === '__closeIframe') onClose();
	} });

	if (typeof MutationObserver === 'undefined') return;
	modalObserver = new MutationObserver(() => {
		if (!modalOpen) return;
		syncCalModalFromDom();
	});
	modalObserver.observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ['state', 'style', 'class'],
	});
}

export function initCal() {
	if (typeof window === 'undefined') return;
	installSnippet();
	if (uiConfigured || !window.Cal) return;
	uiConfigured = true;
	window.Cal('init', { origin: CAL_ORIGIN });
	window.Cal('ui', {
		theme: 'dark',
		hideEventTypeDetails: false,
		cssVarsPerTheme: {
			dark: {
				'cal-brand': BRAND,
				'cal-brand-emphasis': '#FF1A22',
				'cal-brand-text': '#FFFFFF',
			},
		},
	});
	watchCalModalClose();
}

export function openCalModal() {
	const calLink = getCalLink();
	if (!calLink) return;
	initCal();
	setCalModalOpen(true);
	window.Cal?.('modal', {
		calLink,
		config: {
			theme: 'dark',
			layout: 'month_view',
		},
	});
}

export function prerenderCal() {
	const calLink = getCalLink();
	if (!calLink) return;
	initCal();
	window.Cal?.('prerender', {
		calLink,
		type: 'modal',
	});
}
