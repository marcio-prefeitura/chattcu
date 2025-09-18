import Player from '../../../infrastructure/realtime-audio/Player'

describe('Player', () => {
    let player: Player
    let mockAudioContext: AudioContext
    let mockAnalyserNode: AnalyserNode
    let mockAudioWorkletNode: AudioWorkletNode
    let mockDataArray: Uint8Array

    beforeEach(() => {
        mockDataArray = new Uint8Array(128)
        for (let i = 0; i < mockDataArray.length; i++) {
            mockDataArray[i] = 128 // 128 represents silence in an 8-bit PCM audio
        }

        mockAudioWorkletNode = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            port: {
                postMessage: jest.fn()
            }
        } as unknown as AudioWorkletNode

        mockAnalyserNode = {
            frequencyBinCount: 32,
            getByteTimeDomainData: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn()
        } as unknown as AnalyserNode

        mockAudioContext = {
            audioWorklet: {
                addModule: jest.fn().mockResolvedValue(undefined)
            },
            createAnalyser: jest.fn().mockReturnValue({
                frequencyBinCount: 32,
                getByteTimeDomainData: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn()
            }),
            destination: {},
            close: jest.fn()
        } as unknown as AudioContext

        mockAudioWorkletNode = {
            connect: jest.fn(),
            port: {
                postMessage: jest.fn()
            }
        } as unknown as AudioWorkletNode

        player = new Player(mockAudioWorkletNode, mockAudioContext, mockAnalyserNode, mockDataArray, 1738098368592)

        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)
        window.AudioWorkletNode = jest.fn().mockImplementation(() => mockAudioWorkletNode)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('deve startar o player', async () => {
        const mockAudioContext = {
            audioWorklet: {
                addModule: jest.fn().mockResolvedValue(undefined)
            },
            createAnalyser: jest.fn().mockReturnValue({
                frequencyBinCount: 32,
                getByteTimeDomainData: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn()
            }),
            destination: {},
            close: jest.fn()
        }
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)

        await expect(player.start(48000)).resolves.not.toThrow()

        expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith('/worklets/audio-playback-worklet.js')
        expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
    })

    it('deve startar o monitoramento e detectar o silencio', () => {
        const onSilenceCallback = jest.fn()

        mockAnalyserNode.getByteTimeDomainData = jest.fn().mockImplementation((dataArray: Uint8Array) => {
            dataArray.fill(128)
        })

        player.startMonitoring(onSilenceCallback)

        expect(onSilenceCallback).toHaveBeenCalled()
    })

    it('deve tocar o audio buffer', async () => {
        await player.start(48000)
        const buffer = new ArrayBuffer(8)

        player.play(buffer)

        expect(mockAudioWorkletNode.port.postMessage).toHaveBeenCalledWith(buffer)
    })

    it('deve parar o player', async () => {
        await player.start(48000)

        player.stop()

        expect(mockAudioWorkletNode.port.postMessage).toHaveBeenCalledWith(null)
    })

    it('deve cancelar o playback e limpar o buffer', async () => {
        await player.start(48000)

        player.cancelCurrentAndClearBuffer()

        expect(mockAudioWorkletNode.port.postMessage).toHaveBeenCalledWith(null)
    })

    it('deve disconectar o analisador quando o player for parado', async () => {
        await player.start(48000)
        player.stop()
        expect(mockAudioWorkletNode.port.postMessage).toHaveBeenCalledWith(null)
    })
})
