import { render, fireEvent } from '@testing-library/react'
import ButtonRealtimeAudio from '../../../components/realtime-audio/ButtonRealtimeAudio'

describe('ButtonRealtimeAudio Component', () => {
    it('should render with "Iniciar" text when isPlaying is false', () => {
        const { getByText } = render(
            <ButtonRealtimeAudio
                isPlaying={false}
                onClick={() => {}}
                testId='button-realtime-audio'
            />
        )
        expect(getByText('Iniciar')).toBeInTheDocument()
    })

    it('deve renderizar com "Parar" quando isPlaying é true', () => {
        const { getByText } = render(
            <ButtonRealtimeAudio
                isPlaying={true}
                onClick={() => {}}
                testId='button-realtime-audio'
            />
        )
        expect(getByText('Parar')).toBeInTheDocument()
    })

    it('deve chamar onClick qundo botão é clicado', () => {
        const handleClick = jest.fn()
        const { getByTestId } = render(
            <ButtonRealtimeAudio
                isPlaying={false}
                onClick={handleClick}
                testId='button-realtime-audio'
            />
        )
        const button = getByTestId('button-realtime-audio')
        fireEvent.click(button)
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('deve aplicar css quando isPlaying é true', () => {
        const { getByTestId } = render(
            <ButtonRealtimeAudio
                isPlaying={true}
                onClick={() => {}}
                testId='button-realtime-audio'
            />
        )
        const button = getByTestId('button-realtime-audio')
        expect(button).toHaveClass('button-realtime__pulse')
    })

    it('deve aplicar css quando isPlaying é false', () => {
        const { getByTestId } = render(
            <ButtonRealtimeAudio
                isPlaying={false}
                onClick={() => {}}
                testId='button-realtime-audio'
            />
        )
        const button = getByTestId('button-realtime-audio')
        expect(button).not.toHaveClass('button-realtime__pulse')
    })
})
