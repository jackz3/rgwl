import { createSignal, Setter, For, onMount, onCleanup, createEffect, on } from 'solid-js'
import { Modal } from 'solid-bootstrap'
import { localData } from './fs'
import LocalFiles from './LocalFils'
import { backToPreZone, gpEventType } from './gamepad'
import { cursorDecrease, cursorIncrease } from './common'

function patchCfg(key: string[], val: string[]) {
  localData.localFs.readFile('/userdata/retroarch.cfg', 'utf8', (e, txt) => {
    key.forEach((k, i) => {
      const reg = new RegExp(`${k} = "(.*)"`)
      txt = txt.replace(reg, `${k} = "${val[i]}"`)
    })
    localData.localFs.writeFile('/userdata/retroarch.cfg', txt, (err) => {
      if (err) console.log(err)
    })
    if (key[0] === Patches[0].key) {
      const autoPath = '/userdata/autoconfig'
      localData.localFs.exists(autoPath, (exits) => {
        if (!exits) {
          localData.localFs.mkdir(autoPath, (err) => {
            console.log('mkdir', err)
          })
        }
      })
    }
  })
}

const Patches = [
  {
    key: 'joypad_autoconfig_dir',
    val: "~/retroarch/userdata/autoconfig",
    disp: 'set gamepad cfg saving dir (must)'
  },
  {
    key: ['input_enable_hotkey_btn', 'input_enable_hotkey_axis', 'input_menu_toggle','input_exit_emulator'],
    val: ["nul", 'nul', 'f1', "escape"],
    disp: 'restore to default hotkeys'
  },
]

const Tabs = [
  {
    disp: 'Patch Cfg',
    key: 'patch'
  },
  {
    disp: 'Local Files',
    key: 'localFiles'
  },
  {
    disp: 'Reset',
    key: 'reset'
  }
]

const zone = 'ModalSettings'
export default function SettingsModal(props: { show: boolean, setShowSettings: Setter<boolean> }) {
  const [activeTab, setActiveTab] = createSignal('patch')
  const [sel, setSel] = createSignal<number[]>([])
  const [tabIdx, setTabIdx] = createSignal(0)

  const closeModal = () => {
    props.setShowSettings(false)
    backToPreZone()
  }

  createEffect(on(tabIdx, (i) => {
    setActiveTab(Tabs[i].key)
  }))

  const btnActions = {
    'B': {
      label: 'close',
      action: closeModal
    }
  }
  function gpListener(e: CustomEvent<gpEventType>) {
    const { pressed, activeZone } = e.detail
    // if (activeZone === zone) {
    //   if(pressed.includes(12) || pressed.includes(51)) { //up
    //   } else if (pressed.includes(13) || pressed.includes(61)) {
    //   } else if (pressed.includes(0)) {
    //   } else if (pressed.includes(50) || pressed.includes(1)) {
    //   }
    // }
    if (pressed.includes('LB')) {
      cursorDecrease(tabIdx, setTabIdx)
    }
    if (pressed.includes('RB')) {
      cursorIncrease(tabIdx, setTabIdx, Tabs.length)
    }
    if (pressed.includes('B')) {
      closeModal()
    }
  }

  onMount(() => {
    console.log('settings mount')
    document.addEventListener('modalGpEvent', gpListener)
  })
  onCleanup(() => {
    console.log('settings clean')
    document.removeEventListener('modalGpEvent', gpListener)
  })
  
  const selectPatch = (i: number) => {
    const selPatches = sel()
    const idx = selPatches.indexOf(i)
    if (idx >= 0) {
      selPatches.splice(idx, 1)
    } else {
      selPatches.push(i)
    }
    setSel([...selPatches])
  }
  const patch = () => {
    sel().forEach(i => {
      const {key, val} = Patches[i]
      if (Array.isArray(key) && Array.isArray(val)) {
        patchCfg(key, val)
      }
      if (!Array.isArray(key) && !Array.isArray(val)) {
        patchCfg([key], [val])
      }
    })
    console.log('patch ok')
    closeModal()
    // props.setShowSettings(false)
  }

  return (
    <Modal show={props.show} onHide={() => closeModal()} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul class="nav nav-tabs" onClick={(e) => setActiveTab((e.target as HTMLElement).dataset['tab'])}>
          <For each={Tabs}>
          {
            (tab, i) => <li class="nav-item">
            <a class="nav-link" classList={{ active: activeTab() === tab.key }} aria-current="page" data-tab={tab.key}>{tab.disp}</a>
            </li> 
          }
          </For>
        </ul>
        <div classList={{ 'd-none': activeTab() !== 'patch' }}>
          <For each={Patches}>
            {
              (p, i) => <div class="form-check m-3">
                <input onClick={() => selectPatch(i())} checked={sel().includes(i())} class="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                <label class="form-check-label" for="flexCheckDefault">
                  {p.disp}
                </label>
              </div>
            }
          </For>
          <button class="btn btn-outline-success m-3" type="submit" onClick={patch}>Patch</button>
        </div>
        <LocalFiles show={activeTab() === 'localFiles'} />
      </Modal.Body>
    </Modal>
  )
}
