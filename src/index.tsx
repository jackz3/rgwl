/* @refresh reload */
import 'bootstrap/scss/bootstrap.scss';

import { render } from 'solid-js/web';
import { initFs } from './fs'

/**
 * This file was taken from the cheatsheet example of bootstrap.
 * You will most likely remove it if using this template.
 */
// import './cheatsheet.scss';

import App from './App';

initFs().then(() => {
  render(() => <App />, document.getElementById('root') as HTMLElement);
}).catch(err => {
  render(() => <div>{err}</div>, document.getElementById('root') as HTMLElement);
})
