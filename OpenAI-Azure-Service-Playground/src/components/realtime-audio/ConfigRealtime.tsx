import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Slider,
    FormControl,
    Grid,
    Tooltip,
    Checkbox,
    FormControlLabel,
    InputLabel
} from '@mui/material'

export interface IConfigRealtimeProps {
    handleChangeConfigRealtime: (field: keyof IConfigRealtimeAudio, value: any) => void
    config: IConfigRealtimeAudio
    isAudioOn: boolean
}
export interface IConfigRealtimeAudio {
    instructions: string
    modalities: ['audio', 'text']
    input_audio_transcription: {
        model: string | 'whisper-1'
    }
    turn_detection: { type: string; threshold: number; prefix_padding_ms: number; silence_duration_ms: number }
    voice:
        | string
        | 'amuch'
        | 'dan'
        | 'elan'
        | 'marilyn'
        | 'meadow'
        | 'breeze'
        | 'cove'
        | 'ember'
        | 'jupiter'
        | 'alloy'
        | 'echo'
        | 'shimmer'
    temperature: number // between 0.6 and 1.2
    max_response_output_tokens: number
    tools: string[]
    is_headset: boolean
}

const ConfigRealtime: React.FC<IConfigRealtimeProps> = ({ handleChangeConfigRealtime, config, isAudioOn }) => {
    const voices = [
        'marilyn',
        'amuch',
        'dan',
        'elan',
        'meadow',
        'breeze',
        'cove',
        'ember',
        'jupiter',
        'alloy',
        'echo',
        'shimmer'
    ]

    return (
        <Box>
            <FormControlLabel
                control={
                    <Checkbox
                        data-testid='is-headset-checkbox'
                        color='primary'
                        checked={config.is_headset}
                        onChange={e => handleChangeConfigRealtime('is_headset', e.target.checked)}
                        disabled={isAudioOn}
                    />
                }
                label='Ativa interrupção por fala. Em caso de retroalimentação de áudio desmarque(ou use fones).'
            />

            <TextField
                label='Prompt'
                fullWidth
                value={config.instructions}
                onChange={e => handleChangeConfigRealtime('instructions', e.target.value)}
                margin='normal'
                disabled={isAudioOn}
            />
            <Box mt={2}>
                <Typography variant='subtitle1'>Turn Detection:</Typography>
                <Grid
                    container
                    spacing={2}>
                    <Grid
                        item
                        xs={3}>
                        <Tooltip
                            title='detecção de voz a cargo do modelo'
                            arrow>
                            <TextField
                                disabled
                                label='Type'
                                fullWidth
                                value={config.turn_detection.type}
                                onChange={e =>
                                    handleChangeConfigRealtime('turn_detection', {
                                        ...config.turn_detection,
                                        type: e.target.value
                                    })
                                }
                                margin='normal'
                            />
                        </Tooltip>
                    </Grid>
                    <Grid
                        item
                        xs={3}>
                        <Tooltip
                            title='quanto maior, tem que falar mais alto para ser detectado.'
                            arrow>
                            <TextField
                                disabled={isAudioOn}
                                label='Threshold'
                                type='number'
                                fullWidth
                                inputProps={{ step: 0.1 }}
                                value={config.turn_detection.threshold}
                                onChange={e =>
                                    handleChangeConfigRealtime('turn_detection', {
                                        ...config.turn_detection,
                                        threshold: parseFloat(e.target.value)
                                    })
                                }
                                margin='normal'
                            />
                        </Tooltip>
                    </Grid>
                    <Grid
                        item
                        xs={3}>
                        <Tooltip
                            title='quantidade de áudio submetido antes da detecção.'
                            arrow>
                            <TextField
                                disabled={isAudioOn}
                                label='Prefix Padding (ms)'
                                type='number'
                                fullWidth
                                value={config.turn_detection.prefix_padding_ms}
                                onChange={e =>
                                    handleChangeConfigRealtime('turn_detection', {
                                        ...config.turn_detection,
                                        prefix_padding_ms: parseInt(e.target.value, 10)
                                    })
                                }
                                margin='normal'
                            />
                        </Tooltip>
                    </Grid>
                    <Grid
                        item
                        xs={3}>
                        <Tooltip
                            title='tempo em "silêncio" para considerar fim de fala.'
                            arrow>
                            <TextField
                                disabled={isAudioOn}
                                label='Silence Duration (ms)'
                                type='number'
                                fullWidth
                                value={config.turn_detection.silence_duration_ms}
                                onChange={e =>
                                    handleChangeConfigRealtime('turn_detection', {
                                        ...config.turn_detection,
                                        silence_duration_ms: parseInt(e.target.value, 10)
                                    })
                                }
                                margin='normal'
                            />
                        </Tooltip>
                    </Grid>
                </Grid>
            </Box>

            <Grid
                container
                spacing={2}>
                <Grid
                    item
                    xs={4}>
                    <FormControl
                        fullWidth
                        margin='normal'>
                        <InputLabel id='voice-select-label'>Voice</InputLabel>
                        <Select
                            disabled={isAudioOn}
                            labelId='voice-select-label'
                            label='Voice'
                            value={config.voice}
                            onChange={e => handleChangeConfigRealtime('voice', e.target.value)}>
                            {voices.map(voice => (
                                <MenuItem
                                    key={voice}
                                    value={voice}>
                                    {voice}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid
                    item
                    xs={4}>
                    <TextField
                        disabled={isAudioOn}
                        label='Max Response Output Tokens'
                        type='number'
                        fullWidth
                        value={config.max_response_output_tokens}
                        onChange={e =>
                            handleChangeConfigRealtime('max_response_output_tokens', parseInt(e.target.value, 10))
                        }
                        margin='normal'
                    />
                </Grid>
                <Grid
                    item
                    xs={4}>
                    Temperature ({config.temperature.toFixed(1)})
                    <Tooltip
                        title='Este modelo varia de 0.6 a 1.2, quanto maior, mais criativo.'
                        arrow>
                        <Slider
                            disabled={isAudioOn}
                            data-testid='temperature-slider'
                            value={config.temperature}
                            min={0.6}
                            max={1.2}
                            step={0.1}
                            onChange={(_e, value) => handleChangeConfigRealtime('temperature', value)}
                        />
                    </Tooltip>
                </Grid>
            </Grid>
            <TextField
                disabled
                label='Tools'
                fullWidth
                value={config.tools.join(', ')}
                onChange={e =>
                    handleChangeConfigRealtime(
                        'tools',
                        e.target.value.split(',').map(tool => tool.trim())
                    )
                }
                margin='normal'
            />
        </Box>
    )
}

export default ConfigRealtime
