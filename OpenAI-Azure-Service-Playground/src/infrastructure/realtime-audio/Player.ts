const SILENCE_DURATION = 1400
const SILENCE_THRESHOLD = 1

/**
 * Classe que realiza a reprodução de áudio em tempo real.
 * também faz incursões com o nó analisador de frequência
 *
 * Usa o analisador de frequência para detectar a inexistência de utilização do canal de áudio.
 * auxilia na criação de um mecanismo para coibir a retroalimentação de áudio quando o
 * usuário não está falando, e saída (speaker) alimenta a entrada (mic) por exemplo.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
 */
class Player {
    private playbackNode: AudioWorkletNode | null
    private audioContext: AudioContext | null
    private analyser: AnalyserNode | null
    private dataArray: Uint8Array | null
    private lastActiveTime: number

    constructor(
        playbackNode: AudioWorkletNode | null = null,
        audioContext: AudioContext | null = null,
        analyser: AnalyserNode | null = null,
        dataArray: Uint8Array | null = null,
        lastActiveTime: number = Date.now()
    ) {
        this.playbackNode = playbackNode
        this.audioContext = audioContext
        this.analyser = analyser
        this.dataArray = dataArray
        this.lastActiveTime = lastActiveTime
    }

    async start(sampleRate: number): Promise<void> {
        this.audioContext = new AudioContext({ sampleRate })

        await this.audioContext.audioWorklet.addModule('/worklets/audio-playback-worklet.js')

        this.analyser = this.audioContext.createAnalyser()
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

        // nó que toca o áudio liga no analisador
        this.playbackNode = new AudioWorkletNode(this.audioContext, 'audio-playback-worklet')
        this.playbackNode.connect(this.analyser)

        this.analyser.connect(this.audioContext.destination)
    }

    startMonitoring(onSilenceCallback: () => void): void {
        const checkAudio = (): void => {
            this.analyser?.getByteTimeDomainData(this.dataArray!)

            const rms = Math.sqrt(
                this.dataArray!.reduce((sum, value) => sum + (value - 128) ** 2, 0) / this.dataArray!.length
            )

            // verificar se o áudio está ativo ou em silêncio
            if (rms > SILENCE_THRESHOLD) {
                this.lastActiveTime = Date.now()
            } else if (Date.now() - this.lastActiveTime > SILENCE_DURATION) {
                onSilenceCallback()
            }

            if (this.analyser) requestAnimationFrame(checkAudio)
        }

        checkAudio()
    }

    play(buffer: ArrayBuffer): void {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(buffer)
        }
    }

    stop(): void {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(null)
        }

        if (this.analyser) {
            this.analyser.disconnect()
            this.analyser = null
        }
    }

    cancelCurrentAndClearBuffer(): void {
        if (this.playbackNode) {
            this.playbackNode.port.postMessage(null)
        }
    }
}

export default Player
