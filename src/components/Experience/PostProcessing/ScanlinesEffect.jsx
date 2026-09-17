"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Uniform } from "three";
import { Effect, BlendFunction } from "postprocessing";
import { useGameplayPaused } from "../GameplayPausedContext";

// CRT-style horizontal scanlines; mix by intensity (0 = off, 1 = full). Use uv only so we don't depend on resolution uniform.
const fragmentShader = `
uniform float intensity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	float line = floor(uv.y * 400.0);
	float scanline = mod(line, 2.0) < 1.0 ? 1.0 : 0.0;
	vec4 darkened = vec4(inputColor.rgb * (1.0 - scanline * 0.65), inputColor.a);
	outputColor = mix(inputColor, darkened, intensity);
}
`;

class ScanlinesEffectImpl extends Effect {
	constructor(intensity = 0) {
		super("ScanlinesEffect", fragmentShader, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([["intensity", new Uniform(intensity)]]),
		});
	}
}

export function ScanlinesEffect({ intensity = 0, intensityRef = null }) {
	const effectRef = useRef(null);
	if (!effectRef.current) effectRef.current = new ScanlinesEffectImpl(intensity);
	const effect = effectRef.current;
	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		effect.uniforms.get("intensity").value = intensityRef ? intensityRef.current : intensity;
	});
	return <primitive object={effect} dispose={null} />;
}

ScanlinesEffect.displayName = "ScanlinesEffect";
