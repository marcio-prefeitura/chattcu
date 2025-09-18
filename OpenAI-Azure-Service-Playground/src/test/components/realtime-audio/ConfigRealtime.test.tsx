import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import ConfigRealtime, {
    IConfigRealtimeProps,
    IConfigRealtimeAudio
} from '../../../components/realtime-audio/ConfigRealtime'

const mockHandleChangeConfigRealtime = jest.fn()

const defaultConfig: IConfigRealtimeAudio = {
    instructions: '',
    modalities: ['audio', 'text'],
    input_audio_transcription: {
        model: 'whisper-1'
    },
    turn_detection: { type: 'default', threshold: 0.5, prefix_padding_ms: 100, silence_duration_ms: 500 },
    voice: 'marilyn',
    temperature: 0.8,
    max_response_output_tokens: 100,
    tools: ['tool1', 'tool2'],
    is_headset: false
}

const defaultProps: IConfigRealtimeProps = {
    handleChangeConfigRealtime: mockHandleChangeConfigRealtime,
    config: defaultConfig,
    isAudioOn: false
}

describe('ConfigRealtime Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('deve renderizar os campos corretamente', () => {
        const { getByLabelText, getByText } = render(<ConfigRealtime {...defaultProps} />)

        expect(getByLabelText('Prompt')).toBeInTheDocument()
        expect(getByLabelText('Voice')).toBeInTheDocument()
        expect(getByLabelText('Max Response Output Tokens')).toBeInTheDocument()
        expect(getByText('Temperature (0.8)')).toBeInTheDocument()
        expect(getByLabelText('Tools')).toBeInTheDocument()
    })

    it('deve chamar a handleChangeConfigRealtime quando as instruções mudam', () => {
        const { getByLabelText } = render(<ConfigRealtime {...defaultProps} />)
        const input = getByLabelText('Prompt')

        fireEvent.change(input, { target: { value: 'nova instrução' } })
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('instructions', 'nova instrução')
    })

    it('deve chamar handleChangeConfigRealtime quando muda max response output tokens', () => {
        const { getByLabelText } = render(<ConfigRealtime {...defaultProps} />)
        const input = getByLabelText('Max Response Output Tokens')

        fireEvent.change(input, { target: { value: '150' } })
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('max_response_output_tokens', 150)
    })

    it('deve chamar handleChangeConfigRealtime quando muda o turn detection', () => {
        const { getByLabelText } = render(<ConfigRealtime {...defaultProps} />)
        const thresholdInput = getByLabelText('Threshold')
        const prefixPaddingInput = getByLabelText('Prefix Padding (ms)')
        const silenceDurationInput = getByLabelText('Silence Duration (ms)')

        fireEvent.change(thresholdInput, { target: { value: '0.7' } })
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('turn_detection', {
            ...defaultConfig.turn_detection,
            threshold: 0.7
        })

        fireEvent.change(prefixPaddingInput, { target: { value: '200' } })
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('turn_detection', {
            ...defaultConfig.turn_detection,
            prefix_padding_ms: 200
        })

        fireEvent.change(silenceDurationInput, { target: { value: '600' } })
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('turn_detection', {
            ...defaultConfig.turn_detection,
            silence_duration_ms: 600
        })
    })

    it('deve chamar handleChangeConfigRealtime quando muda o is_headset', () => {
        const { getByTestId } = render(<ConfigRealtime {...defaultProps} />)
        const checkbox = getByTestId('is-headset-checkbox')

        fireEvent.click(checkbox)
        expect(mockHandleChangeConfigRealtime).toHaveBeenCalledWith('is_headset', true)
    })
})
