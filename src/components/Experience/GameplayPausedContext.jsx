"use client";

import React, { createContext, useContext } from "react";

export const GameplayPausedContext = createContext(false);

export function useGameplayPaused() {
	return useContext(GameplayPausedContext);
}
