'use client'

import { useRef, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameplayPaused } from '../GameplayPausedContext'

const CANVAS_MAX = 960
const NX_DEFAULT = 40
const NZ_DEFAULT = 24
const PHASE_SPEEDS = [0.018, -0.024, 0.03]
const DEFAULT_FLOAT_DRIFT_DIR = [1, 1, 1]

function canvasSize(viewW, viewH) {
	const aspect = Math.max(viewW, 1) / Math.max(viewH, 1)
	if (aspect >= 1) return { w: CANVAS_MAX, h: Math.max(1, Math.round(CANVAS_MAX / aspect)) }
	return { w: Math.max(1, Math.round(CANVAS_MAX * aspect)), h: CANVAS_MAX }
}

function pathHex(ctx, cx, cy, r) {
	ctx.beginPath()
	for (let k = 0; k < 6; k++) {
		const a = Math.PI / 6 + (k * Math.PI) / 3
		const x = cx + Math.cos(a) * r
		const y = cy + Math.sin(a) * r
		if (k === 0) ctx.moveTo(x, y)
		else ctx.lineTo(x, y)
	}
	ctx.closePath()
}

function pathShape(ctx, shape, cx, cy, r) {
	if (shape === 'square') {
		ctx.beginPath()
		ctx.rect(cx - r, cy - r, r * 2, r * 2)
		return
	}
	if (shape === 'circle') {
		ctx.beginPath()
		ctx.arc(cx, cy, r, 0, Math.PI * 2)
		return
	}
	pathHex(ctx, cx, cy, r)
}

const COLOR_PRESETS = {
	cyber: { surface: [110, 145, 200], float: [140, 170, 210] },
	ember: { surface: [255, 180, 120], float: [255, 210, 160] },
	void: { surface: [200, 200, 220], float: [220, 220, 240] },
	toxic: { surface: [120, 255, 200], float: [160, 255, 220] },
	neon: { surface: [200, 120, 255], float: [220, 160, 255] },
	sunset: { gradient: true, back: [140, 90, 200], front: [255, 160, 120], float: [240, 140, 180] },
}

// ─── Tweakable params ─────────────────────────────────────────────────────────
const SETTINGS = {
	waveSpeed: 0.1,
	waveDirection: 1,
	cameraPhaseScale: 8,
	gridX: NX_DEFAULT,
	gridZ: NZ_DEFAULT,
	particleSizeMin: 0.85,
	particleSizeMax: 1.7,
	opacityMin: 0.1,
	opacityMax: 0.38,
	shape: 'hex', // 'hex' | 'square' | 'circle'
	nFloat: 2,
	floatSizeScale: 0.55,
	floatDriftScale: 1.2,
	hyperspeedEnabled: true,
	hyperspeedLineCount: 14,
	hyperspeedSpeed: 0.1,
	hyperspeedOpacityMin: 0.03,
	hyperspeedOpacityMax: 0.22,
	hyperspeedLengthMin: 0.04,
	hyperspeedLengthMax: 0.18,
	hyperspeedWidth: 2,
	hyperspeedColor: [221, 0, 9],
}

/**
 * Sci‑fi background: 3D undulating surface (+ optional floating dust).
 */
export default function AnimatedBackground({
	colorPreset = 'cyber',
	cameraReact = true,
	particleSizeMin = SETTINGS.particleSizeMin,
	particleSizeMax = SETTINGS.particleSizeMax,
	opacityMin = SETTINGS.opacityMin,
	opacityMax = SETTINGS.opacityMax,
	shape = SETTINGS.shape,
	bloomEnabled = false,
	bloomRadius = 0,
	bloomOpacity = 0,
	waveSpeed = SETTINGS.waveSpeed,
	waveDirection = SETTINGS.waveDirection,
	cameraPhaseScale = SETTINGS.cameraPhaseScale,
	gridX = SETTINGS.gridX,
	gridZ = SETTINGS.gridZ,
	nFloat = SETTINGS.nFloat,
	floatSizeScale = SETTINGS.floatSizeScale,
	floatDriftScale = SETTINGS.floatDriftScale,
	floatDriftDirection = DEFAULT_FLOAT_DRIFT_DIR,
	reduceQuality = false,
	hyperspeedEnabled = SETTINGS.hyperspeedEnabled,
	hyperspeedLineCount = SETTINGS.hyperspeedLineCount,
	hyperspeedSpeed = SETTINGS.hyperspeedSpeed,
	hyperspeedOpacityMin = SETTINGS.hyperspeedOpacityMin,
	hyperspeedOpacityMax = SETTINGS.hyperspeedOpacityMax,
	hyperspeedLengthMin = SETTINGS.hyperspeedLengthMin,
	hyperspeedLengthMax = SETTINGS.hyperspeedLengthMax,
	hyperspeedWidth = SETTINGS.hyperspeedWidth,
	hyperspeedColor = SETTINGS.hyperspeedColor,
}) {
	const effectiveGridX = reduceQuality ? 20 : gridX
	const effectiveGridZ = reduceQuality ? 12 : gridZ
	const effectiveNFloat = reduceQuality ? 1 : nFloat
	const effectiveHyperspeedLineCount = reduceQuality ? 6 : hyperspeedLineCount
	const effectiveBloomEnabled = reduceQuality ? false : bloomEnabled

	const { scene, camera, size } = useThree()
	const canvasRef = useRef(null)
	const ctxRef = useRef(null)
	const textureRef = useRef(null)
	const vignetteRef = useRef(null)
	const vignetteSizeRef = useRef({ w: 0, h: 0 })
	const phasesRef = useRef([0, 0, 0])
	const floatRef = useRef([])
	const streakSeedsRef = useRef([])

	useLayoutEffect(() => {
		const canvas = document.createElement('canvas')
		const dims = canvasSize(size.width, size.height)
		canvas.width = dims.w
		canvas.height = dims.h
		canvasRef.current = canvas
		ctxRef.current = canvas.getContext('2d')
		vignetteRef.current = null

		const texture = new THREE.CanvasTexture(canvas)
		textureRef.current = texture

		const prev = scene.background
		scene.background = texture

		phasesRef.current = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2]

		const float = []
		for (let i = 0; i < effectiveNFloat; i++) {
			float.push({
				x: Math.random(),
				y: Math.random(),
				z: Math.random(),
				dx: (Math.random() - 0.5) * 0.00015,
				dy: (Math.random() - 0.5) * 0.00012,
				dz: (Math.random() - 0.5) * 0.0001,
			})
		}
		floatRef.current = float

		return () => {
			scene.background = prev != null ? prev : new THREE.Color(0x000000)
			texture.dispose()
		}
	}, [scene, effectiveNFloat, size.width, size.height])

	useLayoutEffect(() => {
		const cur = floatRef.current
		const need = effectiveNFloat - cur.length
		if (need > 0) {
			for (let i = 0; i < need; i++) {
				cur.push({
					x: Math.random(),
					y: Math.random(),
					z: Math.random(),
					dx: (Math.random() - 0.5) * 0.00015,
					dy: (Math.random() - 0.5) * 0.00012,
					dz: (Math.random() - 0.5) * 0.0001,
				})
			}
		} else if (need < 0) {
			floatRef.current = cur.slice(0, effectiveNFloat)
		}
	}, [effectiveNFloat])

	useLayoutEffect(() => {
		const n = Math.max(1, effectiveHyperspeedLineCount)
		streakSeedsRef.current = Array.from({ length: n }, (_, i) => ({
			x: 0.06 + ((i * 0.137 + 0.19) % 0.88),
			speed: 0.65 + (i % 9) * 0.045,
			len: hyperspeedLengthMin + ((i * 7) % 11) / 11 * (hyperspeedLengthMax - hyperspeedLengthMin),
			offset: i * 0.17,
		}))
	}, [effectiveHyperspeedLineCount, hyperspeedLengthMin, hyperspeedLengthMax])

	const gameplayPaused = useGameplayPaused()
	useFrame((state) => {
		if (gameplayPaused) return
		const canvas = canvasRef.current
		const ctx = ctxRef.current
		const texture = textureRef.current
		if (!canvas || !ctx || !texture) return

		const W = canvas.width
		const H = canvas.height
		const TAU = Math.PI * 2
		const p = phasesRef.current
		const ws = waveSpeed * waveDirection
		p[0] += PHASE_SPEEDS[0] * ws
		p[1] += PHASE_SPEEDS[1] * ws
		p[2] += PHASE_SPEEDS[2] * ws

		const phaseMod = cameraReact
			? cameraPhaseScale * (camera.position.x * 0.005 + camera.position.z * 0.004)
			: 0

		const breath = 0.92 + 0.08 * Math.sin(state.clock.elapsedTime * 0.7)

		ctx.fillStyle = '#000000'
		ctx.fillRect(0, 0, W, H)

		if (!vignetteRef.current || vignetteSizeRef.current.w !== W || vignetteSizeRef.current.h !== H) {
			const vignette = ctx.createRadialGradient(W * 0.5, H * 0.42, H * 0.12, W * 0.5, H * 0.5, H * 0.78)
			vignette.addColorStop(0, 'rgba(8, 0, 2, 0)')
			vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
			vignetteRef.current = vignette
			vignetteSizeRef.current = { w: W, h: H }
		}
		ctx.fillStyle = vignetteRef.current
		ctx.fillRect(0, 0, W, H)

		const sizeAt = (z) => particleSizeMin + (particleSizeMax - particleSizeMin) * z
		const opacityAt = (z) => opacityMin + (opacityMax - opacityMin) * z
		const preset = COLOR_PRESETS[colorPreset] || COLOR_PRESETS.cyber
		const dir = floatDriftDirection || DEFAULT_FLOAT_DRIFT_DIR
		const d0 = dir[0] ?? 1
		const d1 = dir[1] ?? 1
		const d2 = dir[2] ?? 1

		const getRgb = (z) => {
			if (preset.gradient) {
				return [
					Math.round(preset.back[0] + (preset.front[0] - preset.back[0]) * z),
					Math.round(preset.back[1] + (preset.front[1] - preset.back[1]) * z),
					Math.round(preset.back[2] + (preset.front[2] - preset.back[2]) * z),
				]
			}
			return preset.surface
		}

		const drawParticle = (sx, sy, radius, r, g, b, a, withBloom) => {
			const cx = sx * W
			const cy = sy * H
			if (withBloom && effectiveBloomEnabled && bloomRadius > 0 && bloomOpacity > 0) {
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bloomOpacity})`
				pathShape(ctx, shape, cx, cy, radius * bloomRadius)
				ctx.fill()
			}
			ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
			pathShape(ctx, shape, cx, cy, radius)
			ctx.fill()
		}

		const nz = Math.max(1, effectiveGridZ)
		const nx = Math.max(1, effectiveGridX)
		for (let j = 0; j < nz; j++) {
			const z = nz <= 1 ? 0 : j / (nz - 1)
			const [r, g, b] = getRgb(z)
			for (let i = 0; i < nx; i++) {
				const x = nx <= 1 ? 0 : i / (nx - 1)
				const y =
					0.5 +
					0.28 * Math.sin(2.5 * TAU * x + p[0] + phaseMod) +
					0.2 * Math.sin(3.2 * TAU * z + p[1] + phaseMod) +
					0.14 * Math.sin(4 * TAU * x + 2.2 * TAU * z + p[2] + phaseMod)

				const sy = Math.max(0, Math.min(1, y))
				const radius = sizeAt(z)
				const a = opacityAt(z) * breath
				drawParticle(x, sy, radius, r, g, b, a, true)
			}
		}

		const float = floatRef.current
		for (let i = 0; i < float.length; i++) {
			const f = float[i]
			f.x = (f.x + f.dx * floatDriftScale * d0 + 1) % 1
			f.y = (f.y + f.dy * floatDriftScale * d1 + 1) % 1
			f.z = (f.z + f.dz * floatDriftScale * d2 + 1) % 1
		}
		float.sort((a, b) => a.z - b.z)
		for (let i = 0; i < float.length; i++) {
			const f = float[i]
			const [r, g, b] = preset.gradient ? getRgb(f.z) : (preset.float || preset.surface)
			const a = opacityAt(f.z) * 0.85 * breath
			const radius = sizeAt(f.z) * floatSizeScale
			drawParticle(f.x, f.y, radius, r, g, b, a, true)
		}

		if (hyperspeedEnabled && effectiveHyperspeedLineCount > 0) {
			const [rR, gR, bR] = hyperspeedColor.map((c) => Math.min(255, Math.max(0, Math.round(Number(c)) || 0)))
			ctx.lineCap = 'round'
			ctx.lineWidth = hyperspeedWidth
			const t = state.clock.elapsedTime
			const wrap = 1.25
			const seeds = streakSeedsRef.current
			const lenRange = hyperspeedLengthMax - hyperspeedLengthMin
			for (let i = 0; i < seeds.length; i++) {
				const s = seeds[i]
				const x = s.x * W
				const phase = ((t * hyperspeedSpeed * s.speed + s.offset) % wrap + wrap) % wrap
				const yTop = (phase - 0.12) * H
				const yBottom = yTop + s.len * H
				const opacity = lenRange <= 0
					? hyperspeedOpacityMax
					: hyperspeedOpacityMin + ((s.len - hyperspeedLengthMin) / lenRange) * (hyperspeedOpacityMax - hyperspeedOpacityMin)
				const grad = ctx.createLinearGradient(x, yTop, x, yBottom)
				grad.addColorStop(0, `rgba(${rR}, ${gR}, ${bR}, 0)`)
				grad.addColorStop(0.45, `rgba(${rR}, ${gR}, ${bR}, ${opacity * breath})`)
				grad.addColorStop(1, `rgba(${rR}, ${gR}, ${bR}, 0)`)
				ctx.strokeStyle = grad
				ctx.beginPath()
				ctx.moveTo(x, yTop)
				ctx.lineTo(x, yBottom)
				ctx.stroke()
			}
		}

		texture.needsUpdate = true
	})

	return null
}
