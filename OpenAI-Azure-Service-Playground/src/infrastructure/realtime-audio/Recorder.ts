const TARGET_SAMPLE_RATE = 24000
/**
 * Classe responsável por capturar o áudio do microfone e disponibilizar para o AudioManager.
 */
class Recorder {
    private handleAudioData: (data: any) => void
    private audioContext: AudioContext | any | null = null
    private mediaStream: MediaStream | null = null
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null
    private workletNode: AudioWorkletNode | null = null

    constructor(_handleAudioData: (data: any) => void) {
        this.handleAudioData = _handleAudioData
    }

    async start(stream: MediaStream): Promise<void> {
        console.log('starting recorder.')
        try {
            if (this.audioContext) {
                await this.audioContext.close()
            }

            this.audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)()

            await this.audioContext.audioWorklet.addModule('/worklets/resampler-processor-worklet.js')

            this.mediaStream = stream
            this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream)

            this.workletNode = new AudioWorkletNode(this.audioContext, 'resampler-processor-worklet', {
                processorOptions: {
                    inputSampleRate: this.audioContext.sampleRate,
                    targetSampleRate: TARGET_SAMPLE_RATE
                }
            })

            this.workletNode.port.onmessage = (event: MessageEvent) => {
                this.handleAudioData(event.data)
            }

            const { highPassFilter, lowPassFilter } = this.clearMicSignal()

            this.mediaStreamSource?.connect(this.workletNode)
            this.workletNode.connect(highPassFilter)
            highPassFilter.connect(lowPassFilter)
            lowPassFilter.connect(this.audioContext.destination)
        } catch (error) {
            console.error('error', error)
            this.stop()
        }
    }

    private clearMicSignal() {
        // filtro passa-baixa
        const lowPassFilter = this.audioContext.createBiquadFilter()
        lowPassFilter.type = 'lowpass'
        lowPassFilter.frequency.setValueAtTime(2500, this.audioContext.currentTime)
        lowPassFilter.Q.setValueAtTime(1.5, this.audioContext.currentTime)

        // filtro passa-alta para complementar
        const highPassFilter = this.audioContext.createBiquadFilter()
        highPassFilter.type = 'highpass'
        highPassFilter.frequency.setValueAtTime(300, this.audioContext.currentTime)
        highPassFilter.Q.setValueAtTime(1, this.audioContext.currentTime)
        return { highPassFilter, lowPassFilter }
    }

    async stop(): Promise<void> {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop())
            this.mediaStream = null
        }

        if (this.audioContext) {
            await this.audioContext.close()
            this.audioContext = null
        }

        this.mediaStreamSource = null
        this.workletNode = null
    }
}

export default Recorder
