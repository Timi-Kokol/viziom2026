'use client'

import styled from 'styled-components'
import { bpd } from '@tackl'

export const Wrapper = styled.div`
  font-family: var(--ibm-plex-sans), Arial, sans-serif;
  position: fixed;
  bottom: 60px;
  left: 60px;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    '. up .'
    'left . right'
    '. down .';
  gap: 0;
  width: 96px;
  height: 96px;
  pointer-events: auto;
  /* Breakpoint m (700px): larger pad */
  ${bpd.m`
    bottom: 30px;
    left: 30px;
    right:30px;
    width:auto;
    display:flex;
  `}
`

export const ArrowButtonStyled = styled.button.attrs({ type: 'button' })`
  grid-area: ${(p) => p.$gridArea};
  width: 100%;
  height: 100%;
  min-width: 32px;
  min-height: 32px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$isActive ? '#fff' : 'transparent')};
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  border: 1px solid #fff;
  transform: rotate(45deg) ${(p) => (p.$isActive ? 'scale(1.3)' : 'scale(1)')};;
  opacity: ${(p) => (p.$isActive ? '1' : '0.4')};
  transition: background 0.1s ease, transform 0.1s ease;
  ${bpd.m`
    width: 70px;
    height: 70px;
    border-width: 3px;
    margin-right:28px;
    transform: rotate(45deg) scale(1);
  `}
  /* Hide down arrow at bpd.m (max-width 700px) */
  ${(p) => p.$isDown && bpd.m`display: none;`}
  &:first-child {
    order:3;
    margin-left:auto;
    margin-right:0;
  }
  &:focus {
    outline: none;
  }
  svg {
    transform: rotate(-45deg);
    width: 13px;
    ${bpd.m`
      width:40px;
    `}
  }
  svg path {
    fill: ${(p) => (p.$isActive ? '#DD0009' : 'rgba(255, 255, 255, 0.95)')};
  }
  /* Minigame only, mobile: e.g. different size/position */
  ${(p) => p.$isMinigame && bpd.m`
    margin:0;
    &:first-child {
      order:2;
      margin-inline:auto;
      transform: rotate(45deg) scale(1) translate(4px, -4px);
    }
    &:nth-child(2) {
      order:1;
    }
    &:nth-child(3) {
      order:3;
    }
  `}
`

export const ArrowIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: rotate(${(p) => p.$rotation}deg);
`

export const ArrowIconSvg = styled.svg`
  display: block;
  margin: auto;
`


export const NavigationLabel = styled.span`
  font-family: var(--kode-mono), ui-monospace, monospace;
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  left:calc(100% + 20px);
  width:100px;
  text-transform:uppercase;
  font-size:12px;
  font-weight:700;
  opacity:0.4;
  ${bpd.m`
    display:none;
  `}
  /* Minigame only, mobile */
  ${(p) => p.$isMinigame && bpd.m`
    /* Add minigame-only mobile label styles here */
  `}
`