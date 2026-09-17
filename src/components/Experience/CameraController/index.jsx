'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getRobotGroupRef, getRobotIsFrozen } from '../RobotController'
import { useGameplayPaused } from '../GameplayPausedContext'

const SHAKE_DURATION = 0.6
const SHAKE_INTENSITY_POS = 0.08
const SHAKE_INTENSITY_ROT = 0.02
// Smoothing: higher = snappier, lower = more float. Frame-rate independent (uses delta). ~10 = smooth at 30fps.
const CAMERA_SMOOTHING = 10
const ZOOM_MIN = 0.84
const ZOOM_MAX = 1.18
const ZOOM_SENSITIVITY = 0.00115
const ZOOM_SMOOTHING = 8

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

const wheelDeltaY = (event) => {
  let dy = event.deltaY
  if (event.deltaMode === 1) dy *= 16
  if (event.deltaMode === 2) dy *= 120
  // Magic Mouse / trackpad: tiny pixel ticks. Pinch-zoom sends ctrlKey + larger deltas.
  if (event.ctrlKey) dy *= 1.8
  return dy
}

// Camera config per scene: position, fov, lookAtOffset, near, far
// Export so Experience can use the same values for PerspectiveCamera (otherwise it overwrites the camera each render)
export const CAMERA_CONFIG = {
  main: {
    position: [13, 12, 20],
    fov: 14,
    lookAtOffset: 1.5,
    near: 0.1,
    far: 200,
  },
  minigame: {
    position: [0, 1.5, 4],
    fov: 55,
    lookAtOffset: 1.5,
    near: 2.8,
    far: 40, // Track extends to ~-139 in Z; need far > 140 so set3 is visible
  },
}

export default function CameraController({ currentScene = 'main', minigameShakeTrigger = null }) {
  const { camera, clock } = useThree()
  const initialOffset = useRef(null)
  const initialized = useRef(false)
  const frozenPosition = useRef(null) // { x, y, z, lookAt: Vector3 } when frozen
  const robotWorldPosRef = useRef(new THREE.Vector3())
  const prevSceneRef = useRef(currentScene)
  const shakeStartTimeRef = useRef(null)
  const lastShakeTriggerRef = useRef(null)
  const smoothedLookAtRef = useRef(new THREE.Vector3())
  const targetPositionRef = useRef(new THREE.Vector3())
  const targetLookAtRef = useRef(new THREE.Vector3())
  const zoomTargetRef = useRef(1)
  const zoomCurrentRef = useRef(1)
  const currentSceneRef = useRef(currentScene)
  const gameplayPausedRef = useRef(false)
  const snapToTargetRef = useRef(false)
  const gameplayPaused = useGameplayPaused()

  currentSceneRef.current = currentScene
  gameplayPausedRef.current = gameplayPaused

  // When minigame shake is triggered, record clock time so we can shake for SHAKE_DURATION
  useEffect(() => {
    if (minigameShakeTrigger != null && minigameShakeTrigger !== lastShakeTriggerRef.current) {
      lastShakeTriggerRef.current = minigameShakeTrigger
      shakeStartTimeRef.current = clock.getElapsedTime()
    }
    if (minigameShakeTrigger == null) {
      lastShakeTriggerRef.current = null
      shakeStartTimeRef.current = null
    }
  }, [minigameShakeTrigger, clock])

  // When scene changes, apply new camera config and re-initialize offset on next frame
  useEffect(() => {
    if (prevSceneRef.current === currentScene) return
    prevSceneRef.current = currentScene
    const config = CAMERA_CONFIG[currentScene] || CAMERA_CONFIG.main
    if (config && camera && camera.isPerspectiveCamera) {
      camera.position.set(config.position[0], config.position[1], config.position[2])
      camera.fov = config.fov
      if (config.near != null) camera.near = config.near
      if (config.far != null) camera.far = config.far
      camera.updateProjectionMatrix()
      initialized.current = false
      initialOffset.current = null
      frozenPosition.current = null
      zoomTargetRef.current = 1
      zoomCurrentRef.current = 1
      shakeStartTimeRef.current = null
      snapToTargetRef.current = true
    }
  }, [currentScene, camera])

  useEffect(() => {
    const onWheel = (event) => {
      if (gameplayPausedRef.current) return
      if (currentSceneRef.current !== 'main') return
      if (isEditableTarget(event.target)) return

      const dy = wheelDeltaY(event)
      if (Math.abs(dy) < 0.01) return

      event.preventDefault()
      zoomTargetRef.current = THREE.MathUtils.clamp(
        zoomTargetRef.current + dy * ZOOM_SENSITIVITY,
        ZOOM_MIN,
        ZOOM_MAX
      )
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  // Initialize offset from the scene config so a leftover minigame/fall pose cannot bake a bad follow camera.
  useFrame(() => {
    if (gameplayPaused) return
    if (camera && camera.isPerspectiveCamera && !initialized.current) {
      const config = CAMERA_CONFIG[currentScene] || CAMERA_CONFIG.main
      if (!config.position) return
      const lookAtOffset = config.lookAtOffset ?? 1.5
      initialOffset.current = {
        x: config.position[0],
        y: config.position[1],
        z: config.position[2]
      }
      const robotGroupRef = getRobotGroupRef()
      if (robotGroupRef?.current) {
        robotGroupRef.current.updateMatrixWorld(true)
        robotGroupRef.current.getWorldPosition(robotWorldPosRef.current)
        const r = robotWorldPosRef.current
        smoothedLookAtRef.current.set(r.x, r.y + lookAtOffset, r.z)
      } else {
        smoothedLookAtRef.current.set(0, lookAtOffset, 0)
      }
      initialized.current = true
    }
  })

  useFrame((state, delta) => {
    if (gameplayPaused) return
    if (!camera || !camera.isPerspectiveCamera || !initialOffset.current) return
    const config = CAMERA_CONFIG[currentScene] || CAMERA_CONFIG.main
    const lookAtOffset = config.lookAtOffset ?? 1.5

    const isFrozen = getRobotIsFrozen()
    if (isFrozen) {
      if (!frozenPosition.current) {
        const robotGroupRef = getRobotGroupRef()
        frozenPosition.current = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
          lookAt: new THREE.Vector3()
        }
        if (robotGroupRef?.current) {
          robotGroupRef.current.updateMatrixWorld(true)
          robotGroupRef.current.getWorldPosition(frozenPosition.current.lookAt)
        }
      }
      camera.position.set(
        frozenPosition.current.x,
        frozenPosition.current.y,
        frozenPosition.current.z
      )
      camera.lookAt(
        frozenPosition.current.lookAt.x,
        frozenPosition.current.lookAt.y + lookAtOffset,
        frozenPosition.current.lookAt.z
      )
      // Shake on top of frozen position when minigame obstacle hit
      const shakeElapsedFrozen = shakeStartTimeRef.current != null ? clock.getElapsedTime() - shakeStartTimeRef.current : 1
      if (currentScene === 'minigame' && shakeElapsedFrozen < SHAKE_DURATION) {
        const t = 1 - shakeElapsedFrozen / SHAKE_DURATION
        camera.position.x += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
        camera.position.y += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
        camera.position.z += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
        camera.rotation.x += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
        camera.rotation.y += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
        camera.rotation.z += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
      } else if (shakeElapsedFrozen >= SHAKE_DURATION && shakeStartTimeRef.current != null) {
        shakeStartTimeRef.current = null
      }
      camera.updateMatrixWorld()
      return
    }

    frozenPosition.current = null
    const robotGroupRef = getRobotGroupRef()
    if (!robotGroupRef || !robotGroupRef.current) return

    robotGroupRef.current.updateMatrixWorld(true)
    robotGroupRef.current.getWorldPosition(robotWorldPosRef.current)
    const r = robotWorldPosRef.current
    const t = 1 - Math.exp(-CAMERA_SMOOTHING * delta)
    const zoomT = 1 - Math.exp(-ZOOM_SMOOTHING * delta)
    zoomCurrentRef.current = THREE.MathUtils.lerp(zoomCurrentRef.current, zoomTargetRef.current, zoomT)
    const zoom = currentScene === 'main' ? zoomCurrentRef.current : 1
    targetPositionRef.current.set(
      r.x + initialOffset.current.x * zoom,
      initialOffset.current.y * zoom,
      r.z + initialOffset.current.z * zoom
    )
    targetLookAtRef.current.set(r.x, r.y + lookAtOffset, r.z)

    if (snapToTargetRef.current) {
      camera.position.copy(targetPositionRef.current)
      smoothedLookAtRef.current.copy(targetLookAtRef.current)
      snapToTargetRef.current = false
    } else {
      camera.position.lerp(targetPositionRef.current, t)
      smoothedLookAtRef.current.lerp(targetLookAtRef.current, t)
    }
    camera.lookAt(smoothedLookAtRef.current)

    // Minigame screen shake: apply offset after base position so it isn't overwritten
    const shakeElapsed = shakeStartTimeRef.current != null ? clock.getElapsedTime() - shakeStartTimeRef.current : 1
    if (currentScene === 'minigame' && shakeElapsed < SHAKE_DURATION) {
      const t = 1 - shakeElapsed / SHAKE_DURATION
      camera.position.x += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
      camera.position.y += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
      camera.position.z += SHAKE_INTENSITY_POS * t * (2 * Math.random() - 1)
      camera.rotation.x += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
      camera.rotation.y += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
      camera.rotation.z += SHAKE_INTENSITY_ROT * t * (2 * Math.random() - 1)
    } else if (shakeElapsed >= SHAKE_DURATION && shakeStartTimeRef.current != null) {
      shakeStartTimeRef.current = null
    }

    camera.updateMatrixWorld()
  })

  return null
}
