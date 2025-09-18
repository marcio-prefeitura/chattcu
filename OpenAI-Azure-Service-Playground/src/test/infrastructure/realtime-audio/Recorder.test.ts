import Recorder from '../../../infrastructure/realtime-audio/Recorder'

describe('Recorder', () => {
    let recorder: Recorder
    let mockHandleAudioData: jest.Mock
    let mockStream: MediaStream

    beforeEach(() => {
        mockHandleAudioData = jest.fn()
        recorder = new Recorder(mockHandleAudioData)
        mockStream = { addTrack: jest.fn(), getTracks: jest.fn().mockReturnValue([]) } as unknown as MediaStream
    })

    afterEach(async () => {
        await recorder.stop()
    })

    it('deve inicializar e começar a gravar', async () => {
        const mockAudioContext = {
            close: jest.fn(),
            audioWorklet: {
                addModule: jest.fn().mockResolvedValue(undefined)
            },
            createMediaStreamSource: jest.fn().mockReturnValue({ connect: jest.fn() }),
            createBiquadFilter: jest.fn().mockReturnValue({
                type: '',
                frequency: { setValueAtTime: jest.fn() },
                Q: { setValueAtTime: jest.fn() },
                connect: jest.fn()
            }),
            createScriptProcessor: jest.fn().mockReturnValue({ connect: jest.fn(), disconnect: jest.fn() }),
            sampleRate: 48000,
            currentTime: 0,
            destination: {}
        }
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)
        await expect(recorder.start(mockStream)).resolves.not.toThrow()
        await recorder.start(mockStream)

        expect(mockAudioContext.close).toHaveBeenCalled()
        expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith('/worklets/resampler-processor-worklet.js')
        expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream)
    })

    it('deve manipular error durante a inicializacao', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const mockAudioContext = {
            close: jest.fn(),
            audioWorklet: {
                addModule: jest.fn().mockRejectedValue(new Error('Test Error'))
            }
        }
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)

        await recorder.start(mockStream)

        expect(consoleErrorSpy).toHaveBeenCalledWith('error', new Error('Test Error'))
        consoleErrorSpy.mockRestore()
    })

    it('deve criar os filtros de passa-alta e passa-baixa', () => {
        const mockAudioContext = {
            createBiquadFilter: jest.fn().mockReturnValue({
                type: '',
                frequency: { setValueAtTime: jest.fn() },
                Q: { setValueAtTime: jest.fn() },
                connect: jest.fn()
            }),
            currentTime: 0,
            close: jest.fn()
        }
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)
        recorder = new Recorder(mockHandleAudioData)
        recorder['audioContext'] = new AudioContext()

        recorder['clearMicSignal']()

        expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(2)
    })
})
