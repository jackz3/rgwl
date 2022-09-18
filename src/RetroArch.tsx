import { createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import { loadGame, initRetroFs } from './fs';
import { loadScript } from './launcher';
import { SelectedGame } from './common';
import raimg from './images/canvas.png'

let logTxt = ''
function log(text: string) {
  logTxt = `${logTxt}${text}\n`
  document.getElementById('logger').innerText = logTxt
}
export function initModule () {
  window.Module = {
    noInitialRun: true,
    // arguments: ["-v", "--menu"],
    arguments: ["/home/web_user/retroarch/userdata/content/downloads/"],
    preRun: [],
    postRun: [],
    onRuntimeInitialized: function() {
    }, 
    print: function(text)
    {
      // log(text)
      console.log(text);
    },
    printErr: function(text)
    {
      // log(text)
      console.log(text);
    },
    canvas: document.getElementById('canvas'),
    totalDependencies: 0,
    monitorRunDependencies: function(left)
    {
      this.totalDependencies = Math.max(this.totalDependencies, left);
    }
  }
}

const RetroArch: Component<{ selGame: SelectedGame }> = (props) => {

  createEffect(() => {
    const { platform, core, game } = props.selGame
    if (platform && core && game) {
      console.log(platform, core, game)
      initModule()
      run(platform, core, game)
    }
  })

  function run (platfom: string, core: string, game: string) {
    window.Module.arguments = [`/home/web_user/retroarch/userdata/content/downloads/${game}`],
    window.Module.onRuntimeInitialized = () => {
      log('runtime inited')
      console.log('runtime inited')
      loadGame(platfom, game, (memFs) => {
        log('game fs ok')
        initRetroFs(memFs, () => {
          log('retro fs ok')
          window.Module['callMain'](window.Module['arguments']);
          window.Module['resumeMainLoop']()
          document.getElementById('canvas').focus()
          window.Module.requestFullscreen(false)
        })
      })
    }
    loadScript(`cores/${core}_libretro.js`, () => {
      console.log('core loaded')
    })
  }

  return (
    <div>
      <canvas class="webplayer" id="canvas" tabindex="1" onContextMenu={ e => e.preventDefault() }></canvas>
        {/* <img class="webplayer-preview img-fluid" src={raimg} width="960" height="720px" alt="RetroArch Logo" /> */}
    </div>
  )
};

export default RetroArch
