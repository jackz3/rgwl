import { createSignal, createResource, For, Show, createEffect, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { delFile, localData, saveStore } from './fs';
import { SelectedGame, cursorIncrease, cursorDecrease } from './common'
import Uploader, { OneDriveUploader, UploadFileButton } from './Uploader'
import { gpEventType, activeZone, setActiveZone, stopPolling, gamepadMode, backToPreZone } from './gamepad';

async function readDir(platform: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (platform === '') {
      resolve([])
      return
    }
    localData.localFs.readdir(`/${platform}`, (err: any, fs) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve([])
        } else {
          reject(err)
        }
      }
      console.log('files', fs)
      resolve(fs)
    })
  })
}

const zone = 'GameList'
const GameList: Component<{ selGame: SelectedGame, selectGame: Function, prepareGameRunning: Function }> = (props) => {
  const [dir, setDir] = createSignal('')
  const [show, setShow] = createSignal(false);
  const handleClose = () => setShow(false);
  const [cursor, setCursor] = createSignal(0)
  const [files, { mutate, refetch }] = createResource(dir, readDir)
  createEffect(() => {
    setDir(props.selGame.platform)
    setCursor(0)
    if (show()) {
      setActiveZone('ModalOneDrive')
    } else {
      backToPreZone()
    }
  })
  function gpListener(e: CustomEvent<gpEventType>) {
    const { pressed } = e.detail
    if (activeZone() === zone) {
      if(pressed.includes('UP') || pressed.includes('AX1UP')) {
        cursorDecrease(cursor, setCursor)
      } else if (pressed.includes('DW') || pressed.includes('AX1DW')) {
        cursorIncrease(cursor, setCursor, files().length)
      } else if (pressed.includes('A')) {
        selectGame(files()[cursor()])
      } else if (pressed.includes('AX1LT') || pressed.includes('LT') || pressed.includes('B')) {
        setActiveZone('PlatformList')
      }

    }
    if (pressed.includes('X')) {
      setShow(true)
    }
  }
  onMount(() => {
    document.addEventListener('gpEvent', gpListener)
  })

  const selectGame = (file: string) => {
    const selectedGame: SelectedGame = { ...props.selGame, game: file }
    saveStore({ selectedGame })
    document.querySelector("iframe").src = `launcher.html?${Date.now()}`
    // document.querySelector("iframe").contentDocument.location.reload()
    props.prepareGameRunning()
    stopPolling()
  }
  return (
    <><Show when={!files.loading && files().length} fallback={<Uploader selGame={props.selGame} refetch={refetch} showOneDrive={() => setShow(true)} />}>
      <div class="ps-3">
        <div class="d-flex justify-content-end">
          <UploadFileButton selGame={props.selGame} refetch={refetch} />
          <button type="button" class="btn btn-outline-primary ms-4" onClick={() => setShow(true)}>OneDrive</button>
        </div>
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">File Name</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <For each={files()}>{
              (file, i) => <tr class="border-4" classList={{ 'border-start' : gamepadMode() && i() === cursor(), 'border-success': gamepadMode() && activeZone() === zone && i() === cursor() }}>
                <td onClick={() => selectGame(file)}>{file}</td>
                <td><button type="button" onClick={(e) => { delFile(`/${props.selGame.platform}/${file}`, () => refetch()) }} class="btn btn-outline-primary btn-sm">del</button></td></tr>
            }
            </For>
          </tbody>
        </table>
      </div>
    </Show>
      <OneDriveUploader show={show()} onHide={handleClose} platform={props.selGame.platform} refetch={refetch} />
    </>
  )
};

export default GameList
