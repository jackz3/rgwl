import { createSignal } from "solid-js"
import { showInfo } from "./common"

export type gpEventType = { pressed: string[] }

const ButtonMappings = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'SELECT',
  9: 'START',
  10: 'L3',
  11: 'R3',
  12: 'UP',
  13: 'DW',
  14: 'LT',
  15: 'RT',
  16: 'LOGO',
  50: 'AX1LT',
  60: 'AX1RT',
  51: 'AX1UP',
  61: 'AX1DW'
}

type Zone = 'PlatformList' | 'GameList' | 'ModalSettings'
let preActiveZone: Zone = 'PlatformList'
export const [activeZone, setActiveZn] = createSignal<Zone>('PlatformList')
export function setActiveZone(name: Zone) {
  setTimeout(() => {
    preActiveZone = activeZone()
    setActiveZn(name)
  }, 0)
}
export function backToPreZone() {
  setActiveZn(preActiveZone)
}

let gpInterval
const gpPressedStates: boolean[][] = []
const gpAxeStates: number[][] = []
const threhold = 0.9

export function startpolling () {
  gpInterval = setInterval(pollGamepads, 100)
}

export function stopPolling () {
  clearInterval(gpInterval)
}

function pollGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (gp) {
      const pressed: number[] = []
      for (let j = 0; j < gp.buttons.length; j++) {
        if (gp.buttons[j].pressed && gp.buttons[j].pressed !== gpPressedStates[i][j]) {
          pressed.push(j)
        }
        gpPressedStates[i][j] = gp.buttons[j].pressed
      }
      for (let j = 0; j < gp.axes.length; j++) {
        if (gp.axes[j] > threhold && gpAxeStates[i][j] < threhold) {
          pressed.push(60 + j)
        }
        if (gp.axes[j] < -threhold && gpAxeStates[i][j] > -threhold) {
          pressed.push(50 + j)
        }
        gpAxeStates[i][j] = gp.axes[j]
      }
      if (pressed.length) {
        console.log(pressed)
        let evtType = 'gpEvent'
        if (activeZone().indexOf('Modal') === 0) {
          evtType = 'modalGpEvent'
        }
        const event = new CustomEvent<gpEventType>(evtType, { detail: { pressed: pressed.map(x => ButtonMappings[x]) } });
        document.dispatchEvent(event)
      }
    }
  }
}

export const [gamepadMode, setGamepadMode ] = createSignal(false)
window.addEventListener("gamepadconnected", function(e) {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
  for (var i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i]
    if (gp) {
      setGamepadMode(true)
      showInfo(`gamepad ${gp.id} connected`)
      gpPressedStates.push([...gamepads[i].buttons.map(x => x.pressed)])
      gpAxeStates.push([...gamepads[i].axes])
    }
  }
})
window.addEventListener("gamepaddisconnected", (e) => {
  console.log("Gamepad disconnected from index %d: %s",e.gamepad.index, e.gamepad.id);
  setGamepadMode(false)
})
if (!gpInterval) {
  startpolling()
}
