import { Accessor, batch, createSignal, Setter } from "solid-js"

export type Platform = {
  name: string
  cores: string[]
}

export type SelectedGame = {
  platform: string
  core: string
  game: string
}

export const Platforms: Platform[] = [
  {
    name: 'cps1',
    cores: ['fbalpha2012_cps1', 'fbalpha2012']
  },
  {
    name: 'cps2',
    cores: ['fbalpha2012_cps2', 'fbalpha2012']
  },
  {
    name: 'neogeo',
    cores: ['fbalpha2012_neogeo', 'fbalpha2012']
  },
  {
    name: 'fbalpha2012',
    cores: ['fbalpha2012']
  },
  {
    name: 'mame',
    cores: ['mame2003_plus']
  },
  {
    name: 'nes',
    cores: ['fceumm']
  },
  {
    name: 'snes',
    cores: ['snes9x']
  },
  {
    name: 'gba',
    cores: ['mgba']
  },
  {
    name: 'genesis',
    cores: ['genesis_plus_gx']
  },
  // {
  //   name: '32X',
  //   cores: ['picodrive']
  // },
  // {
  //   name: 'pce',
  //   cores: ['mednafen_pce_fast']
  // },
  // {
  //   name: 'ngp',
  //   cores: ['mednafen_ngp']
  // },
  // {
  //   name: 'wswan',
  //   cores: ['mednafen_wswan']
  // }
]

export function cursorDecrease(cursor: Accessor<number>, setCursor: Setter<number>) {
  let c = cursor()
  if (c > 0) {
    setCursor(c - 1)
  }
}

export function cursorIncrease(cursor: Accessor<number>, setCursor: Setter<number>, len: number) {
  let c = cursor()
  if (c < len - 1) {
    setCursor(c + 1)
  }
}

export const [showToast, setShowToast] = createSignal(false)
export const [toastTxt, setToastTxt] = createSignal('')
export function showInfo(txt: string) {
  batch(() => {
    setShowToast(true)
    setToastTxt(txt)
  })
}