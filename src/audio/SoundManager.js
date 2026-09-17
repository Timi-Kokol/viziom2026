/**
 * Sound manager using Howler.js. Same API as before: play(id), stop(id), setSoundEnabled, resume, whenResumed, preload.
 * Safari/iOS: we unlock audio by playing a silent sound on first user gesture.
 */

import { Howl, Howler } from "howler";
import { SOUND_CONFIG, SOUND_IDS } from "./soundConfig";

// Detect iOS/Safari for special audio handling
const isIOS = typeof navigator !== "undefined" && 
	(/iPad|iPhone|iPod/.test(navigator.userAgent) || 
	(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const isSafari = typeof navigator !== "undefined" && 
	/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isMobile = typeof navigator !== "undefined" &&
	/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// Use HTML5 audio on ALL mobile devices, not just iOS
const needsHtml5Audio = isIOS || isSafari || isMobile;


export class SoundManager {
	constructor() {
		/** id -> Howl instance (created on preload or first play) */
		this._howls = new Map();
		this.resumed = false;
		this._resumeListeners = [];
		/** When false (e.g. user chose "Enter without sound"), play() is a no-op everywhere. */
		this.soundEnabled = true;
		this.masterVolume = 1;
		this._selectiveMuteEnabled = false;
		this._selectiveMuteExcept = new Set();
		/** id -> volume override (0-1), e.g. for modal ducking */
		this._volumeOverrides = new Map();
		/** id -> RAF id for volume fade (cancel on new fade) */
		this._volumeOverrideFadeRaf = new Map();
		this._unlockAttempted = false;
		this._volumeFadeRaf = null;
		/** id -> generation; bumped on play/stop so late load/unlock callbacks cannot restart a stopped sound */
		this._playGen = new Map();
		this._wanted = new Set();
		try {
			Howler.volume(this.masterVolume);
		} catch (_) {}
		
		// iOS/Safari: Disable Howler's auto-suspend to prevent audio context from being suspended
		if (needsHtml5Audio && typeof Howler !== "undefined") {
			Howler.autoSuspend = false;
		}
		
		// Mute when tab is inactive, restore when visible
		if (typeof document !== "undefined") {
			const onVisibilityChange = () => {
				if (document.hidden) {
					try {
						Howler.volume(0);
					} catch (_) {}
				} else {
					try {
						Howler.volume(this.masterVolume);
					} catch (_) {}
				}
			};
			document.addEventListener("visibilitychange", onVisibilityChange);
		}

		// Set up global first-interaction unlock for iOS
		// This is a safety net in case the button handlers don't catch the gesture
		if (typeof document !== "undefined" && needsHtml5Audio) {
			const unlockOnFirstInteraction = (e) => {
				this._unlockAudio(true);
				document.removeEventListener("touchstart", unlockOnFirstInteraction, true);
				document.removeEventListener("touchend", unlockOnFirstInteraction, true);
				document.removeEventListener("click", unlockOnFirstInteraction, true);
			};
			// Use capture phase to ensure we get the event first
			document.addEventListener("touchstart", unlockOnFirstInteraction, true);
			document.addEventListener("touchend", unlockOnFirstInteraction, true);
			document.addEventListener("click", unlockOnFirstInteraction, true);
		}
	}

	_getEffectiveVolume(id) {
		const override = this._volumeOverrides.get(id);
		if (override != null) return override;
		const config = SOUND_CONFIG[id];
		const base = config?.volume ?? 1;
		if (!this._selectiveMuteEnabled) return base;
		return this._selectiveMuteExcept.has(id) ? base : 0;
	}

	/**
	 * Override volume for a sound (e.g. duck when modal is open).
	 * @param {string} id - SOUND_IDS key
	 * @param {number|null} volume - 0-1, or null to clear override
	 * @param {{ durationMs?: number }} options - durationMs: ramp over this many ms
	 */
	setVolumeOverride(id, volume, options = {}) {
		const durationMs = Math.max(0, Number(options.durationMs ?? 0));
		const howl = this._howls.get(id);
		const targetVolume = volume == null ? null : Math.max(0, Math.min(1, volume));

		// Cancel any in-progress fade for this sound
		const existingRaf = this._volumeOverrideFadeRaf.get(id);
		if (existingRaf != null && typeof cancelAnimationFrame === "function") {
			cancelAnimationFrame(existingRaf);
			this._volumeOverrideFadeRaf.delete(id);
		}

		if (durationMs <= 0 || !howl || typeof requestAnimationFrame !== "function") {
			if (targetVolume == null) {
				this._volumeOverrides.delete(id);
			} else {
				this._volumeOverrides.set(id, targetVolume);
			}
			this._applySelectiveMuteVolumes();
			return;
		}

		const config = SOUND_CONFIG[id];
		const baseVolume = config?.volume ?? 1;
		const startVolume = (() => {
			try {
				return howl.volume();
			} catch (_) {
				return this._getEffectiveVolume(id);
			}
		})();
		const endVolume = targetVolume == null ? baseVolume : targetVolume;
		const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

		const tick = (now) => {
			const t = Math.max(0, Math.min(1, (now - startTime) / durationMs));
			const next = startVolume + (endVolume - startVolume) * t;
			try {
				howl.volume(next);
			} catch (_) {}
			if (t < 1) {
				this._volumeOverrideFadeRaf.set(id, requestAnimationFrame(tick));
			} else {
				this._volumeOverrideFadeRaf.delete(id);
				if (targetVolume == null) {
					this._volumeOverrides.delete(id);
				} else {
					this._volumeOverrides.set(id, targetVolume);
				}
				this._applySelectiveMuteVolumes();
			}
		};

		this._volumeOverrideFadeRaf.set(id, requestAnimationFrame(tick));
	}

	_applySelectiveMuteVolumes() {
		this._howls.forEach((howl, id) => {
			try {
				howl.volume(this._getEffectiveVolume(id));
			} catch (_) {}
		});
	}

	/**
	 * iOS/Safari audio unlock: Must be called SYNCHRONOUSLY from a user gesture (click/touchstart).
	 * Creates a silent Howl and plays it to unlock the AudioContext.
	 * @param {boolean} force - If true, retry even if already attempted
	 */
	_unlockAudio(force = false) {
		if (this._unlockAttempted && !force) return;
		this._unlockAttempted = true;

		try {
			// Method 1: Create and play a silent sound via Howler to unlock iOS audio
			// This must happen synchronously within the user gesture
			const silentSrc = ["data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"];
			const silentHtml5 = new Howl({
				src: silentSrc,
				volume: 0.001,
				html5: true,
				onend: () => silentHtml5.unload(),
			});
			silentHtml5.play();
			const silentWeb = new Howl({
				src: silentSrc,
				volume: 0.001,
				html5: false,
				onend: () => silentWeb.unload(),
			});
			silentWeb.play();
		} catch (e) {
		}

		// Method 2: Also resume Howler's AudioContext if it exists
		try {
			if (Howler.ctx && Howler.ctx.state === "suspended") {
				Howler.ctx.resume();
			}
		} catch (e) {
		}

		// Method 3: Create and resume a raw AudioContext as fallback
		// iOS sometimes needs this direct approach
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
				const ctx = new AudioContext();
				if (ctx.state === "suspended") {
					ctx.resume();
				}
				// Create a short silent buffer and play it
				const buffer = ctx.createBuffer(1, 1, 22050);
				const source = ctx.createBufferSource();
				source.buffer = buffer;
				source.connect(ctx.destination);
				source.start(0);
			}
		} catch (e) {
		}
		
		// Method 4: Use Howler's built-in unlock mechanism
		try {
			if (typeof Howler._unlockAudio === "function") {
				Howler._unlockAudio();
			}
		} catch (e) {
		}
	}

	/**
	 * Call after a user gesture (click/tap). Resumes Howler's AudioContext so playback is allowed on Safari/iOS.
	 */
	async resume() {
		// On iOS, always try to unlock even if resumed (context can re-suspend)
		const forceUnlock = needsHtml5Audio;
		this._unlockAudio(forceUnlock);
		
		if (this.resumed && !forceUnlock) {
			return;
		}

		try {
			// Also try async resume for good measure
			if (Howler.ctx && Howler.ctx.state === "suspended") {
				await Howler.ctx.resume();
			}
			this.resumed = true;
			this._resumeListeners.forEach((fn) => fn());
			this._resumeListeners = [];
		} catch {
			// Still mark as resumed so we don't block forever
			this.resumed = true;
			this._resumeListeners.forEach((fn) => fn());
			this._resumeListeners = [];
		}
	}

	/**
	 * Register a one-time listener for when context is resumed (e.g. to preload).
	 */
	whenResumed(fn) {
		if (this.resumed) {
			fn();
			return;
		}
		this._resumeListeners.push(fn);
	}

	_nextPlayGen(id) {
		const next = (this._playGen.get(id) || 0) + 1;
		this._playGen.set(id, next);
		return next;
	}

	_isCurrentPlay(id, gen = null) {
		if (!this._wanted.has(id)) return false;
		if (gen == null) return true;
		return this._playGen.get(id) === gen;
	}

	_getOrCreateHowl(id) {
		if (this._howls.has(id)) return this._howls.get(id);
		const config = SOUND_CONFIG[id];
		if (!config) return null;
		const useHtml5 = needsHtml5Audio && id === SOUND_IDS.MUSIC;
		const howl = new Howl({
			src: [config.url],
			volume: config.volume ?? 1,
			html5: useHtml5,
			preload: true,
			onplayerror: (_id) => {
				if (!this._isCurrentPlay(id)) return;
				if (needsHtml5Audio) {
					this._unlockAttempted = false;
					this._unlockAudio();
					const gen = this._playGen.get(id);
					howl.once("unlock", () => {
						if (!this._isCurrentPlay(id, gen)) return;
						howl.play();
					});
				}
			},
		});
		this._howls.set(id, howl);
		return howl;
	}

	/**
	 * Preload one or all sounds. Call after resume() for best results.
	 */
	async preload(ids = null) {
		const toLoad = ids || Object.keys(SOUND_CONFIG);
		for (const id of toLoad) {
			if (!SOUND_CONFIG[id]) continue;
			this._getOrCreateHowl(id);
		}
	}

	/**
	 * Set whether any sound is allowed. When false, play() is a no-op and looping sounds are stopped.
	 */
	setSoundEnabled(enabled) {
		const opts = arguments[1] || {};
		const stopImmediately = opts.stopImmediately !== false;
		this.soundEnabled = !!enabled;
		if (!enabled && stopImmediately) this.stopAll();
	}

	/**
	 * Global volume scaler for all sounds (0..1).
	 */
	setMasterVolume(volume, options = {}) {
		const v = Math.max(0, Math.min(1, Number(volume)));
		const target = Number.isFinite(v) ? v : 1;
		const smooth = options.smooth === true;
		const durationMs = Math.max(0, Number(options.durationMs ?? 0));
		const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;

		if (this._volumeFadeRaf != null && typeof cancelAnimationFrame === "function") {
			cancelAnimationFrame(this._volumeFadeRaf);
			this._volumeFadeRaf = null;
		}

		if (!smooth || durationMs <= 0 || typeof requestAnimationFrame !== "function") {
			this.masterVolume = target;
			try {
				Howler.volume(this.masterVolume);
			} catch (_) {}
			if (onComplete) onComplete();
			return;
		}

		let startVolume = this.masterVolume;
		try {
			if (typeof Howler.volume === "function") startVolume = Howler.volume();
		} catch (_) {}
		const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

		const tick = (now) => {
			const t = Math.max(0, Math.min(1, (now - startTime) / durationMs));
			const next = startVolume + (target - startVolume) * t;
			this.masterVolume = next;
			try {
				Howler.volume(next);
			} catch (_) {}
			if (t < 1) {
				this._volumeFadeRaf = requestAnimationFrame(tick);
			} else {
				this._volumeFadeRaf = null;
				if (onComplete) onComplete();
			}
		};

		this._volumeFadeRaf = requestAnimationFrame(tick);
	}

	/**
	 * Mute all sounds except specific IDs (e.g. keep music while modal is open).
	 */
	setSelectiveMute(enabled, options = {}) {
		this._selectiveMuteEnabled = !!enabled;
		const except = Array.isArray(options.exceptIds) ? options.exceptIds : [];
		this._selectiveMuteExcept = new Set(except);
		this._applySelectiveMuteVolumes();
	}

	/**
	 * Play a sound by id.
	 * @param {string} id - SOUND_IDS key
	 * @param {{ loop?: boolean }} options - loop: true for background music / drone etc.
	 */
	play(id, options = {}) {
		if (!this.soundEnabled) {
			return;
		}
		const config = SOUND_CONFIG[id];
		if (!config) {
			return;
		}
		const loop = !!options.loop;
		const gen = this._nextPlayGen(id);
		this._wanted.add(id);

		this._unlockAudio(needsHtml5Audio);

		const doPlay = () => {
			if (!this._isCurrentPlay(id, gen)) return;
			const howl = this._getOrCreateHowl(id);
			if (!howl) {
				return;
			}
			howl.off("load");
			howl.off("unlock");
			if (loop) howl.stop();
			howl.loop(loop);
			howl.volume(this._getEffectiveVolume(id));

			const start = () => {
				if (!this._isCurrentPlay(id, gen)) return;
				howl.play();
			};
			if (howl.state() === "loaded") {
				start();
			} else {
				howl.once("load", start);
			}
		};

		if (!this.resumed) {
			// Resume and then play
			this.resume().then(doPlay).catch(() => doPlay());
			return;
		}

		// Safari iOS: ensure context is unlocked before play
		if (Howler.ctx && Howler.ctx.state === "suspended") {
			Howler.ctx.resume().then(doPlay).catch(() => doPlay());
			return;
		}
		doPlay();
	}

	/**
	 * Stop a looping (or any) sound by id.
	 */
	stop(id) {
		this._wanted.delete(id);
		this._nextPlayGen(id);
		const howl = this._howls.get(id);
		if (!howl) return;
		try {
			howl.off("load");
			howl.off("unlock");
			howl.loop(false);
			howl.stop();
		} catch (_) {}
	}

	/**
	 * Stop all currently loaded sounds.
	 */
	stopAll() {
		this._howls.forEach((howl, id) => {
			this._wanted.delete(id);
			this._nextPlayGen(id);
			try {
				howl.off("load");
				howl.off("unlock");
				howl.loop(false);
				howl.stop();
			} catch (_) {}
		});
	}
}

let defaultManager = null;

export function getSoundManager() {
	if (typeof window === "undefined") return null;
	if (!defaultManager) defaultManager = new SoundManager();
	return defaultManager;
}
