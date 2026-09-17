"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Uniform } from "three";
import { Effect, BlendFunction } from "postprocessing";
import { useGameplayPaused } from "../GameplayPausedContext";

// Full-screen Sobel edge detection; mix with scene by intensity (0 = off, 1 = full edge overlay)
const fragmentShader = `
uniform float intensity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec2 t = texelSize;
	// Sample 3x3 neighborhood (luminance)
	float s00 = dot(texture2D(inputBuffer, uv + vec2(-t.x, -t.y)).rgb, vec3(0.299, 0.587, 0.114));
	float s01 = dot(texture2D(inputBuffer, uv + vec2(0.0, -t.y)).rgb, vec3(0.299, 0.587, 0.114));
	float s02 = dot(texture2D(inputBuffer, uv + vec2(t.x, -t.y)).rgb, vec3(0.299, 0.587, 0.114));
	float s10 = dot(texture2D(inputBuffer, uv + vec2(-t.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
	float s12 = dot(texture2D(inputBuffer, uv + vec2(t.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
	float s20 = dot(texture2D(inputBuffer, uv + vec2(-t.x, t.y)).rgb, vec3(0.299, 0.587, 0.114));
	float s21 = dot(texture2D(inputBuffer, uv + vec2(0.0, t.y)).rgb, vec3(0.299, 0.587, 0.114));
	float s22 = dot(texture2D(inputBuffer, uv + vec2(t.x, t.y)).rgb, vec3(0.299, 0.587, 0.114));
	// Sobel kernels
	float gx = -s00 - 2.0*s10 - s20 + s02 + 2.0*s12 + s22;
	float gy = -s00 - 2.0*s01 - s02 + s20 + 2.0*s21 + s22;
	float edge = clamp(length(vec2(gx, gy)) * 2.0, 0.0, 1.0);
	vec4 edgeColor = vec4(vec3(edge), 1.0);
	outputColor = mix(inputColor, edgeColor, intensity);
}
`;

class SobelEffectImpl extends Effect {
	constructor(intensity = 0) {
		super("SobelEffect", fragmentShader, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([["intensity", new Uniform(intensity)]]),
		});
	}
}

export function SobelEffect({ intensity = 0, intensityRef = null }) {
	const effectRef = useRef(null);
	if (!effectRef.current) effectRef.current = new SobelEffectImpl(intensity);
	const effect = effectRef.current;
	const gameplayPaused = useGameplayPaused();
	useFrame(() => {
		if (gameplayPaused) return;
		effect.uniforms.get("intensity").value = intensityRef ? intensityRef.current : intensity;
	});
	return <primitive object={effect} dispose={null} />;
}

SobelEffect.displayName = "SobelEffect";
