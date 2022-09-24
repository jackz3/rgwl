import { onCleanup, onMount, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { Modal } from 'solid-bootstrap'
import { selectFiles, ensureDir, saveGameFile } from './fs';
import { reqToken, getList } from './msgraph';
import { SelectedGame, createSignalValue } from './common';
import FileBrowser from './FileBrowser';

export const UploadFileButton: Component<{selGame: SelectedGame, refetch: Function, class?: string}> = (props) => {
  return <>
      <input id="uploadfile" type="file" class="d-none" onChange={(evt) => selectFiles(props.selGame.platform, evt, props.refetch)} multiple />
      <button type="button" class={"btn btn-outline-secondary " + props.class ?? ''} onClick={() => document.getElementById('uploadfile').click() }>Upload</button>
  </>
}

const Uploader: Component<{ selGame: SelectedGame, refetch: Function, showOneDrive: () => void }> = (props) => {
  return (
    <div class="d-flex flex-column justify-content-center align-items-center h-100">
      <UploadFileButton selGame={props.selGame} refetch={props.refetch} class="btn-lg w-25 mb-5" />
      <button type="button" class="btn btn-outline-primary btn-lg w-25" onClick={props.showOneDrive}>OneDrive</button>
    </div>
  )
}
export default Uploader

async function readDir(path: string): Promise<any[]> {
  return reqToken().then(() => getList(path === '' ? '/' : path).then(res => {
    return res.children
  }))
}

export function OneDriveUploader(props: { show: boolean, onHide: () => void, platform: string, refetch: Function })  {
  const cols = ['Select', 'File Name', 'Size']
  const [uploading, setUploading] = createSignal(false)
  onMount(() => {
  })

  onCleanup(() => {
  })

  const selFiles = createSignalValue([])
  return (
      <Modal show={props.show} onHide={props.onHide} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>Upload from OneDrive</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FileBrowser {...{readDir, cols, selFiles }} />
        </Modal.Body>
        <Modal.Footer>
          <button class="btn btn-secondary" onClick={() => props.onHide()}>Close</button>
          <button type="button" class="btn btn-primary" disabled={uploading()} onClick={ async () => {
            setUploading(true)
            const dir = `/${props.platform}`
            await ensureDir(dir)
            for(let i = 0; i < selFiles.value.length; i++) {
              // const file = allFiles[ids[i]]
              const file = selFiles.value[i]
              const url = file['@microsoft.graph.downloadUrl']
              const name = file.name
              console.log('down url; ', url)
              const data = await fetch(url)
                .then(res => res.arrayBuffer())
              await saveGameFile(`${dir}/${name}`,data)
            }
            props.refetch()
            props.onHide()
            setUploading(false)
          }
          }>{
            uploading() ? <><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Uploading...</> : 'Upload'
          }</button>
        </Modal.Footer>
      </Modal>
  )
}
