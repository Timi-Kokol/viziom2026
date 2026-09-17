'use client'

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

// Hide collision meshes visually only (opacity 0). Do NOT set mesh.visible = false,
// or RobotController will skip them in its traverse (it only adds child.visible meshes to the raycast list).
function hideCollisionMeshesVisually(scene) {
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((mat) => {
        if (mat) {
          mat.transparent = true
          mat.opacity = 0
          mat.depthWrite = false
        }
      })
    }
  })
}

export default function Collisions({ position = [0, 0, 0], scale = [1, 1, 1] }) {
  const { scene } = useGLTF('/models/collisions.glb')
  // Clone so remounting after minigame actually puts geometry back in the graph
  // (useGLTF returns a singleton; a second <primitive> attach can no-op).
  const cloned = useMemo(() => {
    const copy = scene.clone(true)
    hideCollisionMeshesVisually(copy)
    return copy
  }, [scene])

  return (
    <RigidBody type="fixed" colliders={false} position={position} scale={scale}>
      <primitive object={cloned} castShadow={false} receiveShadow={false} />
    </RigidBody>
  )
}
