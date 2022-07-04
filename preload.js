const PiCamera = require('pi-camera')
const fs = require('fs').promises
const contextBridge = require('electron').contextBridge
const webgl = require('@tensorflow/tfjs-backend-webgl')
const tf = require('@tensorflow/tfjs-core')
const posenet = require('@tensorflow-models/posenet')

contextBridge.exposeInMainWorld('standzaAPI', {
    estimatePose: async(img) => {
        this.posenet ??= await posenet.load()
        const input = tf.browser.fromPixels(img)
        const poses = this.posenet.estimateSinglePose(input)
        input.dispose()
        return await poses
    },
    snapCameraImage: async() => {
        this.picam ??= new PiCamera({ mode: 'photo', width: 640, height: 480, nopreview: true, timeout: 1 })
        await this.picam.snapDataUrl()
    },
    writeFile: async(path, data) => await fs.writeFile(path, data)
})
