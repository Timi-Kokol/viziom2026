'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useGameplayPaused } from '../GameplayPausedContext'

export function SpriteSheetBillboard({
  activeRef,
  triggerRef = null,
  directionRef = null,
  verticalCompensationRef = null,
  spritePath,
  cols = 1,
  rows = 1,
  totalFrames = 1,
  fps = 24,
  position = [0, 0, 0],
  leftPosition = null,
  rightPosition = null,
  size = 1,
  opacity = 1,
  blendMode = 'additive',
  mirrorLeft = false
}) {
  const texture = useTexture(spritePath)
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const frameTimerRef = useRef(0)
  const frameRef = useRef(0)
  const playingRef = useRef(false)
  const lastTriggerRef = useRef(0)

  useEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.repeat.set(1 / Math.max(1, cols), 1 / Math.max(1, rows))
    texture.offset.set(0, 0)
    texture.needsUpdate = true
  }, [texture, cols, rows])

  const gameplayPaused = useGameplayPaused()
  useFrame((state, delta) => {
    if (gameplayPaused) return
    const mesh = meshRef.current
    const mat = materialRef.current
    if (!mesh || !mat) return

    mesh.lookAt(state.camera.position)

    const dir = directionRef ? directionRef.current : 1
    const sidePosition =
      dir < 0
        ? (leftPosition || position)
        : (rightPosition || position)
    const yCompensation = verticalCompensationRef ? verticalCompensationRef.current : 0
    mesh.position.set(sidePosition[0], sidePosition[1] - yCompensation, sidePosition[2])
    const scaleX = mirrorLeft && dir < 0 ? -size : size
    mesh.scale.set(scaleX, size, 1)

    const trigger = triggerRef ? triggerRef.current : 0
    if (trigger !== lastTriggerRef.current) {
      const shouldStartPlayback = Boolean(trigger)
      lastTriggerRef.current = trigger
      if (shouldStartPlayback) {
        frameRef.current = 0
        frameTimerRef.current = 0
        texture.offset.x = 0
        playingRef.current = true
      }
    }

    if (!activeRef.current || !playingRef.current) {
      mat.opacity = 0
      return
    }

    mat.opacity = opacity
    frameTimerRef.current += delta
    const frameDuration = 1 / Math.max(1, fps)
    while (frameTimerRef.current >= frameDuration) {
      frameTimerRef.current -= frameDuration
      if (frameRef.current < Math.max(1, totalFrames) - 1) {
        frameRef.current += 1
      } else {
        // One-shot playback per trigger.
        playingRef.current = false
        break
      }
    }

    const frame = frameRef.current
    const col = frame % cols
    const row = Math.floor(frame / cols)
    texture.offset.x = col / cols
    texture.offset.y = 1 - (row + 1) / rows
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      userData={{ isDecoration: true }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest
        blending={blendMode === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  )
}

export function MinigameStrafeSprite({ activeRef, triggerRef, directionRef }) {
  // Tweak these from one place.
  const STRAFE_RIGHT_POSITION = [0.35, 0.4, -0.7]
  const STRAFE_LEFT_POSITION = [-0.40, 0.4, -0.7]

  return (
    <SpriteSheetBillboard
      activeRef={activeRef}
      triggerRef={triggerRef}
      directionRef={directionRef}
      spritePath='/sprites/strafe.png'
      cols={9}
      rows={1}
      totalFrames={9}
      fps={20}
      rightPosition={STRAFE_RIGHT_POSITION}
      leftPosition={STRAFE_LEFT_POSITION}
      size={.45}
      opacity={0.3}
      blendMode='additive'
      mirrorLeft
    />
  )
}

export function MinigameCrashSprite({ activeRef, triggerRef }) {
  // Tweak crash sprite here.
  const CRASH_POSITION = [0, 0.9, -0.7]

  return (
    <SpriteSheetBillboard
      activeRef={activeRef}
      triggerRef={triggerRef}
      spritePath='/sprites/crash.png'
      cols={10}
      rows={1}
      totalFrames={10}
      fps={24}
      position={CRASH_POSITION}
      size={3}
      opacity={0.9}
      blendMode='additive'
    />
  )
}

/**
 * Trail sprite – follows a mesh's world position, always faces camera, plays sprite sheet on loop.
 * Fades in at start and fades out at end of the GLB animation (when animationProgressRef is provided).
 * @param {Object} followMeshRef - Ref to the mesh to follow (e.g. curve-bulge)
 * @param {Object} animationProgressRef - Ref holding 0–1 progress of the GLB animation (for fade in/out)
 * @param {Object} visibilityRef - Ref holding 0–1 visibility multiplier (fade in/out)
 * @param {number} size - Sprite size
 * @param {number} fps - Frames per second for sprite sheet
 * @param {number} fadePortion - Portion of animation (0–0.5) for fade in and fade out, e.g. 0.12 = 12% each
 */
export function TrailSprite({ followMeshRef, animationProgressRef, visibilityRef, size = 1, fps = 12, fadePortion = 0.12 }) {
  const texture = useTexture('/sprites/trail.jpg')
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const frameTimerRef = useRef(0)
  const frameRef = useRef(0)
  const worldPos = useRef(new THREE.Vector3())

  useEffect(() => {
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.repeat.set(1 / 12, 1)
    texture.offset.set(0, 0)
    texture.needsUpdate = true
  }, [texture])

  const gameplayPaused = useGameplayPaused()
  useFrame((state, delta) => {
    if (gameplayPaused) return
    const mesh = meshRef.current
    const mat = materialRef.current
    if (!mesh || !mat) return

    mesh.lookAt(state.camera.position)

    if (followMeshRef?.current) {
      followMeshRef.current.getWorldPosition(worldPos.current)
      mesh.position.copy(worldPos.current)
    }
    mesh.scale.setScalar(size)

    frameTimerRef.current += delta
    const frameDuration = 1 / Math.max(1, fps)
    while (frameTimerRef.current >= frameDuration) {
      frameTimerRef.current -= frameDuration
      frameRef.current = (frameRef.current + 1) % 12
    }
    const col = frameRef.current % 12
    texture.offset.x = col / 12

    // Fade in at start of GLB animation, fade out at end
    let opacity = 1
    if (animationProgressRef?.current != null) {
      const p = animationProgressRef.current
      const f = Math.min(fadePortion, 0.4)
      if (p < f) {
        opacity = p / f
      } else if (p > 1 - f) {
        opacity = (1 - p) / f
      }
    }
    mat.opacity = opacity * (visibilityRef?.current ?? 1)
  })

  return (
    <mesh ref={meshRef} userData={{ isDecoration: true }}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={1}
        depthWrite={false}
        depthTest
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function MinigameJumpSprite({ activeRef, triggerRef, verticalCompensationRef = null }) {
  // Tweak jump sprite here.
  const JUMP_POSITION = [0, 0.1, 0]

  return (
    <SpriteSheetBillboard
      activeRef={activeRef}
      triggerRef={triggerRef}
      verticalCompensationRef={verticalCompensationRef}
      spritePath='/sprites/jump.png'
      cols={5}
      rows={1}
      totalFrames={5}
      fps={24}
      position={JUMP_POSITION}
      size={.5}
      opacity={1}
      blendMode='additive'
    />
  )
}
