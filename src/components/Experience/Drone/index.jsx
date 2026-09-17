'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getRobotGroupRef } from '../RobotController'
import { setDoorOpen, getDoorOpen } from '../doorState'
import { getSoundManager, SOUND_IDS } from '../../../audio'

const Drone = ({ position = [0, 0, 0], scale = [1, 1, 1], onDoorOpen = null, onDroneMessage = null, isPaused = false }) => {
  const { scene, animations } = useGLTF('/models/drone.glb')
  // Clone so each mount gets a fresh instance (avoids missing drone when switching back from minigame)
  const clonedScene = useMemo(() => (scene ? scene.clone(true) : null), [scene])
  const { actions, mixer } = useAnimations(animations, clonedScene)
  const droneRef = useRef(null)
  const trackedRef = useRef(null)
  const spotLightRef = useRef(null)
  const beamMeshRef = useRef(null)
  const beamMaterialRef = useRef(null)
  const spotTargetRef = useRef(new THREE.Object3D())
  const droneWorldPos = useRef(new THREE.Vector3())
  const robotWorldPos = useRef(new THREE.Vector3())
  const beamDirectionRef = useRef(new THREE.Vector3())
  const beamQuatRef = useRef(new THREE.Quaternion())
  const beamPosRef = useRef(new THREE.Vector3())
  const beamDownRef = useRef(new THREE.Vector3(0, -1, 0))
  const alarmActiveRef = useRef(false)
  const heightOffset = 1.5
  const speedRef = useRef(0.1)
  const spotYOffset = -2
  const spotTargetYOffset = -4.2
  const spotDistance = 50
  const spotAngle = .45
  const normalSpeed = 0.1
  const animationSpeed = 0.32 // baked GLB animation playback: 0.5 = half speed
  const slowedSpeed = 0
  const speedLerpRate = 20
  const stopEpsilon = 0.002
  const baseSpotIntensity = 15
  const alarmSpotIntensity = 28
  const alarmFlashSpeed = 20
  const proximityDistance = .5
  // Stylized spotlight beam (cheap fake volumetric cone)
  const beamLength = 4
  const beamYOffset = 2 // tweak beam up/down independently
  const beamOpacityBase = 0.1
  const beamOpacityRange = .1
  const beamColor = '#ff9f2e'
  const beamRadiusMultiplier = 0.3
  const beamAlphaMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Top of cone (light origin) fully transparent; stronger opacity farther down.
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
      grad.addColorStop(0.0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.18, 'rgba(255,255,255,0.12)')
      grad.addColorStop(0.55, 'rgba(255,255,255,0.7)')
      grad.addColorStop(1.0, 'rgba(255,255,255,1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }, [])
  const beamGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.03, 1, 1, 16, 1, true)
    // Move top cap to local origin so beam starts exactly at spotlight source.
    g.translate(0, -0.5, 0)
    return g
  }, [])
  const [isDetected, setIsDetected] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(3)
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const detectionDisabledRef = useRef(false)
  const detectionIntervalRef = useRef(null)
  const detectionTimeoutRef = useRef(null)
  const lastIsNearRef = useRef(false)

  const animationStartOffset = 0.5

  // When returning to main with door already open: disable detection (no spotlight alarm), drone still flies
  useEffect(() => {
    if (getDoorOpen()) {
      detectionDisabledRef.current = true
    }
  }, [])

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (action) {
          action.reset()
          action.setLoop(THREE.LoopRepeat, Infinity)
          if (action.getClip && action.getClip()?.duration) {
            action.time = action.getClip().duration * animationStartOffset
          }
          action.play()
        }
      })
    }

    return () => {
      if (actions) {
        Object.values(actions).forEach((action) => {
          if (action) {
            action.stop()
          }
        })
      }
    }
  }, [actions])

  useEffect(() => {
    if (!clonedScene) return
    if (!animations || animations.length === 0) {
      trackedRef.current = clonedScene
      return
    }

    const firstTrack = animations[0].tracks?.[0]?.name
    const nodeName = firstTrack ? firstTrack.split('.')[0] : null
    const trackedNode = nodeName ? clonedScene.getObjectByName(nodeName) : null
    trackedRef.current = trackedNode || clonedScene
  }, [animations, clonedScene])

  useFrame((state, delta) => {
    if (!clonedScene) return
    if (isPaused) {
      alarmActiveRef.current = false
      if (spotLightRef.current) spotLightRef.current.intensity = 0
      if (beamMaterialRef.current) beamMaterialRef.current.opacity = 0
      if (beamMeshRef.current) beamMeshRef.current.visible = false
      return
    }
    const robotGroup = getRobotGroupRef()?.current
    const tracked = trackedRef.current || droneRef.current

    if (!detectionDisabledRef.current && robotGroup && tracked) {
      tracked.getWorldPosition(droneWorldPos.current)
      robotGroup.getWorldPosition(robotWorldPos.current)
      const dx = droneWorldPos.current.x - robotWorldPos.current.x
      const dz = droneWorldPos.current.z - robotWorldPos.current.z
      const isNear = Math.hypot(dx, dz) <= proximityDistance

      alarmActiveRef.current = isNear
      if (isNear !== lastIsNearRef.current) {
        lastIsNearRef.current = isNear
        setIsDetected(isNear)
      }

    } else {
      alarmActiveRef.current = false
    }

    const targetSpeed = alarmActiveRef.current ? slowedSpeed : normalSpeed
    speedRef.current = THREE.MathUtils.lerp(
      speedRef.current,
      targetSpeed,
      1 - Math.exp(-speedLerpRate * delta)
    )
    if (alarmActiveRef.current && speedRef.current < stopEpsilon) {
      speedRef.current = 0
    }

    if (mixer) {
      const playbackScale = normalSpeed > 0 ? speedRef.current / normalSpeed : 0
      mixer.timeScale = animationSpeed * playbackScale
      mixer.update(delta)
    }

    if (tracked && spotLightRef.current) {
      tracked.getWorldPosition(droneWorldPos.current)

      // Position spotlight slightly above the drone
      spotLightRef.current.position.set(
        droneWorldPos.current.x,
        droneWorldPos.current.y + spotYOffset,
        droneWorldPos.current.z
      )

      // Aim the spotlight below the drone
      spotTargetRef.current.position.set(
        droneWorldPos.current.x,
        droneWorldPos.current.y + spotTargetYOffset,
        droneWorldPos.current.z
      )
      spotTargetRef.current.updateMatrixWorld(true)

      if (detectionDisabledRef.current) {
        spotLightRef.current.intensity = 0
      } else if (alarmActiveRef.current) {
        const pulse = Math.sin(state.clock.elapsedTime * alarmFlashSpeed)
        spotLightRef.current.intensity = pulse > 0 ? alarmSpotIntensity : 0
      } else {
        spotLightRef.current.intensity = baseSpotIntensity
      }
    }

    if (tracked && beamMeshRef.current && beamMaterialRef.current) {
      // Place beam at spotlight source and orient toward spotlight target.
      beamPosRef.current.set(
        droneWorldPos.current.x,
        droneWorldPos.current.y + spotYOffset + beamYOffset,
        droneWorldPos.current.z
      )
      beamMeshRef.current.position.copy(beamPosRef.current)

      beamDirectionRef.current.set(0, spotTargetYOffset - spotYOffset, 0).normalize()
      beamQuatRef.current.setFromUnitVectors(beamDownRef.current, beamDirectionRef.current)
      beamMeshRef.current.quaternion.copy(beamQuatRef.current)

      const baseRadius = Math.tan(spotAngle) * beamLength * beamRadiusMultiplier
      beamMeshRef.current.scale.set(baseRadius, beamLength, baseRadius)

      if (detectionDisabledRef.current) {
        beamMaterialRef.current.opacity = 0
        beamMeshRef.current.visible = false
      } else {
        const intensity = spotLightRef.current ? spotLightRef.current.intensity : 0
        const norm = THREE.MathUtils.clamp(intensity / Math.max(1, alarmSpotIntensity), 0, 1)
        beamMaterialRef.current.opacity = beamOpacityBase + norm * beamOpacityRange
        beamMeshRef.current.visible = intensity > 0.05
      }
    }
  })

  useEffect(() => {
    if (isPaused) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
        detectionTimeoutRef.current = null
      }
      alarmActiveRef.current = false
      lastIsNearRef.current = false
      setIsDetected(false)
      setTimerSeconds(3)
      setShowMessage(false)
      setMessage('')
      getSoundManager()?.stop(SOUND_IDS.ALARM)
      return
    }

    if (detectionDisabledRef.current) {
      return
    }

    if (!isDetected) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
        detectionTimeoutRef.current = null
      }
      setTimerSeconds(3)
      setShowMessage(false)
      setMessage('')
      return
    }

    setShowMessage(true)
    setMessage('Detected! 00:03')
    setTimerSeconds(3)

    const grantAccess = () => {
      if (detectionDisabledRef.current) return
      detectionDisabledRef.current = true
      alarmActiveRef.current = false
      lastIsNearRef.current = false
      setIsDetected(false)
      setTimerSeconds(0)
      setMessage('Lasers deactivated, access granted!')
      setDoorOpen(true)
      onDoorOpen?.()
      const mgr = getSoundManager()
      mgr?.stop(SOUND_IDS.ALARM)
      mgr?.play(SOUND_IDS.DOOR)
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current)
      detectionTimeoutRef.current = setTimeout(() => {
        setShowMessage(false)
      }, 2000)
    }

    detectionIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current)
            detectionIntervalRef.current = null
          }
          setTimeout(grantAccess, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
    }
  }, [isDetected, isPaused])

  // Alarm loops only while the drone is actively detecting.
  useEffect(() => {
    const mgr = getSoundManager()
    if (!mgr) return
    if (!isPaused && isDetected && !detectionDisabledRef.current) {
      mgr.play(SOUND_IDS.ALARM, { loop: true })
      return () => mgr.stop(SOUND_IDS.ALARM)
    }
    mgr.stop(SOUND_IDS.ALARM)
    return undefined
  }, [isDetected, isPaused])

  useEffect(() => {
    if (!clonedScene) return
    clonedScene.userData.isDecoration = true
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.userData.isDecoration = true
      }
    })
  }, [clonedScene])

  useEffect(() => {
    if (!clonedScene) return
    clonedScene.add(spotTargetRef.current)
    return () => {
      clonedScene.remove(spotTargetRef.current)
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [clonedScene])

  useEffect(() => {
    if (!showMessage) return
    if (message.startsWith('Detected!')) {
      const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0')
      const seconds = String(timerSeconds % 60).padStart(2, '0')
      setMessage(`Detected! ${minutes}:${seconds}`)
    }
  }, [timerSeconds, showMessage, message])

  // Report message to parent so it can render a fixed screen overlay (avoids choppy in-scene Html)
  useEffect(() => {
    onDroneMessage?.({ show: showMessage, text: message })
  }, [showMessage, message, onDroneMessage])

  if (!clonedScene) return null

  return (
    <>
      <primitive
        ref={droneRef}
        object={clonedScene}
        position={[position[0], position[1] + heightOffset, position[2]]}
        scale={scale}
      />
      <spotLight
        ref={spotLightRef}
        color="orange"
        intensity={baseSpotIntensity}
        distance={spotDistance}
        angle={spotAngle}
        penumbra={0.5}
        //castShadow
        target={spotTargetRef.current}
        /* shadow-mapSize={[512, 512]}
				shadow-bias={-0.001}
				shadow-radius={20}
				shadow-camera-near={0.1}
				shadow-camera-far={15} */
      />
      <mesh
        ref={beamMeshRef}
        geometry={beamGeometry}
        userData={{ isDecoration: true }}
      >
        <meshBasicMaterial
          ref={beamMaterialRef}
          color={beamColor}
          alphaMap={beamAlphaMap}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

Drone.displayName = 'Drone'
export default Drone
