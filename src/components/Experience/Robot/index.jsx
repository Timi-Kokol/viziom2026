'use client'

import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameplayPaused } from '../GameplayPausedContext'

const Robot = forwardRef(function Robot({ position, sceneId = 'main', crashTrigger, minigameRestartCounter = 0 }, ref) {
  const { scene, animations } = useGLTF('/models/robot.glb')
  const { actions, mixer } = useAnimations(animations, scene)
  const lastCrashTriggerRef = useRef(null)
  const prevSceneIdRef = useRef(sceneId)

  // Clone and center the scene
  const centeredScene = useMemo(() => {
    if (!scene) return null
    
    const cloned = scene.clone()
    
    // Calculate bounding box to center the model
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    
    // Move the scene so its center is at origin
    cloned.position.x = -center.x
    cloned.position.y = -center.y
    cloned.position.z = -center.z
    
    return cloned
  }, [scene])

  // Set the ref to the centered scene
  useEffect(() => {
    if (centeredScene && ref) {
      if (typeof ref === 'function') {
        ref(centeredScene)
      } else if (ref.current !== undefined) {
        ref.current = centeredScene
      }
    }

    scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// Mark all children as decoration too
				child.userData.isDecoration = true
			}
		});
  }, [centeredScene, ref, scene])

  // Play only "circle" animations on loop (main + minigame)
  useEffect(() => {
    if (!actions) return
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('circle')) return
      action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.5).play()
    })
    return () => {
      Object.entries(actions).forEach(([name, action]) => {
        if (!action || !name.toLowerCase().includes('circle')) return
        action.fadeOut(0.5)
      })
    }
  }, [actions])

  // When crashTrigger is set (minigame crash): pause circle, play "crash" animations once
  useEffect(() => {
    if (!actions || sceneId !== 'minigame' || crashTrigger == null || crashTrigger === lastCrashTriggerRef.current) return
    lastCrashTriggerRef.current = crashTrigger
    // Pause circle animations while crash plays
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('circle')) return
      action.fadeOut(0.2)
    })
    // Play crash once, no loop
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('crash')) return
      action.reset().setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.fadeIn(0.1).play()
    })
  }, [actions, crashTrigger, sceneId])

  // On minigame Restart: reset crash to first frame (normal pose), then resume circle
  useEffect(() => {
    if (!actions || minigameRestartCounter === 0) return
    // Reset crash actions to time 0 so the robot leaves the exploded pose
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('crash')) return
      action.reset().stop()
    })
    // Resume circle animations
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('circle')) return
      action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.5).play()
    })
  }, [actions, minigameRestartCounter])

  // Main scene (including remount after "Back to main"): leave crash pose, resume circle.
  // Physics remounts the robot, so we cannot rely on a minigame→main prev-scene check.
  useEffect(() => {
    prevSceneIdRef.current = sceneId
    if (!actions || sceneId !== 'main') return
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('crash')) return
      action.reset().stop()
    })
    Object.entries(actions).forEach(([name, action]) => {
      if (!action || !name.toLowerCase().includes('circle')) return
      action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play()
    })
  }, [actions, sceneId])

  const gameplayPaused = useGameplayPaused()
  // Update animation mixer each frame
  useFrame((state, delta) => {
    if (gameplayPaused) return
    if (mixer) {
      mixer.update(delta)
    }
  })

  if (!centeredScene) return null

  return (
    <primitive object={scene} position={position}/>
  )
})

export default Robot
