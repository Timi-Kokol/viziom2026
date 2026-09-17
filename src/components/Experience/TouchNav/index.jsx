'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useHaptics } from '@/haptics'
import { Wrapper, ArrowButtonStyled, ArrowIconSvg, ArrowIconWrapper, NavigationLabel } from './styles'

// Single arrow path (points down); we rotate for up/left/right
const ARROW_PATH =
  'M5.46084 0.280273C5.95181 -0.120211 6.67603 -0.0914511 7.13369 0.366211L12.1337 5.36621C12.6219 5.85437 12.6219 6.64563 12.1337 7.13379C11.6455 7.62194 10.8543 7.62194 10.3661 7.13379L6.24991 3.01758L2.13369 7.13379C1.64554 7.62194 0.854272 7.62194 0.366117 7.13379C-0.122039 6.64563 -0.122039 5.85437 0.366117 5.36621L5.36612 0.366211L5.46084 0.280273Z'

const ROTATION_BY_DIRECTION = { up: 0, down: 180, left: -90, right: 90 }

const ARROWS = [
  { key: 'ArrowUp', label: 'Up', gridArea: 'up' },
  { key: 'ArrowDown', label: 'Down', gridArea: 'down' },
  { key: 'ArrowLeft', label: 'Left', gridArea: 'left' },
  { key: 'ArrowRight', label: 'Right', gridArea: 'right' },
]

/** In minigame: up = jump (space), down arrow hidden */
function getArrowsForScene(currentScene) {
  if (currentScene === 'minigame') {
    return ARROWS.filter((a) => a.gridArea !== 'down')
  }
  return ARROWS
}

/** Key to dispatch from touch: in minigame up = space (jump) */
function getDispatchKey(arrow, currentScene) {
  if (currentScene === 'minigame' && arrow.gridArea === 'up') return ' '
  return arrow.key
}

// Map keyboard keys to arrow keys (for visual sync: W/A/S/D and Arrow keys)
const KEY_TO_ARROW = {
  arrowup: 'ArrowUp',
  w: 'ArrowUp',
  arrowdown: 'ArrowDown',
  s: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  a: 'ArrowLeft',
  arrowright: 'ArrowRight',
  d: 'ArrowRight',
}

function dispatchKey(key, type) {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
}

function ArrowIcon({ direction }) {
  const rotation = ROTATION_BY_DIRECTION[direction] ?? 0
  return (
    <ArrowIconWrapper $rotation={rotation}>
      <ArrowIconSvg
        width="26"
        height="16"
        viewBox="0 0 13 8"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={ARROW_PATH} fill="currentColor" />
      </ArrowIconSvg>
    </ArrowIconWrapper>
  )
}

function ArrowButton({ arrow, isKeyActive, dispatchKeyForButton, currentScene }) {
  const pressedRef = useRef(false)
  const [isPressed, setIsPressed] = useState(false)
  const isActive = isPressed || isKeyActive
  const { triggerPress } = useHaptics()

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault()
      triggerPress()
      pressedRef.current = true
      setIsPressed(true)
      dispatchKey(dispatchKeyForButton, 'keydown')
    },
    [dispatchKeyForButton, triggerPress]
  )

  const handlePointerUp = useCallback(
    (e) => {
      e.preventDefault()
      if (pressedRef.current) {
        dispatchKey(dispatchKeyForButton, 'keyup')
        pressedRef.current = false
      }
      setIsPressed(false)
    },
    [dispatchKeyForButton]
  )

  const handlePointerLeave = useCallback(
    () => {
      if (pressedRef.current) {
        dispatchKey(dispatchKeyForButton, 'keyup')
        pressedRef.current = false
      }
      setIsPressed(false)
    },
    [dispatchKeyForButton]
  )

  const handlePointerEnter = useCallback(
    (e) => {
      if (e.buttons !== 0) {
        pressedRef.current = true
        setIsPressed(true)
        dispatchKey(dispatchKeyForButton, 'keydown')
      }
    },
    [dispatchKeyForButton]
  )

  const direction = arrow.key.replace('Arrow', '').toLowerCase()

  return (
    <ArrowButtonStyled
      $gridArea={arrow.gridArea}
      $isDown={arrow.gridArea === 'down'}
      $isMinigame={currentScene === 'minigame'}
      $isActive={isActive}
      aria-label={currentScene === 'minigame' && arrow.gridArea === 'up' ? 'Jump' : `Robot ${arrow.label}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ArrowIcon direction={direction} />
    </ArrowButtonStyled>
  )
}

export default function TouchNav({ currentScene = 'main' }) {
  const [keysActive, setKeysActive] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (currentScene === 'minigame' && (key === ' ' || key === 'space')) {
        setKeysActive((prev) => ({ ...prev, ArrowUp: true }))
        return
      }
      const arrowKey = KEY_TO_ARROW[key]
      if (arrowKey) {
        setKeysActive((prev) => ({ ...prev, [arrowKey]: true }))
      }
    }

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase()
      if (currentScene === 'minigame' && (key === ' ' || key === 'space')) {
        setKeysActive((prev) => ({ ...prev, ArrowUp: false }))
        return
      }
      const arrowKey = KEY_TO_ARROW[key]
      if (arrowKey) {
        setKeysActive((prev) => ({ ...prev, [arrowKey]: false }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [currentScene])

  const arrows = getArrowsForScene(currentScene)

  const isMinigame = currentScene === 'minigame'

  return (
    <Wrapper $isMinigame={isMinigame} role="group" aria-label={currentScene === 'minigame' ? 'Minigame touch controls' : 'Robot touch navigation'}>
      {arrows.map((arrow) => (
        <ArrowButton
          key={arrow.key}
          arrow={arrow}
          isKeyActive={keysActive[arrow.key]}
          dispatchKeyForButton={getDispatchKey(arrow, currentScene)}
          currentScene={currentScene}
        />
      ))}
      <NavigationLabel $isMinigame={isMinigame}>{currentScene === 'minigame' ? 'Lanes / Jump' : 'Move robot'}</NavigationLabel>
    </Wrapper>
  )
}
