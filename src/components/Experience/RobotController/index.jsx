'use client'

import { RigidBody, useRapier } from '@react-three/rapier'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Robot from '../Robot'
import { MinigameCrashSprite, MinigameJumpSprite, MinigameStrafeSprite } from '../Sprites'
import { getDoorOpen, getAndClearGroundCacheInvalidate } from '../doorState'
import { boxOverlapsMeshGeometry } from '../../../utils/minigameCollision'
import { useSound, SOUND_IDS, getSoundManager } from '../../../audio'

// Shared state for external access (outside Canvas)
let globalRobotGroupRef = null
let globalRobotBodyRef = null
let globalIsFrozen = false
export const getRobotGroupRef = () => globalRobotGroupRef
export const getRobotBodyRef = () => globalRobotBodyRef
export const getRobotIsFrozen = () => globalIsFrozen

const _upAxis = new THREE.Vector3(0, 1, 0)

// Helper function to normalize angle difference (handles wrapping)
const normalizeAngleDiff = (current, target) => {
  let diff = target - current
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return diff
}

export function RobotController({ sceneId = 'main', minigameSpawnPosition = [0, 0, 0], minigameRestartCounter = 0, onFallThrough, minigameShowFallMenu = false, minigameCrashTrigger = null, gameplayPaused = false }) {
  const { play } = useSound()
  const groupRef = useRef(null)
  const bodyRef = useRef(null)
  const visual = useRef(null)
  const robotWorldPosRef = useRef(new THREE.Vector3())
  // Minigame: always spawn/restart facing this direction (radians). 180° = Math.PI.
  const MINIGAME_SPAWN_ROTATION = Math.PI
  const rotation = useRef(Math.PI) // Current rotation (start facing 180 degrees)
  const targetRotation = useRef(Math.PI) // Target rotation (start facing 180 degrees)
  const initialized = useRef(false)
  const prevSceneId = useRef(sceneId)
  const lastEnteredMainAt = useRef(0) // Grace period after "Back to main" so we don't immediately re-trigger fall-through
  const targetGroundY = useRef(0) // Smooth ground target
  const velocity = useRef(new THREE.Vector3(0, 0, 0)) // Current velocity
  const moveDirection = useRef(new THREE.Vector3(0, 0, 0)) // Current movement direction for rotation
  const wasFrozen = useRef(false) // Track previous frozen state to detect fall transitions
  const isRespawning = useRef(false) // Track if currently respawning
  const respawnProgress = useRef(0) // Animation progress (0 to 1)
  const fallStartTime = useRef(0) // Track when the fall started for auto-respawn
  const jumpVelocity = useRef(0) // Vertical speed when jumping (0 = on ground)
  const hadGroundLastFrame = useRef(false) // Was standing on ground last frame (for jump allow)
  const currentPitch = useRef(0) // Smooth pitch for jump + movement tilt (visual only)
  const currentRoll = useRef(0) // Smooth roll for strafe lean (visual only)
  const landingSquashProgress = useRef(0) // 1→0 over duration when we land (for squash scale)
  const landingEaseProgress = useRef(0) // >0: easing Y to ground over a few frames to soften camera jerk
  const landingEaseTargetY = useRef(0)
  const respawnDelay = 0.5 // Seconds to wait before auto-respawning
  // Minigame: only treat as "fallen" when clearly off the track. Use a low value so we don't trigger
  // before ground raycast finds the floor (track can be at MINIGAME_Y_OFFSET e.g. -2). Grace period below.
  const minigameFallYThreshold = -2.5
  const { world } = useRapier()
  const { raycaster, scene: threeScene } = useThree()
  
  // Keyboard state
  const [keys, setKeys] = useState({})

  // Cache for expensive scene traversal used by raycasting.
  // Traversing every frame (especially with a big GLB) can destroy FPS.
  const raycastMeshesRef = useRef([])
  const groundBoundsRef = useRef(new THREE.Box3())
  const hasGroundBoundsRef = useRef(false)
  // Trap door (main scene): store its bounds so we can force fall-through when unlocked,
  // even if raycasting hits nearby edge triangles / hidden meshes.
  const trapDoorBoundsRef = useRef(new THREE.Box3())
  const scratchMeshBoundsRef = useRef(new THREE.Box3())
  const hasTrapDoorBoundsRef = useRef(false)
  const fallingThroughTrapRef = useRef(false)
  const lastCacheBuildAtRef = useRef(0)
  const prevDoorOpenRef = useRef(null)
  const prevSceneIdForCacheRef = useRef(sceneId)
  const minigameCacheRebuildFramesRef = useRef(0) // Force rebuild for first N frames in minigame so chunk meshes are picked up
  const mainCacheRebuildFramesRef = useRef(0) // Same for main after Physics remounts on "Back to main"
  const minigameFallGraceUntilRef = useRef(0) // Don't trigger "fallen" by Y for this many seconds after entering minigame

  // Minigame: 3-lane strafe (0=left, 1=center, 2=right). One lane per key press.
  const minigameLaneIndex = useRef(1)
  const prevMinigameLeftKey = useRef(false)
  const prevMinigameRightKey = useRef(false)
  const minigameStrafeRollTargetRef = useRef(0) // Written in movement block, read in visual block (one-frame delay is fine)
  const minigameCollisionMeshesRef = useRef([]) // Meshes whose name contains "collision" (block lane movement)
  const minigameCollisionRebuildTickRef = useRef(0) // Rebuild list periodically so clones are included
  const minigamePrevXRef = useRef(0)
  const minigameStrafeActiveRef = useRef(false)
  const minigameStrafeTriggerRef = useRef(0)
  const minigameStrafeDirectionRef = useRef(1) // +1 right/default, -1 left
  const minigameCrashSpriteActiveRef = useRef(false)
  const minigameCrashSpriteTriggerRef = useRef(0)
  const minigameJumpSpriteActiveRef = useRef(false)
  const minigameJumpSpriteTriggerRef = useRef(0)
  const minigameRobotBoxRef = useRef(new THREE.Box3())
  const minigameMeshBoxRef = useRef(new THREE.Box3())
  const minigameRobotSizeRef = useRef(new THREE.Vector3(0.5, 0.7, 0.5))
  // Reusable vectors in useFrame to avoid per-frame allocations
  const targetDirectionRef = useRef(new THREE.Vector3(0, 0, 0))
  const moveAmountRef = useRef(new THREE.Vector3(0, 0, 0))
  const forwardDirRef = useRef(new THREE.Vector3(0, 0, -1))
  const targetVelocityRef = useRef(new THREE.Vector3(0, 0, 0))
  const velocityDiffRef = useRef(new THREE.Vector3(0, 0, 0))
  const rayOriginRef = useRef(new THREE.Vector3())
  const rayDirRef = useRef(new THREE.Vector3())
  const groundRayOriginRef = useRef(new THREE.Vector3())
  const groundRayStartRef = useRef(new THREE.Vector3())
  const groundRayDirRef = useRef(new THREE.Vector3(0, -1, 0))

  const rebuildRaycastCache = () => {
    if (!threeScene) return
    const robotGroup = groupRef.current
    const body = bodyRef.current
    const doorOpen = getDoorOpen()

    const isChildOf = (obj, parent) => {
      if (!obj || !parent) return false
      let current = obj.parent
      while (current) {
        if (current === parent) return true
        current = current.parent
      }
      return false
    }

    const meshes = []
    const bounds = groundBoundsRef.current
    let hasBounds = false
    let foundTrapDoor = false

    // Make sure world matrices are current before collecting bounds.
    threeScene.updateMatrixWorld(true)
    threeScene.traverse((child) => {
      if (robotGroup && (child === robotGroup || isChildOf(child, robotGroup))) return
      if (body && (child === body || isChildOf(child, body))) return
      if (visual.current && (child === visual.current || isChildOf(child, visual.current))) return
      if (child.userData && child.userData.isDecoration) return
      const childName = child.name?.toLowerCase?.() ?? ''
      // Trap door collider: keep bounds cached even when excluded from raycast meshes.
      if (childName.startsWith('collision-door')) {
        child.updateMatrixWorld(true)
        trapDoorBoundsRef.current.setFromObject(child)
        foundTrapDoor = true
        if (doorOpen) return
      }
      if (child instanceof THREE.Mesh && child.visible && child.geometry) {
        meshes.push(child)
        child.updateMatrixWorld(true)
        // Build one union bounds (used for "am I over any ground at all?" fast check)
        const meshBounds = scratchMeshBoundsRef.current.setFromObject(child)
        if (!hasBounds) {
          bounds.copy(meshBounds)
          hasBounds = true
        } else {
          bounds.union(meshBounds)
        }
      }
    })

    raycastMeshesRef.current = meshes
    hasGroundBoundsRef.current = hasBounds
    hasTrapDoorBoundsRef.current = foundTrapDoor
    lastCacheBuildAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    prevDoorOpenRef.current = doorOpen
    prevSceneIdForCacheRef.current = sceneId
  }

  // Movement settings
  const moveSpeed = 1 // Target movement speed
  const acceleration = 3 // How fast to reach target speed
  const deceleration = 3 // How fast to stop
  const rotationSpeed = 3 // How fast to rotate (radians per second)
  const characterHeight = 0 // Height offset from ground
  const visualOffsetY = 0 // Visual offset to lower the robot model (negative = down)
  const gravity = -3 // Reduced from -9.81 for slower falling
  const groundRayLength = 10
  const groundSmoothing = 10 // How fast to smooth to target ground height
  const characterRadius = 0.35 // Used for wall collision (robot half-width)
  const wallRayHeight = 0.2 // Height above robot base (feet) for the wall-check ray. Walls must extend at least this high to block; shorter obstacles can be stepped over.
  // Trap door (main): inset so the drop zone matches the visible hole, not the larger collider.
  const TRAP_DOOR_MARGIN = -0.6
  const initialJumpSpeed = 1.3 // Upward speed when jump starts (Space) – main scene
  const initialJumpSpeedMinigame = 1.45 // Minigame: jump a bit higher
  // Jump animation (visual only)
  const jumpPitchFactor = 0.25 // Pitch per unit jump velocity (lean back up, forward down)
  const jumpPitchMax = 0.4 // Max tilt in radians (~23°)
  const jumpPitchSmoothing = 12
  const landingSquashDuration = 0.14
  const landingSquashY = 0.2 // Compress Y to 0.86 on land
  const landingSquashXZ = 0.06 // Slight XZ spread to 1.06 on land
  const landingEaseDuration = 0.1 // Seconds to ease Y to ground on land (reduces camera jerk)
  const landingEaseTimeConstant = 0.025 // Lower = snappier, higher = smoother
  // Movement tilt (lean into direction when on ground)
  const movementPitchFactor = -0.3 // Lean forward/back with W/S
  const movementPitchMax = 0.22 // Max ~12–13°
  const movementRollFactor = 0.2 // Lean into strafe with A/D
  const movementRollMax = 0.2
  const movementTiltSmoothing = 10
  // Minigame: roll (lean) while strafing toward target lane. Tune to taste; 0 = no strafe roll.
  const minigameStrafeRollFactor = 0.4 // Roll per unit of distance to target lane (radians)
  const minigameStrafeRollMax = 0.22 // Max roll in radians (~12°)
  const minigameStrafeRollSmoothing = 10 // How fast roll catches up
  // Minigame strafe sprite-sheet effect (fine-tune here)
  const MINIGAME_STRAFE_SPRITE_ENABLED = true
  const MINIGAME_CRASH_SPRITE_ENABLED = true
  const MINIGAME_JUMP_SPRITE_ENABLED = true
  const MINIGAME_STRAFE_ACTIVE_EPSILON = 0.01

  // Obstacle crash trigger comes from Experience; play one-shot crash sprite when it changes.
  minigameCrashSpriteTriggerRef.current = minigameCrashTrigger ?? 0
  minigameCrashSpriteActiveRef.current = sceneId === 'minigame'
  minigameJumpSpriteActiveRef.current = sceneId === 'minigame'

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      setKeys((prev) => ({ ...prev, [key]: true }))
    }

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase()
      setKeys((prev) => ({ ...prev, [key]: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Main scene: robot gas sound loops while any move key is held (forward, back, turn left/right)
  const mainMoveKeyPressed = !gameplayPaused && sceneId === 'main' && !!(
    keys.w || keys.s || keys.a || keys.d ||
    keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright']
  )
  useEffect(() => {
    const mgr = getSoundManager()
    if (!mgr) return
    if (mainMoveKeyPressed) {
      mgr.play(SOUND_IDS.ROBOTGAS, { loop: true })
    } else {
      mgr.stop(SOUND_IDS.ROBOTGAS)
    }
    return () => mgr.stop(SOUND_IDS.ROBOTGAS)
  }, [mainMoveKeyPressed])

  // Export refs for external access
  useEffect(() => {
    globalRobotGroupRef = groupRef
    globalRobotBodyRef = bodyRef
    return () => {
      if (globalRobotGroupRef === groupRef) globalRobotGroupRef = null
      if (globalRobotBodyRef === bodyRef) globalRobotBodyRef = null
      globalIsFrozen = false
    }
  }, [])

  // Physics remounts this controller on scene switch, so treat every main mount as a return.
  useEffect(() => {
    if (sceneId === 'main') lastEnteredMainAt.current = Date.now()
  }, [sceneId])

  // Reset robot position/state when scene changes (e.g. main <-> minigame)
  useEffect(() => {
    if (prevSceneId.current === sceneId) return
    prevSceneId.current = sceneId
    if (sceneId === 'main') lastEnteredMainAt.current = Date.now()
    const startRotation = sceneId === 'main' ? Math.PI : MINIGAME_SPAWN_ROTATION
    rotation.current = startRotation
    targetRotation.current = startRotation
    // Main spawn at (0,0,0); minigame spawn at minigameSpawnPosition (see Scene MINIGAME_SPAWN_POSITION)
    const [sx, sy, sz] = sceneId === 'minigame' ? minigameSpawnPosition : [0, 0, 0]
    if (groupRef.current) {
      groupRef.current.position.set(sx, sy, sz)
      groupRef.current.rotation.y = startRotation
    }
    // Defer body set: when switching to minigame, Physics remounts so body may not exist yet (null pointer to Rust)
    const t = requestAnimationFrame(() => {
      try {
        if (bodyRef.current?.setTranslation) bodyRef.current.setTranslation({ x: sx, y: sy, z: sz }, true)
      } catch (_) {}
    })
    velocity.current.set(0, 0, 0)
    moveDirection.current.set(0, 0, 0)
    wasFrozen.current = false
    fallStartTime.current = 0
    targetGroundY.current = 0
    jumpVelocity.current = 0
    fallingThroughTrapRef.current = false
    currentPitch.current = 0
    currentRoll.current = 0
    landingSquashProgress.current = 0
    landingEaseProgress.current = 0
    landingEaseTargetY.current = 0
    isRespawning.current = false
    respawnProgress.current = 0
    if (sceneId === 'minigame') {
      minigameLaneIndex.current = 1
      prevMinigameLeftKey.current = false
      prevMinigameRightKey.current = false
      minigameStrafeActiveRef.current = false
      minigameStrafeTriggerRef.current = 0
      minigameStrafeDirectionRef.current = 1
      minigameCrashSpriteActiveRef.current = true
      minigameJumpSpriteActiveRef.current = true
    } else {
      minigameCollisionMeshesRef.current = []
      minigameStrafeActiveRef.current = false
      minigameStrafeTriggerRef.current = 0
      minigameStrafeDirectionRef.current = 1
      minigameCrashSpriteActiveRef.current = false
      minigameJumpSpriteActiveRef.current = false
      minigameJumpSpriteTriggerRef.current = 0
    }
    return () => cancelAnimationFrame(t)
  }, [sceneId, minigameSpawnPosition])

  // Rebuild raycast cache on scene changes (main <-> minigame).
  useEffect(() => {
    if (sceneId === 'minigame') {
      // Clear cache so we don't use main-scene meshes; next frames will rebuild and pick up chunk meshes.
      raycastMeshesRef.current = []
      hasGroundBoundsRef.current = false
      minigameCacheRebuildFramesRef.current = 0
      minigameCollisionMeshesRef.current = [] // Rebuild so "collision" meshes from chunks are found
    } else {
      raycastMeshesRef.current = []
      hasGroundBoundsRef.current = false
      mainCacheRebuildFramesRef.current = 0
    }
    // Delay one tick so scene graph updates (GLBs mount) before we traverse.
    const t = setTimeout(() => {
      rebuildRaycastCache()
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId])

  // On minigame restart: MinigameWorld remounts (new key) but we don't – clear caches so we don't keep raycasting/colliding against disposed meshes.
  useEffect(() => {
    if (sceneId !== 'minigame' || minigameRestartCounter === 0) return
    raycastMeshesRef.current = []
    hasGroundBoundsRef.current = false
    minigameCacheRebuildFramesRef.current = 0
    minigameCollisionMeshesRef.current = []
    const t = setTimeout(() => rebuildRaycastCache(), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minigameRestartCounter, sceneId])

  // Restart in minigame: reset position and state. Defer body set – after Physics remount (main→minigame) body may not be ready yet (null pointer to Rust).
  useLayoutEffect(() => {
    if (sceneId !== 'minigame' || minigameRestartCounter === 0) return
    const [sx, sy, sz] = minigameSpawnPosition
    if (groupRef.current) {
      groupRef.current.position.set(sx, sy, sz)
      groupRef.current.rotation.y = MINIGAME_SPAWN_ROTATION
    }
    rotation.current = MINIGAME_SPAWN_ROTATION
    targetRotation.current = MINIGAME_SPAWN_ROTATION
    velocity.current.set(0, 0, 0)
    moveDirection.current.set(0, 0, 0)
    wasFrozen.current = false
    fallStartTime.current = 0
    targetGroundY.current = 0
    jumpVelocity.current = 0
    fallingThroughTrapRef.current = false
    currentPitch.current = 0
    currentRoll.current = 0
    landingSquashProgress.current = 0
    landingEaseProgress.current = 0
    isRespawning.current = false
    respawnProgress.current = 0
    minigameLaneIndex.current = 1
    prevMinigameLeftKey.current = false
    prevMinigameRightKey.current = false
    minigameStrafeActiveRef.current = false
    minigameStrafeTriggerRef.current = 0
    minigameStrafeDirectionRef.current = 1
    minigameCrashSpriteActiveRef.current = true
    minigameJumpSpriteActiveRef.current = true
    minigameJumpSpriteTriggerRef.current = 0
    minigameCollisionMeshesRef.current = []
    // Defer body set: Rapier body may not exist yet (e.g. Physics just remounted main→minigame), avoid "null pointer passed to rust"
    const t = requestAnimationFrame(() => {
      try {
        if (bodyRef.current?.setTranslation) bodyRef.current.setTranslation({ x: sx, y: sy, z: sz }, true)
      } catch (_) {}
    })
    return () => cancelAnimationFrame(t)
  }, [minigameRestartCounter, sceneId, minigameSpawnPosition])

  useFrame((state, delta) => {
    if (gameplayPaused) return
    if (!groupRef.current || !visual.current || !bodyRef.current) return

    // Initialize position on first frame (body is ready by now after Physics remount)
    if (!initialized.current) {
      const [ix, iy, iz] = sceneId === 'minigame' ? minigameSpawnPosition : [0, 0, 0]
      const rotY = sceneId === 'minigame' ? MINIGAME_SPAWN_ROTATION : Math.PI
      groupRef.current.position.set(ix, iy, iz)
      groupRef.current.rotation.y = rotY
      targetGroundY.current = 0
      if (bodyRef.current.setTranslation) {
        bodyRef.current.setTranslation({ x: ix, y: iy, z: iz }, true)
      }
      initialized.current = true
    }

    // Always read current position from the group (source of truth)
    const currentPos = groupRef.current.position

    // Handle respawn animation
    if (isRespawning.current && visual.current) {
      respawnProgress.current += delta * 3 // 0.33 seconds total (1 / 3 = 0.33)
      if (respawnProgress.current >= 1) {
        respawnProgress.current = 1
        isRespawning.current = false
      }
      
      // Animate scale with smooth easing (fade in with bounce effect)
      let scale = 0
      if (respawnProgress.current < 0.1) {
        // Stay invisible for first 10%
        scale = 0
      } else {
        // Smooth scale up with bounce effect
        const t = (respawnProgress.current - 0.1) / 0.9 // Normalize to 0-1
        // Ease out cubic with overshoot
        scale = 1 - Math.pow(1 - t, 3)
        // Add bounce overshoot
        if (t < 0.7) {
          scale *= 1.15 // Overshoot to 1.15
        } else {
          // Settle back to 1
          scale = THREE.MathUtils.lerp(1.15, 1, (t - 0.7) / 0.3)
        }
      }
      
      // Scale the visual group
      if (visual.current && visual.current.scale) {
        visual.current.scale.set(scale, scale, scale)
      }
    } else if (visual.current && !isRespawning.current) {
      // Minigame: no scale animation (no landing squash); main: landing squash when we land from a jump
      if (sceneId === 'minigame') {
        visual.current.scale.set(1, 1, 1)
      } else if (landingSquashProgress.current > 0) {
        landingSquashProgress.current -= delta / landingSquashDuration
        if (landingSquashProgress.current < 0) landingSquashProgress.current = 0
        const t = landingSquashProgress.current // 1 at start → 0 when done
        const sy = 1 - landingSquashY * t
        const sxz = 1 + landingSquashXZ * t
        visual.current.scale.set(sxz, sy, sxz)
      } else {
        visual.current.scale.set(1, 1, 1)
      }
      // Pitch: jump (in-air) or movement lean (on ground)
      let targetPitch
      let pitchSmoothing
      if (jumpVelocity.current !== 0) {
        targetPitch = THREE.MathUtils.clamp(jumpVelocity.current * jumpPitchFactor, -jumpPitchMax, jumpPitchMax)
        pitchSmoothing = jumpPitchSmoothing
      } else {
        // Movement: lean forward when going forward, back when backing
        const md = moveDirection.current
        const v = velocity.current
        const forwardAmount = md.lengthSq() > 0.001 ? v.x * md.x + v.z * md.z : 0
        const inv = moveSpeed > 1e-6 ? 1 / moveSpeed : 0
        targetPitch = THREE.MathUtils.clamp(-movementPitchFactor * forwardAmount * inv, -movementPitchMax, movementPitchMax)
        pitchSmoothing = movementTiltSmoothing
      }
      currentPitch.current += (targetPitch - currentPitch.current) * Math.min(1, pitchSmoothing * delta)
      visual.current.rotation.x = currentPitch.current
      // Roll: lean into strafe when on ground (main = velocity-based; minigame = lane offset-based)
      let targetRoll = 0
      let rollSmoothing = movementTiltSmoothing
      if (jumpVelocity.current === 0) {
        if (sceneId === 'minigame') {
          targetRoll = minigameStrafeRollTargetRef.current
          rollSmoothing = minigameStrafeRollSmoothing
        } else {
          const md = moveDirection.current
          const v = velocity.current
          if (md.lengthSq() > 0.001 && moveSpeed > 1e-6) {
            const rightAmount = -v.x * md.z + v.z * md.x
            targetRoll = THREE.MathUtils.clamp(movementRollFactor * (rightAmount / moveSpeed), -movementRollMax, movementRollMax)
          }
        }
      }
      currentRoll.current += (targetRoll - currentRoll.current) * Math.min(1, rollSmoothing * delta)
      visual.current.rotation.z = currentRoll.current
    }

    // Get robot's world position to check if fallen (reuse vector to avoid allocations)
    const robotWorldPos = robotWorldPosRef.current
    if (groupRef.current) {
      groupRef.current.updateMatrixWorld(true)
      groupRef.current.getWorldPosition(robotWorldPos)
    } else {
      robotWorldPos.set(currentPos.x, currentPos.y, currentPos.z)
    }

    // Freeze when fallen: main uses -0.1; minigame uses lower threshold. In minigame, grace period after spawn so we don't trigger before ground raycast finds the floor.
    const fallThreshold = sceneId === 'minigame' ? minigameFallYThreshold : -0.1
    const pastMinigameFallGrace = sceneId !== 'minigame' || state.clock.elapsedTime >= minigameFallGraceUntilRef.current
    const returningToMain =
      sceneId === 'main' &&
      lastEnteredMainAt.current > 0 &&
      (Date.now() - lastEnteredMainAt.current) < 1500
    const waitingForMainGround = sceneId === 'main' && !hasGroundBoundsRef.current
    const isFrozenByFall =
      !waitingForMainGround &&
      !returningToMain &&
      robotWorldPos.y < fallThreshold &&
      !isRespawning.current &&
      pastMinigameFallGrace
    const isFrozenByMinigameMenu = sceneId === 'minigame' && minigameShowFallMenu
    const isInputPaused = gameplayPaused
    const isFrozen = isFrozenByFall || isFrozenByMinigameMenu
    globalIsFrozen = isFrozen // Update global state for camera controller
    
    // Detect fall transition (when robot becomes frozen for the first time)
    if (isFrozen && !wasFrozen.current) {
      // Robot just fell - start timer for auto-respawn
      fallStartTime.current = state.clock.elapsedTime
    }
    
    // Auto-respawn after delay if frozen — or trigger scene transition (e.g. to minigame) if handler provided
    if (isFrozen && !isRespawning.current && fallStartTime.current > 0) {
      const timeSinceFall = state.clock.elapsedTime - fallStartTime.current
      if (timeSinceFall >= respawnDelay) {
        if (onFallThrough) {
          // Grace period after "Back to main": main scene may not have ground ready yet, don't re-enter minigame
          const graceMs = 1500
          if (sceneId === 'main' && lastEnteredMainAt.current > 0 && (Date.now() - lastEnteredMainAt.current) < graceMs) {
            fallStartTime.current = -1
            return
          }
          onFallThrough()
          fallStartTime.current = -1 // Prevent calling again next frame
          return
        }
        // In minigame: don't auto-respawn; fall menu (Restart / Back to main) handles it
        if (sceneId === 'minigame') {
          fallStartTime.current = -1 // Prevent re-running this block every frame
          return
        }
        // Respawn in place (main scene only)
        // Reset rotation immediately before respawn animation starts (face 180 degrees)
        rotation.current = Math.PI
        targetRotation.current = Math.PI
        if (groupRef.current) {
          groupRef.current.rotation.y = Math.PI
        }
        
        // Start respawn
        isRespawning.current = true
        respawnProgress.current = 0
        
        // Reset position to origin smoothly
        if (groupRef.current) {
          groupRef.current.position.set(0, 0, 0)
        }
        if (bodyRef.current && bodyRef.current.setTranslation) {
          bodyRef.current.setTranslation({ x: 0, y: 0, z: 0 }, true)
        }
        
        // Reset velocity
        velocity.current.set(0, 0, 0)
        moveDirection.current.set(0, 0, 0)
        
        // Reset frozen state
        wasFrozen.current = false
        fallStartTime.current = 0
        targetGroundY.current = 0
        jumpVelocity.current = 0
        fallingThroughTrapRef.current = false
        currentPitch.current = 0
        currentRoll.current = 0
        landingSquashProgress.current = 0
        landingEaseProgress.current = 0
      }
    }
    
    // Reset fall timer when no longer frozen
    if (!isFrozen && wasFrozen.current) {
      fallStartTime.current = 0
    }
    
    wasFrozen.current = isFrozen

    // Don't process movement during respawn animation
    if (isRespawning.current) {
      return
    }

    // Keep raycast cache fresh without doing a full traverse every frame.
    if (raycaster && threeScene) {
      if (sceneId === 'minigame') {
        minigameCacheRebuildFramesRef.current += 1
        if (minigameFallGraceUntilRef.current === 0) {
          minigameFallGraceUntilRef.current = state.clock.elapsedTime + 1.2
        }
      } else {
        minigameCacheRebuildFramesRef.current = 0
        minigameFallGraceUntilRef.current = 0
        mainCacheRebuildFramesRef.current += 1
      }
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
      const doorOpen = getDoorOpen()
      const cacheTooOld = (now - lastCacheBuildAtRef.current) > 750
      const doorChanged = prevDoorOpenRef.current !== doorOpen
      const sceneChanged = prevSceneIdForCacheRef.current !== sceneId
      const empty = raycastMeshesRef.current.length === 0
      const minigameNeedsRebuild = sceneId === 'minigame' && minigameCacheRebuildFramesRef.current <= 30
      const mainNeedsRebuild = sceneId === 'main' && mainCacheRebuildFramesRef.current <= 30
      const invalidateRequested = getAndClearGroundCacheInvalidate()
      if (empty || cacheTooOld || doorChanged || sceneChanged || minigameNeedsRebuild || mainNeedsRebuild || invalidateRequested) {
        rebuildRaycastCache()
      }
    }
    const objectsToCheck = raycastMeshesRef.current
    const groundBounds = groundBoundsRef.current
    const hasGroundBounds = hasGroundBoundsRef.current

    // Calculate target movement direction from input (only if not frozen)
    const targetDirection = targetDirectionRef.current
    targetDirection.set(0, 0, 0)
    let rotationInput = 0 // Rotation input from A/D keys (main scene only)
    moveAmountRef.current.copy(velocity.current).multiplyScalar(delta)
    const moveAmount = moveAmountRef.current

    if (!isFrozen && !isInputPaused) {
      if (sceneId === 'minigame') {
        // Rebuild collision list periodically so clones (new blocks) are included
        minigameCollisionRebuildTickRef.current += 1
        if (minigameCollisionRebuildTickRef.current >= 90) {
          minigameCollisionRebuildTickRef.current = 0
          minigameCollisionMeshesRef.current = []
        }
        if (minigameCollisionMeshesRef.current.length === 0 && threeScene) {
          threeScene.updateMatrixWorld(true)
          const list = []
          threeScene.traverse((child) => {
            if (child.isMesh && child.name && child.name.toLowerCase().includes('collision')) list.push(child)
          })
          minigameCollisionMeshesRef.current = list
        }

        const prevX = currentPos.x
        const leftKey = keys.a || keys['arrowleft']
        const rightKey = keys.d || keys['arrowright']
        if (leftKey && !prevMinigameLeftKey.current) {
          minigameLaneIndex.current = Math.max(0, minigameLaneIndex.current - 1)
          prevMinigameLeftKey.current = true
          minigameStrafeDirectionRef.current = -1
          minigameStrafeTriggerRef.current += 1
          play(SOUND_IDS.STRAFE)
        } else if (!leftKey) prevMinigameLeftKey.current = false
        if (rightKey && !prevMinigameRightKey.current) {
          minigameLaneIndex.current = Math.min(2, minigameLaneIndex.current + 1)
          prevMinigameRightKey.current = true
          minigameStrafeDirectionRef.current = 1
          minigameStrafeTriggerRef.current += 1
          play(SOUND_IDS.STRAFE)
        } else if (!rightKey) prevMinigameRightKey.current = false

        const [sx, , sz] = minigameSpawnPosition
        const LANE_WIDTH = 0.7
        const laneStrafeSpeed = 5
        const targetLaneX = sx + (minigameLaneIndex.current - 1) * LANE_WIDTH
        currentPos.x += (targetLaneX - currentPos.x) * Math.min(1, laneStrafeSpeed * delta)
        currentPos.z = sz

        // Prevent driving over obstacles: if new position overlaps a "collision" mesh (geometry), revert X
        const collisionMeshes = minigameCollisionMeshesRef.current
        if (collisionMeshes.length > 0) {
          groupRef.current.updateMatrixWorld(true)
          groupRef.current.getWorldPosition(robotWorldPosRef.current)
          minigameRobotBoxRef.current.setFromCenterAndSize(robotWorldPosRef.current, minigameRobotSizeRef.current)
          let overlaps = false
          for (let i = 0; i < collisionMeshes.length; i++) {
            const mesh = collisionMeshes[i]
            if (!mesh.geometry || !mesh.parent) continue // skip disposed or removed meshes
            if (boxOverlapsMeshGeometry(minigameRobotBoxRef.current, mesh, minigameMeshBoxRef.current)) {
              overlaps = true
              break
            }
          }
          if (overlaps) currentPos.x = prevX
        }

        // Strafe roll: lean toward target lane (positive = lean right when moving right)
        const laneOffset = targetLaneX - currentPos.x
        minigameStrafeActiveRef.current = Math.abs(laneOffset) > MINIGAME_STRAFE_ACTIVE_EPSILON
        minigameStrafeRollTargetRef.current = THREE.MathUtils.clamp(
          laneOffset * minigameStrafeRollFactor,
          -minigameStrafeRollMax,
          minigameStrafeRollMax
        )

        if ((keys[' '] || keys['space'] || keys['arrowup'] || keys.w) && jumpVelocity.current === 0 && hadGroundLastFrame.current && Math.abs(currentPos.y - targetGroundY.current) < 0.25) {
          jumpVelocity.current = initialJumpSpeedMinigame
          minigameJumpSpriteTriggerRef.current += 1
          play(SOUND_IDS.JUMP)
        }
        velocity.current.set(0, 0, 0)
        moveDirection.current.set(0, 0, 0)
      } else {
        minigameStrafeRollTargetRef.current = 0
        // Main scene: car-like controls (W/S forward/back, A/D rotate in place)
        // W/Arrow Up = reverse (opposite direction robot is facing)
        // S/Arrow Down = forward (in direction robot is facing)
        // A/Arrow Left = rotate left (counter-clockwise) - NO movement
        // D/Arrow Right = rotate right (clockwise) - NO movement

        const forwardInput = (keys.w || keys['arrowup']) ? 1 : 0
        const backwardInput = (keys.s || keys['arrowdown']) ? 1 : 0
        const moveInput = backwardInput - forwardInput // 1 = forward, -1 = backward, 0 = none

        if (keys.a || keys['arrowleft']) rotationInput = 1 // Rotate right (clockwise)
        if (keys.d || keys['arrowright']) rotationInput = -1 // Rotate left (counter-clockwise)

        forwardDirRef.current.set(0, 0, -1).applyAxisAngle(_upAxis, rotation.current)
        const forwardDir = forwardDirRef.current

        if (moveInput !== 0) {
          targetDirection.copy(forwardDir).multiplyScalar(moveInput)
        }

        targetVelocityRef.current.copy(targetDirection).multiplyScalar(moveSpeed)
        const targetVelocity = targetVelocityRef.current
        const currentSpeed = velocity.current.length()
        const targetSpeed = targetDirection.length() > 0 ? moveSpeed : 0

        if (targetSpeed > 0) {
          velocityDiffRef.current.copy(targetVelocity).sub(velocity.current)
          const velocityDiff = velocityDiffRef.current
          const accelAmount = Math.min(acceleration * delta, velocityDiff.length())
          if (velocityDiff.length() > 0.01) {
            velocity.current.add(velocityDiff.normalize().multiplyScalar(accelAmount))
          } else {
            velocity.current.copy(targetVelocity)
          }
          moveDirection.current.copy(targetDirection)
        } else {
          if (currentSpeed > 0.01) {
            const decelAmount = Math.min(deceleration * delta, currentSpeed)
            velocity.current.normalize().multiplyScalar(currentSpeed - decelAmount)
          } else {
            velocity.current.set(0, 0, 0)
          }
          if (moveDirection.current.length() < 0.1) {
            moveDirection.current.set(0, 0, 0)
          }
        }

        moveAmount.copy(velocity.current).multiplyScalar(delta)

        if ((keys[' '] || keys['space']) && jumpVelocity.current === 0 && hadGroundLastFrame.current && Math.abs(currentPos.y - targetGroundY.current) < 0.25) {
          jumpVelocity.current = initialJumpSpeed
          play(SOUND_IDS.JUMP)
        }

        // Wall collision (main scene only)
        if (raycaster && objectsToCheck.length > 0) {
          rayOriginRef.current.set(robotWorldPos.x, robotWorldPos.y + wallRayHeight, robotWorldPos.z)
          const rayOrigin = rayOriginRef.current
          if (Math.abs(moveAmount.x) > 1e-6) {
            const dirX = moveAmount.x > 0 ? 1 : -1
            rayDirRef.current.set(dirX, 0, 0)
            raycaster.set(rayOrigin, rayDirRef.current)
            const hitsX = raycaster.intersectObjects(objectsToCheck, false)
            const maxDistX = Math.abs(moveAmount.x) + characterRadius
            if (hitsX.length > 0 && hitsX[0].distance < maxDistX) {
              moveAmount.x = 0
              velocity.current.x = 0
            }
          }
          if (Math.abs(moveAmount.z) > 1e-6) {
            const dirZ = moveAmount.z > 0 ? 1 : -1
            rayDirRef.current.set(0, 0, dirZ)
            raycaster.set(rayOrigin, rayDirRef.current)
            const hitsZ = raycaster.intersectObjects(objectsToCheck, false)
            const maxDistZ = Math.abs(moveAmount.z) + characterRadius
            if (hitsZ.length > 0 && hitsZ[0].distance < maxDistZ) {
              moveAmount.z = 0
              velocity.current.z = 0
            }
          }
        }

        currentPos.x += moveAmount.x
        currentPos.z += moveAmount.z
      }
    } else {
      // Frozen - stop all movement and velocity
      velocity.current.set(0, 0, 0)
      moveDirection.current.set(0, 0, 0)
      if (sceneId === 'minigame') minigameStrafeRollTargetRef.current = 0
      minigameStrafeActiveRef.current = false
    }

    // Calculate target rotation (A/D keys rotate, or maintain current rotation)
    if (!isFrozen && !isInputPaused && !isRespawning.current) {
      if (rotationInput !== 0) {
        // A/D keys: rotate in place
        const rotationAmount = rotationInput * rotationSpeed * delta
        targetRotation.current = rotation.current + rotationAmount
        rotation.current = targetRotation.current
      } else {
        // No rotation input: maintain current rotation
        targetRotation.current = rotation.current
      }
    }

    // Current world Y for smoothing (stays as currentPos.y if we skip ground block)
    let currentWorldY = currentPos.y
    let hasValidGround = false
    let groundHitY = null

    // Ground detection using Three.js raycasting
    // Use WORLD position after movement so we sample the ramp at our actual XZ (world space)
    if (raycaster && threeScene) {
      groupRef.current.updateMatrixWorld(true)
      groupRef.current.getWorldPosition(groundRayOriginRef.current)
      const groundRayOrigin = groundRayOriginRef.current
      currentWorldY = groundRayOrigin.y

      // Cast ray straight down from above our current world position
      groundRayStartRef.current.set(groundRayOrigin.x, groundRayOrigin.y + 10, groundRayOrigin.z)
      raycaster.set(groundRayStartRef.current, groundRayDirRef.current)

      const intersects = raycaster.intersectObjects(objectsToCheck, false)
      
      const isOverGround = hasGroundBounds && 
        groundRayOrigin.x >= groundBounds.min.x && 
        groundRayOrigin.x <= groundBounds.max.x &&
        groundRayOrigin.z >= groundBounds.min.z && 
        groundRayOrigin.z <= groundBounds.max.z

      const doorOpenNow = getDoorOpen()
      const trap = trapDoorBoundsRef.current
      const overTrapXZ = sceneId === 'main' && doorOpenNow && hasTrapDoorBoundsRef.current && (
        groundRayOrigin.x >= (trap.min.x - TRAP_DOOR_MARGIN) &&
        groundRayOrigin.x <= (trap.max.x + TRAP_DOOR_MARGIN) &&
        groundRayOrigin.z >= (trap.min.z - TRAP_DOOR_MARGIN) &&
        groundRayOrigin.z <= (trap.max.z + TRAP_DOOR_MARGIN)
      )
      if (overTrapXZ) {
        fallingThroughTrapRef.current = true
      }
      if (sceneId !== 'main' || !doorOpenNow) {
        fallingThroughTrapRef.current = false
      }
      const isOverTrapDoor = fallingThroughTrapRef.current

      const validIntersects = isOverTrapDoor ? [] : intersects.filter(intersect => {
        const hitY = intersect.point.y
        if (hitY >= groundRayOrigin.y + 2) return false
        if (!isOverGround) return false
        return true
      })
      
      if (validIntersects.length > 0 && !isFrozen) {
        const hitPoint = validIntersects[0].point
        targetGroundY.current = hitPoint.y + characterHeight
        hasValidGround = true
        groundHitY = hitPoint.y
      } else if (
        sceneId === 'main' &&
        (!hasGroundBounds || (lastEnteredMainAt.current > 0 && Date.now() - lastEnteredMainAt.current < 1500))
      ) {
        // Collisions remount after minigame; hold height until the floor is raycastable.
        targetGroundY.current = currentPos.y
      } else {
        targetGroundY.current = currentPos.y + gravity * delta
      }
      hadGroundLastFrame.current = validIntersects.length > 0 && !isFrozen
      // Driving onto the hole must commit to a fall; otherwise the next rim hit snaps you back up.
      if (isOverTrapDoor && jumpVelocity.current === 0 && !isFrozen) {
        jumpVelocity.current = Math.min(-0.2, gravity * 0.08)
      }
    }

    // Height: jump (in-air) or ground smoothing or frozen fall
    if (jumpVelocity.current !== 0) {
      currentPos.y += jumpVelocity.current * delta
      jumpVelocity.current += gravity * delta
      // Land when falling and hit ground: ease Y to ground over a short window to reduce camera jerk
      if (hasValidGround && jumpVelocity.current < 0 && currentPos.y <= groundHitY + 0.1) {
        currentPos.y = Math.max(currentPos.y, groundHitY - 0.1) // Don't sink far into terrain
        jumpVelocity.current = 0
        fallingThroughTrapRef.current = false
        if (sceneId !== 'minigame') landingSquashProgress.current = 1 // Trigger squash-on-land (minigame: no scale)
        landingEaseTargetY.current = groundHitY + characterHeight
        landingEaseProgress.current = landingEaseDuration
      }
    } else if (landingEaseProgress.current > 0) {
      // Ease Y toward ground over a few frames (smoother than instant snap for the camera)
      const target = landingEaseTargetY.current
      currentPos.y += (target - currentPos.y) * (1 - Math.exp(-delta / landingEaseTimeConstant))
      landingEaseProgress.current -= delta
      if (landingEaseProgress.current <= 0) landingEaseProgress.current = 0
    } else if (!isFrozen) {
      const groundDiff = targetGroundY.current - currentWorldY
      const smoothingAmount = Math.min(groundSmoothing * delta, Math.abs(groundDiff))
      currentPos.y += Math.sign(groundDiff) * smoothingAmount
    } else {
      // When frozen: if it's because minigame fall/obstacle menu is open, hold position; else apply gravity (fall)
      if (isFrozenByMinigameMenu) {
        // Hold Y so robot doesn't fall while popup is visible
      } else {
        const graceMs = 1500
        const inGracePeriod = sceneId === 'main' && lastEnteredMainAt.current > 0 && (Date.now() - lastEnteredMainAt.current) < graceMs
        if (!inGracePeriod) {
          currentPos.y += gravity * delta
        }
      }
    }

    // Apply rotation to group (keep rotation at 0 during respawn)
    if (isRespawning.current) {
      groupRef.current.rotation.y = 0
    } else {
      groupRef.current.rotation.y = rotation.current
    }
    
    // Sync RigidBody position with group position
    if (bodyRef.current.setTranslation) {
      bodyRef.current.setTranslation(
        {
          x: currentPos.x,
          y: currentPos.y,
          z: currentPos.z,
        },
        true
      )
    }
    
    // Ensure visual (Robot) is offset downward for better visual positioning
    if (visual.current) {
      visual.current.position.set(0, visualOffsetY, 0)
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPositionBased"
      colliders={false}
      position={[0, 0, 0]}
      lockRotations={true}
    >
      <group ref={groupRef}>
        <group ref={visual}>
          <Robot position={[0, 0, 0]} sceneId={sceneId} crashTrigger={minigameCrashTrigger} minigameRestartCounter={minigameRestartCounter} />
          {sceneId === 'minigame' && MINIGAME_STRAFE_SPRITE_ENABLED && (
            <MinigameStrafeSprite
              activeRef={minigameStrafeActiveRef}
              triggerRef={minigameStrafeTriggerRef}
              directionRef={minigameStrafeDirectionRef}
            />
          )}
          {sceneId === 'minigame' && MINIGAME_CRASH_SPRITE_ENABLED && (
            <MinigameCrashSprite
              activeRef={minigameCrashSpriteActiveRef}
              triggerRef={minigameCrashSpriteTriggerRef}
            />
          )}
          {sceneId === 'minigame' && MINIGAME_JUMP_SPRITE_ENABLED && (
            <MinigameJumpSprite
              activeRef={minigameJumpSpriteActiveRef}
              triggerRef={minigameJumpSpriteTriggerRef}
            />
          )}
        </group>
      </group>
    </RigidBody>
  )
}
