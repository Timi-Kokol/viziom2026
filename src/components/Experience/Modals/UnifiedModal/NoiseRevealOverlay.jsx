'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uProgress;
uniform float uTime;
uniform float uSoftness;
uniform float uScale;
uniform float uPixelation;
uniform vec3 uColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float cells = mix(1.0, 24.0, clamp(uPixelation, 0.0, 1.0));
  vec2 pixelUv = floor(uv * cells) / cells;
  vec2 sampleUv = mix(uv, pixelUv, uPixelation);
  float n = fbm(sampleUv * uScale + vec2(uTime * 0.18, uTime * 0.11));
  float edge = 1.0 - clamp(uProgress, 0.0, 1.0);
  float cut = smoothstep(edge - uSoftness, edge + uSoftness, n);
  float alpha = 1.0 - cut;
  alpha = max(alpha, 1.0 - smoothstep(0.0, 0.1, uProgress));
  gl_FragColor = vec4(uColor, alpha);
}
`

const NoiseRevealOverlay = ({
  trigger = 0,
  durationMs = 700,
  delayMs = 0,
  softness = 0.08,
  transparentToFull = false,
  scale = 8,
  pixelation = 0,
  color = [0, 0, 0],
  onComplete,
}) => {
  const hostRef = useRef(null)
  const canvasRef = useRef(null)
  const materialRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const frameRef = useRef(null)
  const startAtRef = useRef(0)
  const runningRef = useRef(false)
  const startLoopRef = useRef(() => {})
  const paramsRef = useRef({})
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)
  paramsRef.current = { durationMs, delayMs, transparentToFull, softness, scale, pixelation, color }
  onCompleteRef.current = onComplete

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1 },
        uTime: { value: 0 },
        uSoftness: { value: softness },
        uScale: { value: scale },
        uPixelation: { value: pixelation },
        uColor: { value: new THREE.Vector3(color[0], color[1], color[2]) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera
    materialRef.current = material

    const resize = () => {
      const rect = host.getBoundingClientRect()
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)), false)
    }

    const loop = (t) => {
      const mat = materialRef.current
      const ren = rendererRef.current
      const scn = sceneRef.current
      const cam = cameraRef.current
      if (!mat || !ren || !scn || !cam) return

      const params = paramsRef.current
      mat.uniforms.uTime.value = t * 0.001
      mat.uniforms.uSoftness.value = params.softness
      mat.uniforms.uScale.value = params.scale
      mat.uniforms.uPixelation.value = params.pixelation
      mat.uniforms.uColor.value.set(params.color[0], params.color[1], params.color[2])

      if (runningRef.current) {
        const elapsed = Math.max(0, t - startAtRef.current)
        const p = Math.min(1, Math.max(0, elapsed - params.delayMs) / Math.max(1, params.durationMs))
        const shaderProgress = params.transparentToFull ? 1 - p : p
        mat.uniforms.uProgress.value = elapsed < params.delayMs
          ? (params.transparentToFull ? 1 : 0)
          : shaderProgress
        if (p >= 1) {
          runningRef.current = false
          if (!completedRef.current) {
            completedRef.current = true
            const done = onCompleteRef.current
            if (done) done()
          }
        }
      }

      ren.render(scn, cam)

      const idleClear = !runningRef.current && mat.uniforms.uProgress.value >= 0.999
      if (idleClear) {
        frameRef.current = null
        return
      }
      frameRef.current = requestAnimationFrame(loop)
    }

    const startLoop = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(loop)
    }
    startLoopRef.current = startLoop
    resize()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    if (ro) ro.observe(host)
    window.addEventListener('resize', resize)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
      if (ro) ro.disconnect()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      materialRef.current = null
      frameRef.current = null
    }
  }, [])

  useEffect(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.uniforms.uProgress.value = transparentToFull ? 1 : 0
    startAtRef.current = performance.now()
    runningRef.current = true
    completedRef.current = false
    startLoopRef.current()
  }, [trigger, transparentToFull])

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

NoiseRevealOverlay.displayName = 'NoiseRevealOverlay'
export default NoiseRevealOverlay
