import { render, fireEvent, waitFor } from '@testing-library/react'
import AudioControl from '../../../components/realtime-audio/AudioControl'
import AudioManager from '../../../infrastructure/realtime-audio/AudioManager'

jest.mock('../../../infrastructure/realtime-audio/AudioManager')

describe('AudioControl Component', () => {
    let mockAudioManagerInstance: jest.Mocked<AudioManager>

    beforeEach(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                ...navigator.mediaDevices,
                getUserMedia: jest.fn().mockResolvedValue({
                    getTracks: jest.fn().mockReturnValue([
                        {
                            stop: jest.fn()
                        }
                    ])
                })
            },
            configurable: true
        })

        mockAudioManagerInstance = new AudioManager({} as any) as jest.Mocked<AudioManager>
        ;(AudioManager as jest.MockedClass<typeof AudioManager>).mockImplementation(() => mockAudioManagerInstance)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('deve iniciar o audio quando handleToggleAudio é chamado e o áudio tá desligado', async () => {
        const { getByTestId } = render(<AudioControl />)
        const button = getByTestId('button-realtime-audio')

        mockAudioManagerInstance.start.mockResolvedValueOnce(undefined)
        mockAudioManagerInstance.setStream.mockImplementationOnce(() => {})
        mockAudioManagerInstance.setIsToSend.mockImplementationOnce(() => {})

        fireEvent.click(button)

        await waitFor(() => {
            expect(mockAudioManagerInstance.start).toHaveBeenCalled()
            expect(mockAudioManagerInstance.setStream).toHaveBeenCalled()
            expect(mockAudioManagerInstance.setIsToSend).toHaveBeenCalledWith(true)
        })
    })

    it('deve parar o audio handleToggleAudio é chamado e o audio tá ligado', async () => {
        const { getByTestId } = render(<AudioControl />)
        const button = getByTestId('button-realtime-audio')

        mockAudioManagerInstance.start.mockResolvedValueOnce(undefined)
        mockAudioManagerInstance.setStream.mockImplementationOnce(() => {})
        mockAudioManagerInstance.setIsToSend.mockImplementationOnce(() => {})

        fireEvent.click(button)

        await waitFor(() => {
            expect(mockAudioManagerInstance.start).toHaveBeenCalled()
        })

        fireEvent.click(button)

        await waitFor(() => {
            expect(mockAudioManagerInstance.sendStopSessionConversationChat).toHaveBeenCalled()
        })
    })

    it('deve manipular o erro quando há falha', async () => {
        const { getByTestId } = render(<AudioControl />)
        const button = getByTestId('button-realtime-audio')

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        mockAudioManagerInstance.start.mockRejectedValueOnce(new Error('Failed to start audio'))

        fireEvent.click(button)

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Falha ao iniciar o áudio: ', expect.any(Error))
        })

        consoleErrorSpy.mockRestore()
    })
})
