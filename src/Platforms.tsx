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
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <For each={platforms()}>{
        (p, i) => <li onClick={() => setSelGame({ platform: p.name, core: p.cores[0], game: '' })} class="pb-2 sm:pb-3 hover:bg-gray-200" classList={{ 'bg-gray-100': gamepadMode() && i() === cursor(), 'bg-gray-200': gamepadMode() && activeZone() === zone && i() === cursor() }}>
          <div class="flex items-center space-x-4 cursor-pointer">
            <div class="flex-1">
            <p class="h-10 flex flex-col justify-center font-semibold text-gray-900 truncate dark:text-white" classList={{ 'text-primary-focus': props.selGame.platform === p.name }}>
              {p.name}
            </p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">
              cores: {p.cores.join(' ')}
            </p>
         </div>
         <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
         </div>
          </div>
        </li>
      }
      </For>
    </ul>
  )
}

export default PlatformList
