class CameraProcessor {
    constructor(cameraMode, container, estimatePoseFn, snapCameraImageFn) {
		this.snapCameraImage = snapCameraImageFn
		this.estimatePose = estimatePoseFn
		this.cameraMode = cameraMode || 'video'
		this.elements = jor(container, el => [
			el('video').refer('video').attr('autoplay', 'true'),
			el('img').refer('image'),
			el('canvas').refer('canvas')
		], {container})
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
			this.elements.image.src = await this.snapCameraImage()
		}
		return await Promise.race([loaded, timedOut]) != Error
	}

	async getBodyPartsFromImage() {
		const poses = await this.estimatePose(this.elements.image)
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
})
