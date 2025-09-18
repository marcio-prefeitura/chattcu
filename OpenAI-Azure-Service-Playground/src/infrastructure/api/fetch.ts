import { Environments } from '../environments/Environments'
import { IMessageHistory } from '../utils/types'
import getAccesToken from './access_token'

const createFetchRequest = async (body: object, endpoint: string, signal: AbortSignal): Promise<Response> => {
    const accessToken = await getAccesToken()
    const fetchConfig: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-Client-App': 'chat-tcu-playground'
        },
        body: JSON.stringify(body),
        signal: signal
    }
    return fetch(`${process.env.REACT_APP_BACK_ENDPOINT}${endpoint}`, fetchConfig)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sendMsgToStream = async (prompt: IMessageHistory, signal: AbortSignal) => {
    const env = prompt.chat_id !== '' ? `${Environments.urlChat}/${prompt.chat_id}` : `${Environments.urlChat}/`
    return createFetchRequest(
        {
            stream: true,
            prompt_usuario: prompt.conteudo,
            imagens: prompt.imagens,
            arquivos_selecionados: prompt.arquivos_selecionados,
            arquivos_selecionados_prontos: prompt.arquivos_selecionados_prontos,
            tool_selecionada: prompt.tool_selecionada,
            parametro_modelo_llm: prompt.parametro_modelo_llm,
            correlacao_chamada_id: prompt.correlacao_chamada_id,
            config: prompt.config
        },
        env,
        signal
    )
}
