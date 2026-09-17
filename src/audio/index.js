/**
 * Audio layer: config, manager, and React hook.
 * Usage:
 *   1. Wrap your app (or Experience) with <SoundProvider>.
 *   2. In any component: import { useSound, SOUND_IDS } from '@/audio';
 *      const { play } = useSound();
 *      play(SOUND_IDS.JUMP);
 * Add new sounds in soundConfig.js and put files in public/sounds/.
 */

export { SOUND_IDS, SOUND_CONFIG } from "./soundConfig";
export { SoundManager, getSoundManager } from "./SoundManager";
export { SoundProvider, useSound } from "./SoundContext";
