// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const fs = require('fs').promises
const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  for (const t of ['chrome', 'node', 'electron']) {
    const element = document.getElementById(`${t}-version`)
    if (element) element.innerText = process.versions[t]
  }
})

document.addEventListener('PutFile', (evt) => {
  fs.writeFile(evt.detail.path, evt.detail.content);
});
