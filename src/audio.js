class AudioPlayer {
    constructor(containerElement, filePathTemplate) {
        this.containerElement = containerElement
        this.filePathTemplate = filePathTemplate
        this.elements = {}
        this.chimes = []
    }

    buildChime(soundId) {
        this.buildElement(soundId)
        this.chimes.push(soundId)
    }

    buildElement(soundId) {
        const sourceEl = document.createElement('source')
        sourceEl.setAttribute('src', this.#getFilePath(soundId))
        sourceEl.setAttribute('type', 'audio/mpeg')

        const audioEl = document.createElement('audio')
        audioEl.id = soundId + '-audio'
        audioEl.setAttribute('preload', '')
        audioEl.appendChild(sourceEl)

        this.containerElement.append(audioEl)
        this.elements[soundId] = audioEl
    }

    async play(soundId) {
        const elements = [...this.chimes, soundId].map(s => this.elements[s])
        for (const e of elements) {
            const played = new Promise(resolve => {
                const onEnded = (_) => {
                    e.removeEventListener('ended', onEnded)
                    resolve()
                }
                e.addEventListener('ended', onEnded)
            })
            e.play()
            await played
        }
    }

    #getFilePath(soundId) {
        return eval("\`" + this.filePathTemplate + "\`")
    }
}