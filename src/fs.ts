import { FileSystem, initialize, EmscriptenFS, BFSRequire } from 'browserfs'
import IndexedDBFileSystem from 'browserfs/dist/node/backend/IndexedDB'
import InMemoryFileSystem from 'browserfs/dist/node/backend/InMemory'
import { FileFlag } from 'browserfs/dist/node/core/file_flag'
import { FSModule } from 'browserfs/dist/node/core/FS'
import {arrayBuffer2Buffer } from 'browserfs/dist/node/core/util';
import { SelectedGame } from './common'

export function loadGame(platform: string, game: string, cb: (memFs: InMemoryFileSystem) => void) {
  FileSystem.InMemory.Create({}, function(e, memFs) {
    FileSystem.IndexedDB.Create({ storeName: 'RetroGames'}, (err, gamesFs) => {
      if (err) console.log(err)
      initialize(memFs);
      const fs = BFSRequire('fs')
      gamesFs.readFile(`/${platform}/${game}`, null, FileFlag.getFileFlag('r'), (err, buf) => {
        fs.writeFileSync(`/${game}`, buf)
        cb(memFs)
      })
    })
  })
}

export function initRetroFs (gamesFs, cb = null) {
  FileSystem.IndexedDB.Create({ storeName: 'RetroArch'}, (e, idbfs) => {
    FileSystem.InMemory.Create({}, function(e, inMemory) {
      FileSystem.AsyncMirror.Create({
         sync: inMemory, async: idbfs
      }, function(e, amfs) {
        console.log('err', e)
        initialize(amfs)
        console.log('amfs ok')

        FileSystem.XmlHttpRequest.Create({ index: "assets/frontend/bundle/.index-xhr" }, (e, xfs1) => {
            FileSystem.MountableFileSystem.Create({
                '/home/web_user/retroarch/userdata': amfs,
                '/home/web_user/retroarch/bundle': xfs1,
                '/home/web_user/retroarch/userdata/content/downloads': gamesFs
            }, (e, mfs) => {
                initialize(mfs)
                const BFS = new EmscriptenFS();
                window.FS.mount(BFS, {root: '/home'}, '/home');
                console.log("WEBPLAYER: filesystem initialization successful");
                cb && cb()
            })
          })
      })
    })
  })
}

export const localData: {
  save?: {
    selectedGame: SelectedGame
  },
  localFs?: FSModule,
} = {}

export function initFs (): Promise<IndexedDBFileSystem> {
  return new Promise((resolve, reject) => {
    FileSystem.IndexedDB.Create({ storeName: 'RetroGames'}, (err, idbfs) => {
      initialize(idbfs)
      FileSystem.IndexedDB.Create({ storeName: 'RetroArch'}, (e, userIdbfs) => {
        initialize(userIdbfs)
        FileSystem.MountableFileSystem.Create({
          '/': idbfs,
          '/userdata': userIdbfs
        }, (err, mfs) => {
          if (err) reject(err)
          initialize(mfs)
          window.Buffer = BFSRequire('buffer').Buffer
          localData.localFs = BFSRequire('fs')
          resolve(null)
        })
      })
    })
  })
}

function saveFiles(target: HTMLInputElement, dir: string, cb: Function) {
  const files = target.files;
  let total = files.length
  for (let i = 0; i < files.length; i++) {
    const filereader = new FileReader();
    filereader.readAsArrayBuffer(files[i]);
    filereader.onload = () => {
      const fileName = files[i].name;
      saveGameFile(`${dir}/${fileName}`, filereader.result as ArrayBuffer).then(() => {
        if (cb && --total === 0) {
          cb()
        }
      })
    };
    // filereader.onloadend = function (evt) {
    //   if (evt.target.readyState == FileReader.DONE) {
    //     console.log('upload end');
    //   }
    // };
  }
}

export function selectFiles (platform: string, evt: Event, cb?: Function) {
  const target = evt.target as HTMLInputElement
  const dir = `/${platform}`
  ensureDir(dir).then(() => saveFiles(target, dir, cb))
}

export function ensureDir(dir: string) {
  return new Promise((resolve, reject) => {
    localData.localFs.exists(dir, exists => {
      if (exists) {
        resolve(true)
      } else {
        localData.localFs.mkdir(dir, (err) => {
          if (err)  reject(err)
          resolve(true)
        })
      }
    })
  })
}

export function saveGameFile (fileName: string, data: ArrayBuffer) {
  return new Promise((resolve, reject) => {
    localData.localFs.writeFile(fileName, arrayBuffer2Buffer(data), (err) => {
      if (err) reject(err)
      resolve(null)
    })
  })
}

export function loadStroe() {
  const saveData = localStorage.getItem('rawebapp')
  if (saveData) {
    localData.save = JSON.parse(saveData)
  }
}
export function saveStore(info) {
  localStorage.setItem('rawebapp', JSON.stringify({...localData.save, ...info}))
}

export function downloadFile(path: string, fileName: string) {
  localData.localFs.readFile(`${path}/${fileName}`, 'utf8', (e, txt) => {
    const a = document.createElement("a")
    a.href = window.URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = fileName;
    a.click();
  })
}

export function delFile(fileName: string, cb: Function) {
  localData.localFs.unlink(fileName, (err) => {
    if (err) throw err
    cb()
  })
}