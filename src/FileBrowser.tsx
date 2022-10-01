import { createSignal, createResource, For, Index, Show } from 'solid-js'
import { SignalValue } from './common'

export type FileStats = {
  name: string
  folder: boolean
  size: number
  mtime: Date
}

export default function FileBrowser(props: { selFiles?: SignalValue<FileStats[]>, readDir: (path: string) => Promise<FileStats[]>, delFile?: Function, cols: string[], selectAction?: Function }) {
  const { cols, delFile, readDir, selectAction, selFiles } = props

  // const [selFiles, setSelFiles] = createSignal<FileStats[]>([])
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
        <table class="table table-hover">
          <thead>
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
                (file, i) => <tr>
                  {
                    cols.includes('Select') ? <td>{ !file.folder && <input checked={selFiles().includes(file)} class="form-check-input" type="checkbox" onClick={() => selectFile(file)} /> }</td> : null
                  }
                  <td onClick={() => {
                    if (file.folder) {
                      setCurDir(`${curDir()}${curDir() === '/' ? '' : '/'}${file.name}`)
                      selFiles.value = []
                    } else {
                      if (cols.includes('Select')) {
                        selectFile(file)
                      }
                      if (selectAction) {
                        selectAction(curDir(), file.name)
                      }
                    }
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
      </Show>
    </>
  )
}