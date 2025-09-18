import { IChat, IStreamResponse, IStreamResponseError } from '../../infrastructure/utils/types'

let partialData = ''
let response: (IStreamResponse | IStreamResponseError)[] = []
let currentChat: IChat | null = null

export const parseStreamData = (data: string, updatedChat: IChat): (IStreamResponse | IStreamResponseError)[] => {
    response = []

    // Se o chat atual não existir ou tiver um ID diferente do chat atualizado, reinicie o partialData
    if (!currentChat || updatedChat.id !== currentChat.id) {
        clearPartialData()
    }

    //acumulador
    partialData += data

    // chunks usam '\n\n' como delimitador, que não colide com os \\n dos atributos
    const lista = partialData.split('\n\n')
    lista.forEach(chunk => {
        if (chunk && chunk !== '') {
            try {
                const parsedObject: IStreamResponse | IStreamResponseError = JSON.parse(chunk)
                response.push(parsedObject)
            } catch (error) {
                if (error instanceof SyntaxError) {
                    //console.log('chunk ainda não chegou ao fim, continua no buffer.')
                } else {
                    console.error('Erro diverso:', error)
                }
            }
        }
    })

    // atualiza o partialData para remover o que já foi processado
    // mantém apenas a última parte não processada (incompleta), se existir
    partialData = lista[lista.length - 1] && lista[lista.length - 1].trim()
    currentChat = updatedChat
    return response
}

export const clearPartialData = () => {
    partialData = ''
}
