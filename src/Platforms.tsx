import { createEffect, createSignal, For, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { SelectedGame, Platforms, cursorIncrease, cursorDecrease } from './common';
import type { SetStoreFunction } from 'solid-js/store';
import { gpEventType, setActiveZone, gamepadMode, activeZone } from './gamepad';

const zone = 'PlatformList'
const PlatformList: Component<{ selGame: SelectedGame, setSelGame: SetStoreFunction<SelectedGame> }> = (props) => {
  const { setSelGame } = props
  const [platforms] = createSignal(Platforms)
  const [cursor, setCursor] = createSignal(0)

  function gpListener(evt: CustomEvent<gpEventType>) {
    const { pressed } = evt.detail
    if (activeZone() === zone) {
      if (pressed.includes('UP') || pressed.includes('AX1UP')) { //up
        cursorDecrease(cursor, setCursor)
      } else if (pressed.includes('DW') || pressed.includes('AX1DW')) {
        cursorIncrease(cursor, setCursor, Platforms.length)
      } else if (pressed.includes('RT') || pressed.includes('A') || pressed.includes('AX1RT')) {
        setActiveZone('GameList')
      }
    }
  }
  createEffect(() => {
    const c = cursor()
    const p = Platforms[c]
    setSelGame({ platform: p.name, core: p.cores[0], game: '' })
  })

  onMount(() => {
    document.addEventListener('gpEvent', gpListener)
  })

  return (
    <ul class="list-group list-group-flush">
      <For each={platforms()}>{
        (p, i) => <li onClick={() => setSelGame({ platform: p.name, core: p.cores[0], game: '' })} class="list-group-item border-4" classList={{ 'border-start': gamepadMode() && i() === cursor(), 'border-success': gamepadMode() && activeZone() === zone && i() === cursor() }}>
          <div class="d-flex w-100 justify-content-between pointer">
            <h5 class="mb-1" classList={{ 'text-primary': props.selGame.platform === p.name }}>{p.name}</h5>
            {/* <small>{p.cores.join(' ')}</small> */}
          </div>
          <small class="text-secondary">cores: {p.cores.join(' ')}</small>
        </li>
      }
      </For>
    </ul>
  )
}

export default PlatformList
