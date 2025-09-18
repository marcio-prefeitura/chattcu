import AudioManager from '../../../infrastructure/realtime-audio/AudioManager'
import Recorder from '../../../infrastructure/realtime-audio/Recorder'
import Player from '../../../infrastructure/realtime-audio/Player'
import { IConfigRealtimeAudio } from '../../../components/realtime-audio/ConfigRealtime'
import getAccesToken from '../../../infrastructure/api/access_token'
import { isLocalhost } from '../../../infrastructure/utils/util'

jest.mock('../../../infrastructure/realtime-audio/Recorder')
jest.mock('../../../infrastructure/realtime-audio/Player')
jest.mock('../../../infrastructure/api/access_token')
jest.mock('../../../infrastructure/utils/util')

describe('AudioManager', () => {
    let audioManager: AudioManager
    let mockConfig: IConfigRealtimeAudio
    let mockWebSocket: WebSocket
    let player: Player

    beforeEach(() => {
        const mockDataArray = new Uint8Array(128)
        for (let i = 0; i < mockDataArray.length; i++) {
            mockDataArray[i] = 128 // 128 representa silêncio em um áudio PCM de 8 bits
        }

        const mockAudioWorkletNode = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            port: {
                postMessage: jest.fn()
            }
        } as unknown as AudioWorkletNode

        const mockAnalyserNode = {
            frequencyBinCount: 32,
            getByteTimeDomainData: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn()
        } as unknown as AnalyserNode

        const mockAudioContext = {
            audioWorklet: {
                addModule: jest.fn().mockResolvedValue({})
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

        player = new Player(mockAudioWorkletNode, mockAudioContext, mockAnalyserNode, mockDataArray, 1738098368592)

        new Recorder(jest.fn())

        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)
        window.AudioWorkletNode = jest.fn().mockImplementation(() => mockAudioWorkletNode)

        mockConfig = {
            type: 'auth_config',
            token: 'mockToken'
        } as unknown as IConfigRealtimeAudio
        audioManager = new AudioManager(mockConfig)
        mockWebSocket = {
            send: jest.fn(),
            close: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            readyState: WebSocket.OPEN
        } as unknown as WebSocket
        ;(getAccesToken as jest.Mock).mockResolvedValue('mockToken')
        ;(isLocalhost as jest.Mock).mockReturnValue(true)
        ;(global as any).WebSocket = jest.fn(() => mockWebSocket)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('deve inicializar e iniciar a conexão WebSocket', async () => {
        await audioManager.start()

        expect(getAccesToken).toHaveBeenCalled()
        expect(global.WebSocket).toHaveBeenCalled()
    })

    it('deve lidar com mensagens WebSocket', async () => {
        await audioManager.start()

        const mockMessageEvent = {
            data: JSON.stringify({ type: 'backend-authorized.done' })
        } as MessageEvent
        mockWebSocket.onmessage!(mockMessageEvent)

        expect(Player).toHaveBeenCalled()
        expect(Recorder).toHaveBeenCalled()
    })

    it('deve parar o gerenciador de áudio', async () => {
        await audioManager.start()
        await audioManager.sendStopSessionConversationChat()

        expect(mockWebSocket.close).toHaveBeenCalled()
    })

    it('deve cancelar a resposta e limpar o buffer', async () => {
        await audioManager.start()
        audioManager['itemIdCurrent'] = 'testItemId'
        await audioManager.sendCancelResponseIncoming()

        expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'response.cancel' }))
    })

    it('deve converter Float32Array para Int16Array corretamente', () => {
        const float32Array = new Float32Array([0.5, -0.5, 1, -0.5, 0])
        const expectedInt16Array = new Int16Array([16383, -16384, 32767, -16384, 0])

        const result = (audioManager as any).convertFloat32ToInt16(float32Array)

        expect(result).toEqual(expectedInt16Array)
    })

    it('deve converter e tocar o stream de áudio corretamente', () => {
        const mockData = {
            delta: btoa(String.fromCharCode(...Array.from(new Uint8Array([0, 1, 2, 3]))))
        }
        const expectedPcmData = new Int16Array(new Uint8Array([0, 1, 2, 3]).buffer)

        audioManager['audioPlayer'] = player
        const playSpy = jest.spyOn(player, 'play')

        ;(audioManager as any).convertAndPlayAudioStream(mockData)

        expect(playSpy).toHaveBeenCalledWith(expectedPcmData)
    })

    it('deve lidar com dados de áudio corretamente', async () => {
        //simula extamente o comportamento interno que deveria ter o handleAudioData
        const float32Array = new Float32Array(4800).fill(0)
        const int16Array = audioManager.convertFloat32ToInt16(float32Array)
        const uint8Array = new Uint8Array(int16Array.buffer)
        const buffer = audioManager.appendToBuffer(uint8Array)
        const toSend = new Uint8Array(buffer.slice(0, 4800))
        const base64 = btoa(String.fromCharCode(...Array.from(toSend)))

        await audioManager.start()
        audioManager['isToSend'] = true
        audioManager['sendAudioData'] = jest.fn()
        ;(audioManager as any).handleAudioData(float32Array)

        expect(audioManager['sendAudioData']).toHaveBeenCalledWith(base64)
    })

    it('deve retornar o stream corretamente', () => {
        const mockStream = {} as MediaStream
        audioManager.setStream(mockStream)

        const result = audioManager.getStream()

        expect(result).toBe(mockStream)
    })

    it('deve definir o stream corretamente', () => {
        const mockStream = {} as MediaStream

        audioManager.setStream(mockStream)

        expect(audioManager.getStream()).toBe(mockStream)
    })

    it('deve retornar isToSend corretamente', () => {
        audioManager.setIsToSend(false)

        const result = audioManager.getIsToSend()

        expect(result).toBe(false)
    })

    it('deve definir isToSend corretamente', () => {
        audioManager.setIsToSend(false)

        expect(audioManager.getIsToSend()).toBe(false)
    })
})
