/**
 * Classe que implementa um processador de áudio para reprodução de áudio PCM.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/
 */
class AudioPlaybackWorklet extends AudioWorkletProcessor {
    constructor() {
        super()
        this.port.onmessage = this.handleMessage.bind(this)
        this.buffer = []
        this.isPlaying = false
    }

    handleMessage(event) {
        if (event.data === null) {
            this.buffer = []
            this.isPlaying = false
            return
        }
        this.buffer.push(...event.data)
        this.isPlaying = true
    }

    process(inputs, outputs) {
        const output = outputs[0]
        const channel = output[0]

        if (this.buffer.length > channel.length) {
            const toProcess = this.buffer.slice(0, channel.length)
            this.buffer = this.buffer.slice(channel.length)
            channel.set(toProcess.map(v => v / 32768))
        } else {
            channel.set(this.buffer.map(v => v / 32768))
            this.buffer = []
        }

        this.isPlaying = this.buffer.length > 0

        return true
    }

    isPlayingSound() {
        return this.isPlaying
    }
}

registerProcessor('audio-playback-worklet', AudioPlaybackWorklet)
