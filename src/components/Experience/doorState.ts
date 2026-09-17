"use client";

let doorOpen = false;
let groundCacheInvalidateRequested = false;

export const setDoorOpen = (isOpen: boolean) => {
	doorOpen = isOpen;
	if (isOpen) {
		groundCacheInvalidateRequested = true;
	}
};

export const getDoorOpen = () => doorOpen;

/** Force next ground raycast cache rebuild (e.g. so collision-door is excluded after door opens). Cleared when read. */
export const getAndClearGroundCacheInvalidate = (): boolean => {
	const v = groundCacheInvalidateRequested;
	groundCacheInvalidateRequested = false;
	return v;
};
