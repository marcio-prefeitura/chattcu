import { IConfigRealtimeAudio } from '../../components/realtime-audio/ConfigRealtime'
import getAccesToken from '../api/access_token'
import { Environments } from '../environments/Environments'
import { isLocalhost } from '../utils/util'
import Player from './Player'
import Recorder from './Recorder'

const BUFFER_SIZE = 4800

const TARGET_SAMPLE_RATE = 24000
const MIN_INT16 = -0x8000
const MAX_INT16 = 0x7fff

/**
 * Classe responsável por gerenciar as classes Recorder e Player.
 * Na POC atual também resolve os Types Events do WebSocket.
 *
 * TO DO (SRP): - refatorar para separar responsabilidades de tratamento de eventos no futuros;
 *             - transformar eventos em interfaces/Classes;
 *             - tratar mensagens de erro do backend;
 */
class AudioManager {
    private ws: WebSocket | null
    private audioPlayer: Player | null
    private audioRecorder: Recorder | null
    private stream: MediaStream | null
    private isToSend: boolean
    private configSessionRealtime: IConfigRealtimeAudio

    // lista de item_id a serem ignorados caso venha a aparecer no stream de resposta ignoradas
    private itemIdToIgnore = ''
    private itemIdCurrent = ''

    constructor(_configSessionRealtime: IConfigRealtimeAudio) {
        this.configSessionRealtime = _configSessionRealtime
        this.ws = null
        this.audioPlayer = null
        this.audioRecorder = null
        this.stream = null
        this.isToSend = true
    }

    public async start(): Promise<void> {
        try {
            const entraIdToken = await getAccesToken()
            this.ws = this.createWebSocketConnection()
            this.ws.onopen = async (event: Event) => {
                console.log('WebSocket conexão aberta:', event)
                this.ws?.send(
                    JSON.stringify({
                        type: 'auth_config',
                        token: entraIdToken,
                        config_instructions: this.configSessionRealtime
                    })
                )
            }

            this.ws.onmessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data)

                if (data?.type === 'backend-authorized.done') this.startPlayerAndRecorder()

                if (data?.type === 'backend-business-error') console.log('ERRO:', data?.message)

                // usuário iniciou uma fala em cima de um chat com saída de áudio
                if (data?.type === 'input_audio_buffer.speech_started' && this.configSessionRealtime.is_headset) {
                    this.sendCancelResponseIncoming()
                }

                // só continua se for áudio
                if (data?.type !== 'response.audio.delta') return

                /**
                 *  se não é um item de resposta a ser ignorado continua, porém
                 *  ainda há um segundo tratamento para esvaziamento do buffer atual.
                 *  @see AudioPlayer.cancelCurrentAndClearBuffer()
                 */
                this.itemIdCurrent = data?.item_id
                if (data?.item_id === this.itemIdToIgnore) return

                // se não é configuração de headset, precisa de controle de fluxo de áudio para navegadores
                // que não possui echoCancellation
                if (!this.configSessionRealtime.is_headset) {
                    //se está chegando áudio, não posso deixar enviar áudio do mic, para não retroaliementar
                    this.isToSend = false
                }

                this.convertAndPlayAudioStream(data)

                //se não é configuração de headset, precisa de controle de fluxo de áudio
                if (!this.configSessionRealtime.is_headset) {
                    // starta o analisador de frequência para detectar silêncio
                    // por parte da saída de áudio (modelo), existindo silêncio habilita o envio de áudio
                    this.audioPlayer!.startMonitoring(() => (this.isToSend = true))
                }
            }
            this.ws.onerror = (event: Event) => console.log('WebSocket error:', event)
            this.ws.onclose = (event: CloseEvent) => console.log('WebSocket conexão encerrada:', event)
        } catch (error) {
            console.error('Error starting audio:', error)
        }
    }

    public appendToBuffer = (newData: Uint8Array): Uint8Array => {
        const buffer = new Uint8Array()
        const newBuffer = new Uint8Array(buffer.length + newData.length)
        newBuffer.set(buffer)
        newBuffer.set(newData, buffer.length)
        return newBuffer
    }

    public convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
        const int16Array = new Int16Array(float32Array.length)
        for (let i = 0; i < float32Array.length; i++) {
            let val = Math.floor(float32Array[i] * MAX_INT16)
            val = Math.max(MIN_INT16, Math.min(MAX_INT16, val))
            int16Array[i] = val
        }
        return int16Array
    }

    private handleAudioData = (data: Float32Array): void => {
        // quantiza o sinal de áudio para 8 bits
        // detalhe que esse sinal já sofreu um resample de 48KHz -> 24KHz
        const int16Array = this.convertFloat32ToInt16(data)
        const uint8Array = new Uint8Array(int16Array.buffer)
        const buffer = this.appendToBuffer(uint8Array)

        if (buffer.length >= BUFFER_SIZE) {
            const toSend = new Uint8Array(buffer.slice(0, BUFFER_SIZE))

            const regularArray = String.fromCharCode(...Array.from(toSend))
            const base64 = btoa(regularArray)

            if (this.isToSend) {
                this.sendAudioData(base64)

                // toca o audio no proprio browser para teste
                //this.audioPlayer?.play(new Int16Array(toSend.buffer))
            }
        }
    }

    private createWebSocketConnection(): WebSocket {
        if (isLocalhost()) {
            return new WebSocket(`ws://localhost:3030${Environments.urlWebsocketRealtimeAudio}`)
        } else {
            return new WebSocket(
                `${process.env.REACT_APP_BACK_ENDPOINT?.replace('https', 'wss')}${
                    Environments.urlWebsocketRealtimeAudio
                }`
            )
        }
    }

    private convertAndPlayAudioStream(data: any) {
        const binary = atob(data.delta)
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
        const pcmData = new Int16Array(bytes.buffer)
        this.audioPlayer!.play(pcmData)
    }

    public async sendAudioData(base64: string): Promise<void> {
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }))
        }
    }

    /**
     * encerra a sessão de conversação toda e o aparato de gerenciamento de áudio
     */
    public async sendStopSessionConversationChat(): Promise<void> {
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify({ type: 'stop_audio_conversation' }))
        }
        await this.stop()
    }

    /**
     * cancela o envio da resposta do modelo, mas mantém a sessão
     * para que o usuário possa falar novamente
     */
    public async sendCancelResponseIncoming(): Promise<void> {
        if (this.ws) {
            this.itemIdToIgnore = this.itemIdCurrent || 'x'
            console.log('cancelando resposta do modelo, itemIdToIgnore:', this.itemIdToIgnore)
            this.ws.send(JSON.stringify({ type: 'response.cancel' }))

            this.audioPlayer?.cancelCurrentAndClearBuffer()
        }
    }

    private async startPlayerAndRecorder(): Promise<void> {
        this.audioPlayer = new Player()
        await this.audioPlayer.start(TARGET_SAMPLE_RATE)
        console.log('Player inicializado!')

        this.audioRecorder = new Recorder(this.handleAudioData)
        if (this.stream) await this.audioRecorder.start(this.stream)
        console.log('Recorder inicializado!')
    }

    private async stop(): Promise<void> {
        if (this.audioRecorder) {
            await this.audioRecorder.stop()
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
        if (this.audioPlayer) {
            this.audioPlayer.stop()
        }
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    public getStream(): MediaStream | null {
        return this.stream
    }

    public setStream(stream: MediaStream): void {
        this.stream = stream
    }

    public getIsToSend(): boolean {
        return this.isToSend
    }

    public setIsToSend(isToSend: boolean): void {
        this.isToSend = isToSend
    }
}

export default AudioManager
