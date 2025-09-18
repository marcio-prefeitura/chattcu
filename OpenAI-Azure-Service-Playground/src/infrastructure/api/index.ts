import axios, { AxiosRequestConfig } from 'axios'

import { Environments } from '../environments/Environments'
import { IChat, IChatUpdate, IFeedback, IMessageHistory } from '../utils/types'
import getAccesToken from './access_token'

export async function createAxiosInstance(config?: AxiosRequestConfig) {
    const accessToken = await getAccesToken()
    const axiosRequestConfigToInject: AxiosRequestConfig = {
        baseURL: process.env.REACT_APP_BACK_ENDPOINT,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-Client-App': 'chat-tcu-playground'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        ...config
    }
    const axiosInstance = axios.create(axiosRequestConfigToInject)
    return axiosInstance
}

export const recuperarInformacoesUsuario = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(Environments.urlUserInfo))

    return data
}

export const sendMsgChat = async (prompt: IMessageHistory) => {
    /* const encodedBytes = new TextEncoder().encode(prompt.conteudo)
    const encodedArray = Array.from(encodedBytes)
    const encodedString = btoa(String.fromCharCode(...encodedArray)) */

    const { data } = await createAxiosInstance().then(instance =>
        instance.post(Environments.urlChat, {
            chat_id: prompt.chat_id,
            prompt_usuario: prompt.conteudo
            // temp_chat_id: prompt.temp_chat_id
        })
    )

    return data
}

export const sendStopChatProcess = async (correlacao_chamada_id?: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.post(`${Environments.urlChatStop}/${correlacao_chamada_id}`)
    )
    return data
}

export const listChats = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlChat}/`))

    return data
}

export const listArchive = async () => {
    const data = await listChatsPaginado({ per_page: 15, page: 1, fixados: false, arquivados: true })
    return data.chats
}

export const listChatMessages = async (chat_id: string) => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlChat}/${chat_id}`))
    return data
}

export const listAllModels = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlListarModelsChats}`))

    return data
}

export const renameChat = async (chat: IChatUpdate) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/${chat.chat_id}`, {
            titulo: chat.novo_nome
        })
    )

    return data
}

export const apagarChat = async (chat_id: string) => {
    const { data } = await createAxiosInstance().then(instance => instance.delete(`${Environments.urlChat}/${chat_id}`))

    return data
}

export const apagarTodosChatsRecentes = async () => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.delete(`${Environments.urlChat}/bulk-delete/`, {
            data: { fixados: false, arquivados: false }
        })
    )

    return data
}

export const apagarTodosChatsFixados = async () => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.delete(`${Environments.urlChat}/bulk-delete/`, {
            data: { fixados: true, arquivados: false }
        })
    )

    return data
}

export const desafixarTodosChats = async () => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/bulk-update/`, {
            fixados: true,
            arquivados: false
        })
    )

    return data
}

export const fixarChat = async (chat: IChat) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/${chat.id}`, {
            fixado: chat.fixado
        })
    )

    return data
}

export const archiveChatNew = async (chat: IChat) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/${chat.id}`, {
            arquivado: !chat.arquivado
        })
    )
    return data
}

export const enviarFeedback = async (feedback: IFeedback) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/${feedback.chat_id}/mensagem/${feedback.cod_mensagem}/feedback`, {
            reacao: feedback.reacao,
            conteudo: feedback.conteudo,
            ofensivo: feedback.ofensivo,
            inveridico: feedback.inveridico,
            nao_ajudou: feedback.nao_ajudou
        })
    )

    return data
}

export const linkLogin = async (origin: string, pathname: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(Environments.urlLinkLogin, {
            params: {
                origin: origin,
                pathname: pathname,
                context: false
            }
        })
    )
    return data
}

export const uploadFileToAnalysis = async (folderId: string, fileId: string, data: any | FormData, onProgress) => {
    return await createAxiosInstance().then(instance =>
        instance.post(`${Environments.urlFolder}/${folderId}/files`, data, {
            onUploadProgress: e => {
                const progress = Math.round((e.loaded * 100) / e.total)
                onProgress(fileId, { progress: progress })
            }
        })
    )
}

export const listFolders = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(Environments.urlFolder))
    return data
}

export const listFilesByIds = async (fileIds: string[]) => {
    if (!fileIds || fileIds.length === 0) return undefined
    if (fileIds.length === 1 && fileIds[0] === null) return undefined
    const { data } = await createAxiosInstance().then(instance => instance.post(Environments.urlFile, { ids: fileIds }))
    return data
}

export const checkHealth = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(Environments.urlCheckHealth))
    return data
}

export const deleteFolder = async (folderId: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.delete(`${Environments.urlFolder}/${folderId}`)
    )
    return data
}

export const createFolder = async data => {
    return await createAxiosInstance().then(instance => instance.post(`${Environments.urlFolder}`, data))
}

export const editFolder = async (folderId: string, data) => {
    return await createAxiosInstance().then(instance => instance.put(`${Environments.urlFolder}/${folderId}`, data))
}

export const downloadFile = async (fileId: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlDownload}/${fileId}`, {
            responseType: 'blob'
        })
    )
    return data
}

export const downloadFolder = async (folderId: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlDownload}/${folderId}`, {
            responseType: 'blob'
        })
    )
    return data
}

export const editFile = async (fileId: string, data) => {
    return await createAxiosInstance().then(instance => instance.put(`${Environments.urlFile}/${fileId}`, data))
}

export const deleteFile = async (fileIds: string[]) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.delete(Environments.urlFile + '/bulk-delete', { data: { ids: fileIds } })
    )
    return data
}

export const copyFile = async (fileId: string[], destinationFolderId: string) => {
    try {
        const requestData = {
            acao: 'COPY',
            ids_itens: fileId
        }

        const copyResponse = await createAxiosInstance().then(instance =>
            instance.put(`${Environments.urlFolder}/${destinationFolderId}/files`, requestData)
        )

        if (copyResponse.status === 200 || copyResponse.status === 201) {
            return copyResponse.data
        } else {
            throw new Error('Erro ao copiar o arquivo')
        }
    } catch (error) {
        console.error('Erro ao copiar o arquivo:', error)
        return false
    }
}

export const moveFile = async (filesId: string[], destinationFolderId: string) => {
    try {
        const requestData = {
            acao: 'MOVE',
            ids_itens: filesId
        }

        const moveResponse = await createAxiosInstance().then(instance =>
            instance.put(`${Environments.urlFolder}/${destinationFolderId}/files`, requestData)
        )

        if (moveResponse.status === 200 || moveResponse.status === 201) {
            return moveResponse.data
        } else {
            throw new Error('Erro ao mover o arquivo')
        }
    } catch (error) {
        console.error('Erro ao mover o arquivo:', error)
        return false
    }
}

export const searchDestinatariosByQuery = async (query: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlShareDestinatarios}`, {
            params: {
                parametro: query
            }
        })
    )
    return data
}

export const shareChat = async (chatId: string) => {
    try {
        const { data } = await createAxiosInstance().then(instance =>
            instance.post(Environments.urlShareChat, {
                id_chat: chatId
            })
        )

        console.log('Resposta completa da API:', data)

        if (data && typeof data === 'object') {
            const compartilhamentoId = data.compartilhamento?.id || data.id || data.shareId
            if (compartilhamentoId) {
                return compartilhamentoId
            }
        }
        throw new Error('ID do compartilhamento não encontrado na resposta da API')
    } catch (error) {
        console.error('Erro detalhado ao compartilhar o chat:', error)
        throw error
    }
}

export const getAllSharedChats = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlSharedBySharing}`))

    return data
}

export const SharedReceived = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlSharedReceived}`))

    return data
}

export const deleteAllSharingChats = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.delete(`${Environments.urlSharedBySharing}`))

    return data
}

export const UnArchiveDeleteAll = async () => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.put(`${Environments.urlChat}/bulk-update/`, {
            arquivados: true
        })
    )

    return data
}

export const deleteSharingChat = async (id_compartilhamento: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.delete(`${Environments.urlSharedBySharing}/${id_compartilhamento}`)
    )

    return data
}

export const getSharedChatBySharingId = async (id_comparilhamento: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlSharedBySharing}/${id_comparilhamento}`)
    )
    return data
}
// TODO funcao que recebe do back o image em base64 . Obrigatorio passar os parametros abaixo
export const getImageByChatMessageImageId = async (chat_id: string, msg_id: string, imagem_id: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlChat}/${chat_id}/mensagem/${msg_id}/imagem/${imagem_id}`)
    )

    return data
}

export const continueChatBySharingId = async (id_compartilhamento: string) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.post(`${Environments.urlSharedBySharing}/${id_compartilhamento}/continue`)
    )

    return data
}

export const listChatsPaginado = async (params: any) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlChat}/`, {
            params: params
        })
    )

    return data
}

export const listAgents = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlListAgents}`))
    return data
}

export const listCategorias = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(`${Environments.urlStore}/categorias`))
    return data
}

export const listTotaisEspecialistasPorTipo = async () => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlStore}/especialistas/totais`)
    )
    return data
}

export const inserirEspecialista = async (especialista: any) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.post(Environments.urlStore + '/especialista', especialista)
    )
    return data
}

export const updateShared = async (shareId: string) => {
    await createAxiosInstance().then(instance => instance.patch(`${Environments.urlShareChat}/${shareId}`))
    return shareId
}

export const SharedSent = async () => {
    const { data } = await createAxiosInstance().then(instance => instance.get(Environments.urlSharedBySharing))
    return data
}

export const listEspecialistasPaginado = async (params: any) => {
    const { data } = await createAxiosInstance().then(instance =>
        instance.get(`${Environments.urlStore}/especialistas`, {
            params: params
        })
    )

    return data
}
