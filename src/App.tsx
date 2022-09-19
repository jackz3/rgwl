import { onCleanup, onMount, createSignal, Suspense, Show, For } from 'solid-js';
import { createStore } from "solid-js/store";
import type { Component } from 'solid-js';
import * as bootstrap from 'bootstrap';
import GameList from './GameList'
import PlatformList from './Platforms';
import SettingsModal from './SettingsModal'
import { SelectedGame, Platforms, showToast, toastTxt, setShowToast } from './common';
import logoImg from './images/retroarch-96x96.png'
import { gpEventType, setActiveZone, startpolling } from './gamepad'
import { Modal, Toast } from 'solid-bootstrap';


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
      <header classList={{ 'd-none': gameRunning() }}>
        <nav class="navbar navbar-expand-lg bg-light">
          <div class="container-fluid">
            <img src={logoImg} alt="Logo" width="30" height="24" class="d-inline-block align-text-top" />
            <a class="navbar-brand" href="#">Retro Game Web Launcher</a>
            <div class="collapse navbar-collapse justify-content-end pe-3">
              <a class="btn btn-light" target="_blank" href="https://github.com/jackz3/rgwlauncher" role="button">Github</a>
              <button type="button" onClick={() => setShowHelp(true)} class="btn btn-link">Help</button>
              <button id="settings" class="btn btn-outline-success ms-3" type="submit" onClick={() => {
                setShowSettings(true)
                setActiveZone('ModalSettings')
              }}>Settings</button>
            </div>
          </div>
        </nav>
      </header>
      <div class="container-fluid py-3 px-4" classList={{ 'd-none': gameRunning() }}>
        <div class="row">
          <div class="position-relative col-5">
            <PlatformList selGame={selGame} setSelGame={setSelGame} />
          </div>
          <div class="position-relative col-7 border-start">
            <GameList selGame={selGame} selectGame={selectGame} prepareGameRunning={prepareGameRunning} />
          </div>
        </div>
        {/* <RetroArch selGame={selGame} /> */}
      </div>
      <Show when={showSettings()} >
        <SettingsModal show={showSettings()} setShowSettings={setShowSettings} />
      </Show>
      <Toast onClose={() => setShowToast(false)} bg='light' class="w-50"
        show={showToast()}
        delay={2000}
        autohide
      >
        <Toast.Body>
          {toastTxt()}
        </Toast.Body>
      </Toast>
      <Modal show={showHelp()} onHide={() => setShowHelp(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Help</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Gamepad shortcuts when playing</h5>
          <dl class="row">
            <For each={ShortCuts}>
              {(s, i) => <><dt class="col-sm-3">{s[0]}</dt><dd class="col-sm-9">{s[1]}</dd></>}
            </For>
          </dl>
        </Modal.Body>
      </Modal>
      <iframe classList={{ 'd-none': !gameRunning() }} style={{ position: 'fixed', top: 0, width: '100%', height: '100vh' }} src="./launcher.html"></iframe>
    </>
  );
}

export default App;
