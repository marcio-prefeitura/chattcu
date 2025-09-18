import { renameChat } from '../../../infrastructure/api'
import { AxiosError } from 'axios'
import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Box } from '@mui/material'

import { IChat } from '../../../infrastructure/utils/types'
import { getSidebarTabClassName } from '../../../infrastructure/utils/util'
import { useAppTitle } from '../../../hooks/useAppTitle'
import { IUserInfo } from '../../../hooks/useUserInfo'
import useAlert from '../../../utils/AlertUtils'
import MessageToast from '../../message-toast/MessageToast'
import If from '../../operator/if'
import ShareChatModal from '../../share-chat-modal/ShareChatModal'
import HistoryContent from './HistoryContent'

interface IHistory {
    profile: IUserInfo
    isShow: boolean
    isMobile: boolean
    chatsHistory: IChat[]
    isLoading: boolean
    isSuccess: boolean
    isFetching: boolean
    activeChat: IChat | null
    setActiveChat: any
    hasMoreChats: boolean
    onChatClick: (chat: IChat | null) => void
    updateChatHistory: React.Dispatch<React.SetStateAction<IChat[]>>
    hideSidebar: () => void
    setSelectedAgent: any
    isArchive: boolean
    isAgentSelectionEnabled: boolean
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
}

const History: React.FC<IHistory> = ({
    profile,
    isMobile,
    isShow,
    chatsHistory,
    isSuccess,
    isFetching,
    onChatClick,
    hideSidebar,
    updateChatHistory,
    setSelectedAgent,
    isArchive,
    activeChat,
    isAgentSelectionEnabled,
    setIsModelLocked
}) => {
    const [agentsExpanded, setAgentsExpanded] = useState(true)
    const [fixadoExpanded, setFixadoExpanded] = useState(true)
    const [recenteExpanded, setRecenteExpanded] = useState(true)

    const [chatToBeShared, setChatToBeShared] = useState<IChat | null>(null)

    const { alert, handleAlert } = useAlert()

    const handleAppTitle = useAppTitle()

    const mutateEditChat = useMutation(
        async (chat: IChat) => await renameChat({ chat_id: chat.id, novo_nome: chat.titulo }),
        {
            onSuccess: () => {
                handleAlert('info', 'Chat renomeado')
            },
            onError: () => {
                handleAlert('error', 'Ocorreu um erro ao renomear chat')
            },
            useErrorBoundary: (error: AxiosError) => {
                const responseStatus = error.response?.status
                return responseStatus === 401 || responseStatus === 403
            }
        }
    )

    const handleNewChat = () => {
        onChatClick(null)
        handleAppTitle('ChatTCU Playground')
        hideSidebar()
    }

    const handleShowDeleteFixedModal = () => null

    const handlEditChat = async (chat: IChat) => {
        updateChatHistory(prevChats =>
            Object.values(prevChats).map(prevChat =>
                prevChat.id === chat.id ? { ...prevChat, titulo: chat.titulo, editing: false } : prevChat
            )
        )
        mutateEditChat.mutateAsync(chat)
    }

    const handleInputChange = (chatId: string, newTitle: string) => {
        updateChatHistory(prevChats =>
            prevChats.map(chat => (chat.id === chatId ? { ...chat, titulo: newTitle } : chat))
        )
    }

    const handleChatClick = (chat: IChat) => {
        onChatClick(chat)

        handleAppTitle(`ChatTCU Playground | ${chat.titulo?.toUpperCase()}`)
        hideSidebar()
    }

    const [anchorEl2, setAnchorEl2] = useState(null)

    const handleClick2 = event => {
        event.stopPropagation()
        setAnchorEl2(event.currentTarget)
    }

    const handleClose2 = () => {
        setAnchorEl2(null)
    }

    const [anchorEl, setAnchorEl] = useState(null)

    const handleClick = event => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleStartShareChat = (chat: IChat) => {
        setChatToBeShared(chat)
    }

    const handleShareChatModalClose = () => {
        setChatToBeShared(null)
    }
    return (
        <>
            <Box className={getSidebarTabClassName(isMobile, isShow)}>
                <div data-testid='share-chat-modal'>
                    <ShareChatModal
                        profile={profile}
                        chat={chatToBeShared}
                        onClose={handleShareChatModalClose}
                        open={Boolean(chatToBeShared)}
                        handleAlert={handleAlert}
                    />
                </div>
                <Box>
                    <Box className='new-sidebar__container-teste'>
                        <If test={chatsHistory && isSuccess && !isFetching}>
                            <HistoryContent
                                profile={profile}
                                anchorEl={anchorEl}
                                anchorEl2={anchorEl2}
                                agentsExpanded={agentsExpanded}
                                fixadoExpanded={fixadoExpanded}
                                handlEditChat={handlEditChat}
                                handleChatClick={handleChatClick}
                                handleClick={handleClick}
                                handleClick2={handleClick2}
                                handleClose={handleClose}
                                handleClose2={handleClose2}
                                handleInputChange={handleInputChange}
                                handleStartShareChat={handleStartShareChat}
                                handleShowDeleteFixedModal={handleShowDeleteFixedModal}
                                recenteExpanded={recenteExpanded}
                                setAgentsExpanded={setAgentsExpanded}
                                setFixadoExpanded={setFixadoExpanded}
                                setRecenteExpanded={setRecenteExpanded}
                                setSelectedAgent={setSelectedAgent}
                                isArchive={isArchive}
                                handleNewChat={handleNewChat}
                                isAgentSelectionEnabled={isAgentSelectionEnabled}
                                activeChat={activeChat}
                                setIsModelLocked={setIsModelLocked}
                            />
                        </If>
                    </Box>
                </Box>
            </Box>

            <Box
                className='new-sidebar__alert'
                data-testid='message-toast'>
                {alert && <MessageToast {...alert} />}
            </Box>
        </>
    )
}

export default History
