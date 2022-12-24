import { createSignal, createResource, For, Show, onMount, onCleanup } from 'solid-js'
import { createScrollbar, cursorDecrease, cursorIncrease, SignalValue } from './common'
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
  const updateScrollbar = createScrollbar(cursor, files)

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
      updateScrollbar(fbRef)
    }
    if (pressed.includes('DW') || pressed.includes('AX1DW')) {
      cursorIncrease(cursor, setCursor, files().length)
      updateScrollbar(fbRef)
    }
    if (pressed.includes('A')) {
      clickItem(files()[cursor()])
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
      <div class="text-sm breadcrumbs">
        <ul >
          <li class="">PATH:</li>
          <For each={dirs()}>
            {
              (dir, i) => {
                const name = dir === '' ? 'root' : dir
                return <li class={"breadcrumb-item"} classList={{ 'active': i() === dirs().length - 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 mr-2 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  {i() === dirs().length - 1 ? name : <a class="link-primary" onClick={() => {
                    const path = dirs().slice(0, i() + 1).join('/')
                    setCurDir(path ? path : '/')
                  }}>{name}</a>}
                </li>
              }
            }
          </For>
        </ul>
      </div>
      <Show when={!files.loading} fallback={
        <progress class="progress w-56"></progress>
      }>
        <div ref={fbRef} class="overflow-y-auto max-h-[95%]">
          <table class="table w-[80%]">
            <thead class="sticky top-0 bg-white">
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
                  (file, i) => <tr class="hover" classList={{ 'bg-gray-100': gamepadMode() && i() === cursor(), 'bg-gray-200': gamepadMode() && i() === cursor() }}>
                    {
                      cols.includes('Select') ? <td>{!file.folder && <input checked={selFiles().includes(file)} class="check" type="checkbox" onClick={() => selectFile(file)} />}</td> : null
                    }
                    <td onClick={() => {
                      clickItem(file)
                    }}>{
                        file.folder ? <i class="bi bi-folder mr-1" /> : null
                      }
                      {file.name}
                    </td>
                    <td>{file.folder ? '' : file.size}</td>
                    {
                      cols.includes('') ? <td>
                        <Show when={!file.folder} fallback={null}>
                          <button class="btn btn-sm btn-outline btn-secondary" onClick={() => { delLocalFile(`/${curDir()}/${file.name}`) }}><i class="bi bi-x-lg" /></button>
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
