import { onCleanup, onMount, createSignal, Suspense, Show, For } from 'solid-js';
import { createStore } from "solid-js/store";
import type { Component } from 'solid-js';
import GameList from './GameList'
import PlatformList from './Platforms';
import SettingsModal from './SettingsModal'
import { SelectedGame, Platforms, showToast, toastTxt, setShowToast } from './common';
import logoImg from './images/retroarch-96x96.png'
import { gpEventType, setActiveZone, startpolling } from './gamepad'

const [gameRunning, setGameRunning] = createSignal(false)
function prepareGameRunning() {
  setGameRunning(true)
}
const [selGame, setSelGame] = createStore<SelectedGame>({ platform: Platforms[0].name, core: Platforms[0].cores[0], game: '' })
function selectGame(game: string) {
  setSelGame({ ...selGame, game })
}

window.exitGame = function () {
  setGameRunning(false)
  startpolling()
}

const App: Component = () => {
  const [showSettings, setShowSettings] = createSignal(false)
  const [showHelp, setShowHelp] = createSignal(false)

  const ShortCuts = [
    ['L2+START', 'toggle retroarch menu'],
    ['L1+START', 'toggle launcher bar'],
    ['L2+SELECT', 'toggle fullscreen'],
    ['L1+START', 'exit game'],
    ['R2+SELECT', 'save state'],
    ['R2+START', 'load state']
  ]
  function setActiveItem() {
    let hash = window.location.hash;

    if (hash === '') {
      return;
    }

    let link = document.querySelector('.bd-aside a[href="' + hash + '"]');
    let active = document.querySelector('.bd-aside .active');
    // @ts-ignore
    let parent = link.parentNode.parentNode.previousElementSibling;

    link.classList.add('active');

    if (parent.classList.contains('collapsed')) {
      parent.click();
    }

    if (!active) {
      return;
    }

    // @ts-ignore
    let expanded = active.parentNode.parentNode.previousElementSibling;

    active.classList.remove('active');

    if (expanded && parent !== expanded) {
      expanded.click();
    }
  }

  function gpListener(e: CustomEvent<gpEventType>) {
    const { pressed } = e.detail
    if (pressed.includes('SELECT')) {
      document.getElementById('settings').click()
    }
  }

  onMount(() => {
    document.addEventListener('gpEvent', gpListener)
    setActiveItem();
    window.addEventListener('hashchange', setActiveItem);
  });

  onCleanup(() => {
    window.removeEventListener('hashchange', setActiveItem);
  });

  return (
    <>
      <div class="navbar bg-base-200" classList={{ 'hidden': gameRunning() }}>
        <div class="flex-1">
          <img src={logoImg} alt="Logo" width="30" height="24" class='ml-4' />
          <a class="btn btn-ghost normal-case text-lg">Retro Game Web Launcher</a>
        </div>
        <div class="flex-none">
          <a class="btn btn-ghost btn-circle" target="_blank" href="https://github.com/jackz3/rgwl" role="button"><i class="bi-github" /></a>
          <button type="button" onClick={() => setShowHelp(true)} class="btn btn-ghost btn-circle"><i class="bi bi-exclamation-circle"></i></button>
          <button class="btn btn-outline btn-secondary mr-2" onclick={() => {
            setShowSettings(true)
            setActiveZone('ModalSettings')
          }}>Settings</button>
        </div>
      </div>
      <div class="flex flex-row py-3 px-4 flex-auto" classList={{ 'hidden': gameRunning() }}>
        <div class="flex flex-row flex-1 h-full">
          <div class="px-5 w-2/4">
            <PlatformList selGame={selGame} setSelGame={setSelGame} />
          </div>
          <div class="w-2/4 border-l-gray-200 border-l ml-4 pl-4">
            <GameList selGame={selGame} selectGame={selectGame} prepareGameRunning={prepareGameRunning} />
          </div>
        </div>
        {/* <RetroArch selGame={selGame} /> */}
      </div>
      <Show when={showSettings()} >
        <SettingsModal show={showSettings()} setShowSettings={setShowSettings} />
      </Show>
      <div class="toast toast-bottom toast-start" classList={{ hidden: !showToast()}}>
        <div class="alert alert-success">
          <div>
            <span>
              {toastTxt()}
            </span>
          </div>
        </div>
      </div>
      <input checked={showHelp()} type="checkbox" id="mymodal" class="modal-toggle" />
      <div class="modal cursor-pointer">
        <div class="modal-box relative">
          <label class="btn btn-sm btn-circle absolute right-2 top-2" onclick={() => setShowHelp(false)}>✕</label>
          <h3 class="font-bold text-lg">Help</h3>
          <h5>Gamepad shortcuts when playing</h5>
          <dl class="row">
            <For each={ShortCuts}>
              {(s, i) => <><dt class="col-sm-3">{s[0]}</dt><dd class="col-sm-9">{s[1]}</dd></>}
            </For>
          </dl>
        </div>
      </div>
      <iframe classList={{ 'hidden': !gameRunning() }} class='fixed top-0 w-full h-screen' src="./launcher.html"></iframe>
    </>
  );
}

export default App;
