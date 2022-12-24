/* @refresh reload */
import './index.css'

import { render } from 'solid-js/web';
import { initFs } from './fs'

import App from './App';

initFs().then(() => {
  render(() => <App />, document.getElementById('root') as HTMLElement);
}).catch(err => {
  render(() => <div>{err}</div>, document.getElementById('root') as HTMLElement);
})
