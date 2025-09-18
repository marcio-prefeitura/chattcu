import { useState, forwardRef, useImperativeHandle } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AudioManager from '../../infrastructure/realtime-audio/AudioManager'
import ButtonRealtimeAudio from './ButtonRealtimeAudio'
import ConfigRealtime, { IConfigRealtimeAudio } from './ConfigRealtime'

type AudioControlProps = {}
export interface IAudioControlHandle {
    cleanup: () => void //
}

const AudioControl = forwardRef<IAudioControlHandle, AudioControlProps>((props, ref) => {
    const [audioManager, setAudioManager] = useState<AudioManager | null>(null)
    const [isAudioOn, setIsAudioOn] = useState(false)
    const isFirefox = () => {
        const userAgent = navigator.userAgent.toLowerCase()
        return userAgent.includes('firefox')
    }

    const [configSessionRealtime, setConfigSessionRealtime] = useState<IConfigRealtimeAudio>({
        instructions:
            'Você é um assistente virtual educado e prestativo, que responde de forma sucinta.' +
            'Responde sempre usando a língua portuguesa do Brasil.',
        modalities: ['audio', 'text'],
        input_audio_transcription: {
            model: 'whisper-1'
        },
        turn_detection: { type: 'server_vad', threshold: 0.8, prefix_padding_ms: 300, silence_duration_ms: 1200 },
        voice: 'marilyn',
        temperature: 0.6,
        max_response_output_tokens: 1999,
        tools: ['search_normas'],
        is_headset: !isFirefox()
    })

    // limpeza por acionamento externo via callback
    const cleanup = () => {
        console.log('Função limpeza por acionamento externo do AudioControl executada!')
        if (audioManager) audioManager.sendStopSessionConversationChat()
    }

    useImperativeHandle(ref, () => ({
        cleanup
    }))

    const handleToggleAudio = async () => {
        let manager: AudioManager
        if (!isAudioOn) {
            manager = new AudioManager(configSessionRealtime)

            try {
                console.log('Iniciando audio')
                // isso não foi internalizado em Audio Manager por motido de alguns bloqueios
                // por motores de segurança de browsers que não permitem a execução desvencilhada
                // de uma ação de áudio sem ação do usuário
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 48000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                })

                manager.setStream(stream)
                manager.setIsToSend(true)
                await manager.start()

                setAudioManager(manager)
                setIsAudioOn(true)
            } catch (error) {
                console.error('Falha ao iniciar o áudio: ', error)
            }
        } else {
            // parar a sessão toda
            if (audioManager) {
                console.log('Encerrando conexão WS')
                await audioManager.sendStopSessionConversationChat()
            } else {
                console.error('Instância de AudioManager não inicializada.')
            }
            console.log('Conexão WS encerrada!')
            setAudioManager(null)
            setIsAudioOn(false)
        }
    }

    const handleChangeConfigRealtime = (field: keyof IConfigRealtimeAudio, value: any) => {
        setConfigSessionRealtime({ ...configSessionRealtime, [field]: value })
    }

    const handleCancelIncomingResponse = async () => {
        if (audioManager && audioManager instanceof AudioManager) {
            // interrompe a fala do modelo, porém mantém a sessão
            audioManager.sendCancelResponseIncoming()
        }
    }
    return (
        <Box>
            <Stack
                spacing={3}
                alignItems='center'
                direction='column'>
                <Stack
                    direction='row'
                    alignItems='center'
                    spacing={3}>
                    <ButtonRealtimeAudio
                        testId='button-realtime-audio'
                        isPlaying={isAudioOn}
                        onClick={handleToggleAudio}
                    />
                    <Box>
                        {isAudioOn && (
                            <Button
                                className='button-realtime__cancelar'
                                onClick={handleCancelIncomingResponse}>
                                {'Cancelar Resposta'}
                            </Button>
                        )}
                    </Box>
                </Stack>
                <Box>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>Configurações da sessão:</AccordionSummary>
                        <AccordionDetails>
                            <ConfigRealtime
                                handleChangeConfigRealtime={handleChangeConfigRealtime}
                                config={configSessionRealtime}
                                isAudioOn={isAudioOn}
                            />
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Stack>
        </Box>
    )
})

export default AudioControl
