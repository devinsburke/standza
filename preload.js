// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const PiCamera = require('pi-camera')
const fs = require('fs').promises
const { contextBridge, ipcRenderer } = require('electron')

const webgl = require('@tensorflow/tfjs-backend-webgl')
const tf = require('@tensorflow/tfjs-core')
const posenet = require('@tensorflow-models/posenet')

let picam
let net

contextBridge.exposeInMainWorld('tensorflow', {
  estimatePose: async(img) => {
    const input = tf.browser.fromPixels(img)
		const poses = (await net).estimateSinglePose(input)
    input.dispose()
    return await poses
  }
})

window.addEventListener('DOMContentLoaded', async () => {
  net = posenet.load()
  
  picam = new PiCamera({ 
    mode: 'photo',
    width: 640, 
    height: 480, 
    nopreview: true,
    timeout: 1
  });
  
  contextBridge.exposeInMainWorld('picamera', {
    snapDataUrl: () => picam.snapDataUrl()
  });
  
  for (const t of ['chrome', 'node', 'electron']) {
    const element = document.getElementById(`${t}-version`)
    if (element) element.innerText = process.versions[t]
  }
})

document.addEventListener('PutFile', (evt) => {
  fs.writeFile(evt.detail.path, evt.detail.content);
});
