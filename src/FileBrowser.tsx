import { createSignal, createResource, For, Show, onMount, onCleanup } from 'solid-js'
import { cursorDecrease, cursorIncrease, SignalValue } from './common'
import { gamepadMode, gpEventType } from './gamepad'

export type FileStats = {
  name: string
  folder: boolean
  size: number
  mtime: Date
}

export default function FileBrowser(props: { selFiles?: SignalValue<FileStats[]>, readDir: (path: string) => Promise<FileStats[]>, delFile?: Function, cols: string[], selectAction?: Function }) {
  const { cols, delFile, readDir, selectAction, selFiles } = props
  const [cursor, setCursor] = createSignal(0)
  let fbRef: HTMLDivElement
  const [curDir, setCurDir] = createSignal('/')
  let [files, { refetch }] = createResource(() => curDir(), readDir)

  const dirs = () => {
    const ds = curDir().split('/')
    return ds[ds.length - 1] === '' ? ds.slice(0, -1) : ds
  }

  const delLocalFile = (path: string) => {
    delFile(path, refetch)
  }

  function selectFile(file: FileStats) {
    const sFiles = selFiles();
    const idx = sFiles.indexOf(file);
    if (idx >= 0) {
      sFiles.splice(idx, 1);
    } else {
      sFiles.push(file);
    }
    selFiles.value = [...sFiles]
  }

  function gpListener(e: CustomEvent<gpEventType>) {
    const { pressed } = e.detail
    if (pressed.includes('UP') || pressed.includes('AX1UP')) {
      cursorDecrease(cursor, setCursor)
      updateScrollbar()
    }
    if (pressed.includes('DW') || pressed.includes('AX1DW')) {
      cursorIncrease(cursor, setCursor, files().length)
      updateScrollbar()
    }
    if (pressed.includes('A')) {
      clickItem(files()[cursor()])
    }
  }
  function updateScrollbar() {
    const total = files().length
    const sHeight = fbRef.scrollHeight
    const cHeight = fbRef.clientHeight
    const pct = cHeight / sHeight
    const idx = cursor()
    const topPct = (idx + 1) / total - pct
    if (topPct > 0) {
      fbRef.scrollTop = topPct * sHeight
    } else {
      fbRef.scrollTop = 0
    }
  }
  onMount(() => {
    document.addEventListener('modalGpEvent', gpListener)
  })

  onCleanup(() => {
    document.removeEventListener('modalGpEvent', gpListener)
  })

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb ms-2 mt-3">
          <li class="me-2">PATH:</li>
          <For each={dirs()}>
            {
              (dir, i) => {
                const name = dir === '' ? 'root' : dir
                return <li class={"breadcrumb-item"} classList={{ 'active': i() === dirs().length - 1}}>
                 {i() === dirs().length - 1 ? name : <a class="link-primary" onClick={() => {
                  const path = dirs().slice(0, i() + 1).join('/')
                  setCurDir(path ? path : '/')
                 }}>{name}</a>}
               </li>
              }
            }
          </For>
        </ol>
      </nav>
      <Show when={!files.loading} fallback={
        <div class="d-flex justify-content-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      }>
        <div ref={fbRef} style={{ "max-height": '24rem', 'overflow-y': 'auto'}}>
        <table class="table table-hover">
          <thead style={{ 'position': 'sticky', 'top': 0, 'background-color': 'white' }}>
            <tr>
              <For each={cols}>
              {
                (cols, i) => <th scope='col'>{cols}</th>
              }
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={files()}>
              {
                (file, i) => <tr class="border-3" classList={{ 'border-start' : gamepadMode() && i() === cursor(), 'border-success': gamepadMode() && i() === cursor() }}>
                  {
                    cols.includes('Select') ? <td>{ !file.folder && <input checked={selFiles().includes(file)} class="form-check-input" type="checkbox" onClick={() => selectFile(file)} /> }</td> : null
                  }
                  <td onClick={() => {
                    clickItem(file)
                  }}>{
                      file.folder ? <i class="bi bi-folder me-2" /> : null
                    }
                    {file.name}
                  </td>
                  <td>{file.folder ? '' : file.size}</td>
                  {
                    cols.includes('') ? <td>
                      <Show when={!file.folder} fallback={null}>
                      <button class="btn btn-outline-scecondary btn-sm" onClick={() => { delLocalFile(`/${curDir()}/${file.name}`) }}>del</button>
                      </Show>
                    </td> : null
                  }
                </tr>
              }
            </For>
          </tbody>
        </table>
        </div>
      </Show>
    </>
  )

  function clickItem(file: FileStats) {
    if (file.folder) {
      setCurDir(`${curDir()}${curDir() === '/' ? '' : '/'}${file.name}`)
      if (selFiles) {
        selFiles.value = []
      }
    } else {
      if (cols.includes('Select')) {
        selectFile(file)
      }
      if (selectAction) {
        selectAction(curDir(), file.name)
      }
    }
  }
}
