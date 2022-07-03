class AudioComponent {
    #list = []
    #playing = false

    constructor(container) {
        this.elements = jor(container, el => [
            el('source').attr('type', 'audio-mpeg').refer('source').children(
                el('audio').refer('audio')
            )
        ])
    }

    async play(audioPaths) {
        this.#list.push(...audioPaths)
        if (this.#playing)
            return
        
        this.#playing = true
        let sound
        while (sound = this.#list.shift()) {
            const played = new Promise(resolve => {
                const onEnded = (_) => {
                    this.elements.audio.removeEventListener('ended', onEnded)
                    resolve()
                }
                this.elements.audio.addEventListener('ended', onEnded)
            })

            this.elements.audio.src = sound
            this.elements.audio.play()
            await played
        }
        this.#playing = false
    }
}