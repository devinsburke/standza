class CameraProcessor {
    constructor(cameraMode, elementContainer, picamera, tensorflow) {
		this.picamera = picamera
		this.tensorflow = tensorflow
		this.cameraMode = cameraMode ?? 'video'
		this.elements = {
			container: elementContainer,
			image: elementContainer.getElementsByTagName('img')[0],
			video: elementContainer.getElementsByTagName('video')[0],
			canvas: elementContainer.getElementsByTagName('canvas')[0]
		}
	}

	async setupCamera() {
		if (this.cameraMode == 'video') {
			try {
				const loaded = new Promise(r => this.elements.video.onloadeddata = r)
				this.elements.video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true })
				await loaded
				this.elements.canvas.width = this.elements.video.videoWidth
				this.elements.canvas.height = this.elements.video.videoHeight
			} catch {
				this.cameraMode = 'img'
			}
		}
	}

	async reloadImageFromCamera(timeout = 5000) {
		const loaded = new Promise(r => this.elements.image.onload = r)
		const timedOut = new Promise(r => setTimeout(() => r(Error), timeout))
		if (this.cameraMode == 'video') {
			const context = this.elements.canvas.getContext('2d')
			await context.drawImage(this.elements.video, 0, 0, this.elements.canvas.width, this.elements.canvas.height)
			this.elements.image.src = this.elements.canvas.toDataURL()
		} else if (this.cameraMode == 'img') {
			this.elements.image.src = await window.picamera.snapDataUrl()
		}
		return await Promise.race([loaded, timedOut]) != Error
	}

	async getBodyPartsFromImage() {
		const poses = await this.tensorflow.estimatePose(this.elements.image)
		return poses.keypoints.filter(p => p.score > 0.5).map(p => p.part)
	}

	async getCurrentPersonState() {
		if (!await this.reloadImageFromCamera())
			return PersonState.Absent
		const parts = await this.getBodyPartsFromImage()
		if (parts.includes('leftHip') || parts.includes('rightHip'))
			return PersonState.Standing
		if (parts.length > 1)
			return PersonState.Sitting
		return PersonState.Absent
    }
}

const PersonState = Object.freeze({
	Absent: 'Absent',
	Sitting: 'Sitting',
	Standing: 'Standing'
});
