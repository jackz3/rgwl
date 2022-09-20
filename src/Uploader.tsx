import { onCleanup, onMount, createSignal, createResource, Index, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { Modal } from 'solid-bootstrap'
import { selectFiles, ensureDir, saveGameFile } from './fs';
import { reqToken, getList } from './msgraph';
import { SelectedGame } from './common';

export const UploadFileButton: Component<{selGame: SelectedGame, refetch: Function, class?: string}> = (props) => {
  return <>
      <input id="uploadfile" type="file" class="d-none" onChange={(evt) => selectFiles(props.selGame.platform, evt, props.refetch)} multiple />
      <button type="button" class={"btn btn-outline-secondary " + props.class ?? ''} onClick={() => document.getElementById('uploadfile').click() }>Upload</button>
  </>
}

const Uploader: Component<{ selGame: SelectedGame, refetch: Function, showOneDrive: () => void }> = (props) => {
  return (
    <div class="d-flex flex-column justify-content-center align-items-center h-100">
      {navigator.userAgent}
      <UploadFileButton selGame={props.selGame} refetch={props.refetch} class="btn-lg w-25 mb-5" />
      <button type="button" class="btn btn-outline-primary btn-lg w-25" onClick={props.showOneDrive}>OneDrive</button>
    </div>
  )
}
export default Uploader

async function readDir(path: string): Promise<any[]> {
  console.log('read', path)
  return reqToken().then(() => getList(path === '' ? '/' : path).then(res => {
    return res.children
  }))
}

export function OneDriveUploader(props: { show: boolean, onHide: () => void, platform: string, refetch: Function })  {
  const [curDir, setCurDir] = createSignal('')
  const [uploading, setUploading] = createSignal(false)
  const [selFiles, setSelFiles] = createSignal<number[]>([])
  let [files] = createResource(() => props.show ? curDir() : false, readDir)
  onMount(() => {
  })

  onCleanup(() => {
  })

  const paths = () => curDir().split('/')
  return (
      <Modal show={props.show} onHide={props.onHide} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>Upload from OneDrive</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb">
                {
                  paths().map((path, i, pas) => {
                    const name = path === '' ? 'Root' : path
                    return <li class={"breadcrumb-item" + (i === (pas.length - 1) ? ' active' : '')}>
                      {i === pas.length - 1 ? name : <a class="link-primary" onClick={() => setCurDir(pas.slice(0, i + 1).join('/'))}>{name}</a>}
                    </li>
                  })
                }
              </ol>
            </nav>
            <Show when={!files.loading} fallback={
              <div class="d-flex justify-content-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            }>
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Select</th>
                    <th scope="col">File Name</th>
                  </tr>
                </thead>
                <tbody>
                  <Index each={files()}>
                  {
                    (file, i) => <tr>
                      <td>
                        {
                          !file().folder && <input checked={selFiles().includes(i)} class="form-check-input" type="checkbox" id="checkboxNoLabel" onClick={() => selectFile(i)} />
                        }
                      </td>
                      <td onClick={() => {
                        if (file().folder) {
                          setCurDir(`${curDir()}/${file().name}`)
                          setSelFiles([])
                        } else {
                          selectFile(i)
                        }
                      }}>{file().folder ? '[Folder]' : '[File]'}{file().name}</td>
                    </tr>
                  }
                  </Index>
                </tbody>
              </table>
            </Show>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button class="btn btn-secondary" onClick={() => props.onHide()}>Close</button>
          <button type="button" class="btn btn-primary" disabled={uploading()} onClick={ async () => {
            setUploading(true)
            const dir = `/${props.platform}`
            await ensureDir(dir)
            const ids = selFiles()
            const allFiles = files()
            for(let i = 0; i < ids.length; i++) {
              const file = allFiles[ids[i]]
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

  function selectFile(i: number) {
    const sFiles = selFiles();
    const idx = sFiles.indexOf(i);
    if (idx >= 0) {
      sFiles.splice(idx, 1);
    } else {
      sFiles.push(i);
    }
    setSelFiles([...sFiles]);
  }
}
