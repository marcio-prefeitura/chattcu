import { Button } from '@mui/material'
import './ButtonRealtimeAudio.scss'

const ButtonRealtimeAudio = ({ isPlaying, onClick, testId }) => {
    return (
        <Button
            data-testid={testId}
            className={`button-realtime${isPlaying ? '__pulse' : ''}`}
            onClick={onClick}>
            {isPlaying ? 'Parar' : 'Iniciar'}
        </Button>
    )
}

export default ButtonRealtimeAudio
