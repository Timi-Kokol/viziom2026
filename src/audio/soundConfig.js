/**
 * Sound configuration: logical IDs → file paths and options.
 * All files live in public/sounds/ so paths are relative to public (e.g. /sounds/...).
 * Add new sounds here and drop the file in public/sounds/.
 */

const SOUNDS_BASE = "/sounds";

export const SOUND_IDS = {
	// Background (loops, all scenes)
	MUSIC: "music",
	// Minigame – robot
	STRAFE: "strafe",
	BEEP: "beep",
	COUNTDOWN_GO: "countdownGo", // GO! in countdown (uses strafe.mp3)
	JUMP: "jump",
	CRASH: "crash",
	SPEED_INCREASE: "speedIncrease",
	// UI
	BUTTON_HOVER: "buttonHover",
	BUTTON_PRESS: "buttonPress",
	// Main scene – drone detection
	ALARM: "alarm",
	DRONE: "drone",
	DOOR: "door",
	ROBOTGAS: "robotgas",
	PULSE: "pulse",
	IMPRESSIVE: "impressive",
	// Optional: countdown, score bump, etc.
	// COUNTDOWN_TICK: "countdownTick",
	// SPEED_BUMP: "speedBump",
};

/**
 * Config: id -> { url, volume (0-1) }
 * Use .mp3, .ogg, or .wav; pick one format or list fallbacks.
 */
export const SOUND_CONFIG = {
	[SOUND_IDS.MUSIC]: {
		url: `${SOUNDS_BASE}/space.mp3`,
		volume: 0.3,
	},
	[SOUND_IDS.STRAFE]: {
		url: `${SOUNDS_BASE}/strafe.mp3`,
		volume: 0.3,
	},
	[SOUND_IDS.BEEP]: {
		url: `${SOUNDS_BASE}/beep.mp3`,
		volume: 0.8,
	},
	[SOUND_IDS.COUNTDOWN_GO]: {
		url: `${SOUNDS_BASE}/go.mp3`,
		volume: 1,
	},
	[SOUND_IDS.SPEED_INCREASE]: {
		url: `${SOUNDS_BASE}/speedincrease.mp3`,
		volume: 0.5,
	},
	[SOUND_IDS.JUMP]: {
		url: `${SOUNDS_BASE}/jump.mp3`,
		volume: 0.6,
	},
	[SOUND_IDS.CRASH]: {
		url: `${SOUNDS_BASE}/crash.mp3`,
		volume: 0.6,
	},
	[SOUND_IDS.BUTTON_HOVER]: {
		url: `${SOUNDS_BASE}/hover.mp3`,
		volume: 0.7,
	},
	[SOUND_IDS.BUTTON_PRESS]: {
		url: `${SOUNDS_BASE}/click.mp3`,
		volume: 0.7,
	},
	[SOUND_IDS.ALARM]: {
		url: `${SOUNDS_BASE}/alarm.mp3`,
		volume: 0.6,
	},
	[SOUND_IDS.DRONE]: {
		url: `${SOUNDS_BASE}/drone.mp3`,
		volume: 0.1,
	},
	[SOUND_IDS.DOOR]: {
		url: `${SOUNDS_BASE}/door.mp3`,
		volume: 0.4,
	},
	[SOUND_IDS.ROBOTGAS]: {
		url: `${SOUNDS_BASE}/robotgas.mp3`,
		volume: 1,
	},
	[SOUND_IDS.PULSE]: {
		url: `${SOUNDS_BASE}/pulse.mp3`,
		volume: 1,
	},
	[SOUND_IDS.IMPRESSIVE]: {
		url: `${SOUNDS_BASE}/impressive.mp3`,
		volume: 1,
	},
	
};
