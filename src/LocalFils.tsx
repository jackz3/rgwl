import { localData, downloadFile, delFile } from './fs';
import FileBrowser, { FileStats } from './FileBrowser'

async function readDir(path: string): Promise<FileStats[]> {
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
      ).then((files: FileStats[]) => {
        resolve(files)
      })
    })
  })
}

export default function LocalFiles(props: { show: boolean }) {
  const cols = ['File Name', 'Size', '']
  return <div classList={{ 'hidden': !props.show }} class='h-[85%]'>
    <FileBrowser {...{readDir, delFile, cols }} selectAction={(path: string, fileName: string) => downloadFile(path, fileName)} />
  </div>
}
