import { useRef } from 'react'

import { IChat, IMessageHistory } from '../infrastructure/utils/types'

const useChat = () => {
    const chatRef = useRef<IChat>({} as IChat)

    const countWords = (textoDigitado: string) => {
        const palavras = textoDigitado.trim().split(/\s+/)
        return textoDigitado.trim().length > 0 ? palavras.length : 0
    }

    const methods = {
        isValidChat: (): boolean => {
            return chatRef.current && Object.keys(chatRef.current).length > 0
        },

        set: (updatedChat: IChat) => {
            chatRef.current = updatedChat
            return methods
        },

        get: (): IChat => {
            return chatRef.current
        },

        setId: (id: string) => {
            chatRef.current = { ...chatRef.current, id }
            return methods
        },

        setTempChatId: (temp_chat_id: string) => {
            chatRef.current = { ...chatRef.current, temp_chat_id }
            return methods
        },

        setTitulo: (titulo: string) => {
            chatRef.current = { ...chatRef.current, titulo }
            return methods
        },

        setLoading: (isLoading: boolean) => {
            chatRef.current = { ...chatRef.current, isLoading }
            return methods
        },

        setLastMessageToChat: (message: IMessageHistory) => {
            chatRef.current = {
                ...chatRef.current,
                mensagens: [...(chatRef.current.mensagens || []), message]
            }
            return methods
        },

        setCodigoPrompt: (codigoPrompt: string) => {
            if (chatRef.current.mensagens && chatRef.current.mensagens.length >= 2) {
                const messageIndex = chatRef.current.mensagens.length - 2
                const updatedMensagens = [...chatRef.current.mensagens]
                updatedMensagens[messageIndex] = {
                    ...updatedMensagens[messageIndex],
                    codigo_prompt: codigoPrompt
                }
                chatRef.current = { ...chatRef.current, mensagens: updatedMensagens }
            }
            return methods
        },

        isChatById: (updatedChat: IChat): boolean => {
            return chatRef.current && chatRef.current.id === updatedChat?.id && updatedChat?.id !== ''
        },

        isChatByTempChatId: (updatedChat: IChat): boolean => {
            if (!updatedChat.temp_chat_id) return false
            return (
                chatRef.current &&
                chatRef.current.temp_chat_id === updatedChat?.temp_chat_id &&
                updatedChat?.temp_chat_id !== ''
            )
        },

        getTokens: (): number => {
            if (chatRef.current && chatRef.current.mensagens) {
                return chatRef.current.mensagens.reduce((count, mensagem) => {
                    chatRef.current.numWords = count + countWords(mensagem.conteudo)
                    return chatRef.current.numWords
                }, 0)
            }
            return 0
        },

        isStreaming: (): boolean => {
            return chatRef.current && chatRef.current.isStreamActive ? true : false
        },

        isLoading: (): boolean => {
            return chatRef.current && chatRef.current.isLoading ? true : false
        }
    }

    return methods
}

export default useChat
