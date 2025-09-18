import { useMutation } from '@tanstack/react-query'
import { listChatMessages } from '../infrastructure/api'
import { AlertColor } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { IChat } from '../infrastructure/utils/types'

export const useFetchChat = (
    handleAlert: (severity: AlertColor | undefined, MessageToast: string, duration?: number) => void,
    chatsHistory: IChat[]
) => {
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async (chatId: string) => {
            const response = await listChatMessages(chatId)
            return response
        },
        onSuccess: originalChat => {
            const chatExists = chatsHistory.some(chat => chat.id === originalChat?.id)

            if (originalChat && chatExists) {
                // handleAlert('info', 'Chat original encontrado', 3000)
                navigate(`/chat/${originalChat.id}`)
                return { found: true, chat: originalChat }
            } else {
                //handleAlert('info', 'O chat original foi excluído ou não está no histórico.')
                return { found: false, chat: null }
            }
        },
        onError: () => {
            handleAlert('error', 'Erro ao carregar o chat original. Por favor, tente novamente.')
            return { found: false, chat: null }
        }
    })
}
