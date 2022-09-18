import { BaseFile, File } from 'browserfs/dist/node/core/file';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { BaseFileSystem, BFSCallback, BFSOneArgCallback, FileSystem } from 'browserfs/dist/node/core/file_system';
import Stats, { FileType } from 'browserfs/dist/node/core/node_fs_stats';
import { getList, getItem } from './msgraph'
import {arrayBuffer2Buffer, emptyBuffer } from 'browserfs/dist/node/core/util';
import PreloadFile from 'browserfs/dist/node/generic/preload_file';
import { Buffer } from 'buffer'

window.Buffer = Buffer

export interface OneDriveFSOptions {
  rootPath: string;
}

interface OneDriveStat {
  size: number;
  lastModifiedDateTime: string;
  downloadUrl?: string;
  isFile: boolean;
  name: string;
}
export class OneDriveFile extends PreloadFile<OneDriveFS> implements File {

  public close(cb: BFSOneArgCallback): void {
    cb()
  }

}

export default class OneDriveFS extends BaseFileSystem  implements FileSystem {
  public static readonly Name = "OneDrive";
  public static Create(opts: OneDriveFSOptions, cb: BFSCallback<OneDriveFS>): void {
    cb(null, new OneDriveFS(opts.rootPath))
  }

  _cache: {[path: string]: OneDriveStat} = {}
  _fileCache: {[path: string]: any} = {}
  constructor(private rootPath: string) {
    super();
  }

  public getName(): string {
    return OneDriveFS.Name;
  }

  public isReadOnly(): boolean {
    return false;
  }

  public supportsSymlinks(): boolean {
    return false;
  }

  public supportsProps(): boolean {
    return false;
  }

  public supportsSynch(): boolean {
    return false;
  }

  private _addToCache (path: string, f: any) {
    const { size, lastModifiedDateTime, '@microsoft.graph.downloadUrl': downloadUrl, name, folder } = f
    const stat: OneDriveStat = { isFile: !folder, size, lastModifiedDateTime, downloadUrl, name }
    this._cache[`${path === '/' ? '' : path}/${name === 'root' ? '' : name}`] = stat
    return stat
  }

  private getAbsPath(p: string) {
    return `${this.rootPath}${p}`
  }

  public readdir(p: string, cb: BFSCallback<string[]>): void {
    getList(this.getAbsPath(p)).then(res => {
      const dirs = []
      res.children.forEach(f => {
        this._addToCache(p, f)
        if (!f.specialFolder) {
          dirs.push(f.name)
        }
      })
      cb(null, dirs)
    }).catch(err => {
      cb(err)
    })  
  }
  
  private async _stat(path: string) {
    const stat = this._cache[path]
    if (stat) {
      return stat
    }
    return getItem(this.getAbsPath(path)).then(fileResp => {
      const stat =  this._addToCache(path, fileResp)
      fileResp.children.forEach(f => {
        this._addToCache(path, f)
      })
      return stat
    })
  }

  public stat(path: string, isLstat: boolean, cb: BFSCallback<Stats>): void {
    this._stat(path).then(res => {
      const stats = new Stats(this._statType(res), res.size);
      return cb(null, stats);
    }).catch(err => cb(err))
  }

  private _statType(stat: any): FileType {
    return stat.isFile ? FileType.FILE : FileType.DIRECTORY;
  }

  private _makeFile(path: string, flag: FileFlag, stat: OneDriveStat, buffer: Buffer): OneDriveFile {
    const type = this._statType(stat);
    const stats = new Stats(type, stat.size);
    return new OneDriveFile(this, path, flag, stats, buffer);
  }

  public open(path: string, flags: FileFlag, mode: number, cb: BFSCallback<File>): void {
    this._stat(path).then(stat => {
      if (stat.isFile) {
        const url = stat['downloadUrl']
        console.log('down url; ', url)
        fetch(url).then(res => {
          return res.arrayBuffer() })
          .then(content => {
            let buffer: Buffer
            if (content === null) {
              buffer = emptyBuffer()
            } else {
              buffer = Buffer.from(content)// arrayBuffer2Buffer(content)
            }
            const file = this._makeFile(path, flags, stat, buffer);
            return cb(null, file);
          }).catch(err => { 
            cb(err) })
      } else {
        const file = this._makeFile(path, flags, stat, emptyBuffer());
        return cb(null, file)
      }
    })
  }
}