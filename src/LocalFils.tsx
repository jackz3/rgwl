import { onCleanup, onMount, createSignal, createResource, For, Index, Show } from 'solid-js';
import { localData, downloadFile, delFile } from './fs';


async function readDir(path: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    localData.localFs.readdir(path, (err, res) => {
      if (err) reject(err)
      Promise.all(
        res.map(f => new Promise((resolve, reject) => {
          const stats = localData.localFs.stat(`${path}/${f}`, (err, stats) => {
            if (err) reject(err)
            resolve({
              name: f,
              folder: stats.isDirectory(),
              size: stats.size,
              mtime: stats.mtime
            })
          })
        })
        )
      ).then(files => {
        resolve(files)
      })
    })
  })
}

export default function LocalFiles(props: { show: boolean }) {
  const [curDir, setCurDir] = createSignal('/')
  const [selFiles, setSelFiles] = createSignal<number[]>([])
  let [files, { refetch }] = createResource(() => props.show ? curDir() : false, readDir)

  const dirs = () => {
    const ds = curDir().split('/')
    return ds[ds.length - 1] === '' ? ds.slice(0, -1) : ds
  }

  const delLocalFile = (path: string) => {
    delFile(path, refetch)
  }
  return (
    <div classList={{ 'd-none': !props.show }}>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb ms-2 mt-3">
          <li class="me-2">PATH:</li>
          <For each={dirs()}>
            {
              (dir, i) => {
                const name = dir === '' ? 'root' : dir
                return <li class={"breadcrumb-item"} classList={{ 'active': i() === dirs().length - 1}}>
                 {i() === dirs().length - 1 ? name : <a onClick={() => {
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
              <th scope="col">Select</th>
              <th scope="col">File Name</th>
              <th scope='col'>Size</th>
              <th scope='col'></th>
            </tr>
          </thead>
          <tbody>
            <Index each={files()}>
              {
                (file, i) => <tr>
                  <td>
                    {
                      // !file().folder && <input checked={selFiles().includes(i)} class="form-check-input" type="checkbox" id="checkboxNoLabel" value="" />
                    }
                  </td>
                  <td onClick={() => {
                    if (file().folder) {
                      setCurDir(`${curDir()}${curDir() === '/' ? '' : '/'}${file().name}`)
                      setSelFiles([])
                    } else {
                      const sFiles = selFiles()
                      const idx = sFiles.indexOf(i)
                      if (idx >= 0) {
                        sFiles.splice(idx, 1)
                      } else {
                        sFiles.push(i)
                      }
                      setSelFiles([...sFiles])
                      downloadFile(curDir(), file().name)
                    }
                  }}>{
                      file().folder ? '[Folder]' : '[File]'
                    }
                    {file().name}
                  </td>
                  <td>{file().folder ? '' : file().size}</td>
                  <td>
                    <Show when={!file().folder} fallback={null}>
                    <button class="btn btn-outline-scecondary btn-sm" onClick={() => { delLocalFile(`/${curDir()}/${file().name}`) }}>del</button>
                    </Show>
                  </td>
                </tr>
              }
            </Index>
          </tbody>
        </table>
      </Show>
    </div>
  )
}
