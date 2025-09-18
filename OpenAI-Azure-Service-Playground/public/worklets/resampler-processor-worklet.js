/**
 * Estende a classe da Webaudio API para processar o áudio resampleado em tempo real
 * @see https://developer.mozilla.org/en-US/docs/Web/API/
 */
class ResamplerProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super()
        this.inputSampleRate = options.processorOptions.inputSampleRate
        this.targetSampleRate = options.processorOptions.targetSampleRate

        this.ratio = this.inputSampleRate / this.targetSampleRate
        this.resampleBuffer = []
    }

    process(inputs) {
        const input = inputs[0][0]
        if (input) {
            // resampleia (downsampling) o áudio utilizando o ratio (IN / OUT)
            for (let i = 0; i < input.length; i += this.ratio) {
                this.resampleBuffer.push(input[Math.floor(i)])
            }

            // verifica se o resampleBuffer atingiu um tamanho suficiente (1/10 da taxa de amostragem alvo).
            // envia o buffer resampleado de volta, ainda em Float32Array
            if (this.resampleBuffer.length >= this.targetSampleRate / 10) {
                this.port.postMessage(this.resampleBuffer.slice())
                this.resampleBuffer = []
            }
        }
        return true
    }
}

registerProcessor('resampler-processor-worklet', ResamplerProcessor)
