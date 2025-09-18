import {
    continueChatBySharingId,
    listAgents,
    listArchive,
    listChatMessages,
    listChats,
    getSharedChatBySharingId
} from '../../infrastructure/api'
import { AxiosError } from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'

import { Box, CssBaseline, Drawer, useMediaQuery, useTheme } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useArchiveFunctions } from '../../components/sidebar/archive/ArchiveFunctions'
import { atualizaAgenteSelecionadoNoCache, getAgentByValue } from '../../components/sidebar/history/AgentAccordion'
import GptStoreContent from '../../components/sidebar/store/GptStoreContent'
import ChatBox from '../../components/chat-box/ChatBox'
import Header from '../../components/layout/Header'
import MessageToast from '../../components/message-toast/MessageToast'
import If from '../../components/operator/if'
import ShareChatModal from '../../components/share-chat-modal/ShareChatModal'
import NewSidebar from '../../components/sidebar/NewSidebar'
import { IChat, ISharedChat } from '../../infrastructure/utils/types'
import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { InTeamsContext } from '../../context/AppContext'
import { useAppTitle } from '../../hooks/useAppTitle'
import useChat from '../../hooks/useChat'
import { useUserInfo } from '../../hooks/useUserInfo'
import useAlert from '../../utils/AlertUtils'

interface ChatPageProps {
    toggleDarkMode: any
    darkMode: boolean
}

interface AgentModel {
    labelAgente: string
    valueAgente: string | undefined
    selected: boolean
    quebraGelo: string[]
    autor: string
    descricao: string
    icon: any
}

const ChatPage: React.FC<ChatPageProps> = ({ toggleDarkMode, darkMode }) => {
    const inTeams = useContext(InTeamsContext)
    const { alert, handleAlert } = useAlert()
    const [chatsHistory, setChatsHistory] = useState<IChat[]>([])
    const queryClient = useQueryClient()

    const location = useLocation()
    const isShared = location.pathname.includes('share')

    const chatRef = useRef<IChat>({} as IChat)
    const chatHandler = useChat()

    const [activeChat, setActiveChat] = useState<IChat | null>(null)
    const [selectedAgent, setSelectedAgent] = useState<AgentModel | undefined>(getAgentByValue(queryClient, null))

    const [isShowSidebar, setIsShowSidebar] = useState(false)
    const [isShowDesktopSidebar, setIsShowDesktopSidebar] = useState(true)
    const [cachedChats, setCachedChats] = useState<IChat[]>([])
    const [chatId, setChatId] = useState<string>('')
    const [updatedFoldersFromChipsActions, setUpdatedFoldersFromChipsActions] = useState<any[]>([])
    const [filesSelected, setFilesSelected] = useState<ISelectedFiles[]>([])
    const [isAgentSelectionEnabled, setIsAgentSelectionEnabled] = useState(true)
    const [openShareModal, setOpenShareModal] = useState(false)
    const [chatToShare, setChatToShare] = useState<IChat | null>(null)

    const [isModelLocked, setIsModelLocked] = useState(false)

    const theme = useTheme()
    const isTelaMedia = useMediaQuery(theme.breakpoints.down('md'))
    const isTelaGrande = useMediaQuery('(min-width:1367px)')

    const handleAppTitle = useAppTitle()

    const profile = useUserInfo()

    const defaultWidth = 400
    const largeWidth = 500
    const drawerWidth = profile?.perfilDev && isTelaGrande ? largeWidth : defaultWidth

    const [redirectForm, setRedirectForm] = useState(false)

    const { isLoading, isSuccess, isFetching } = useQuery(['chatHistory'], listChats, {
        onError: () => handleAlert('error', 'Ocorreu um erro ao listar o chat'),
        onSuccess: data => {
            setChatsHistory(data)
        },
        staleTime: Infinity, //5 min
        cacheTime: Infinity,
        refetchOnWindowFocus: false
    })

    useQuery(['agents'], listAgents, {
        onSuccess: async data => {
            data?.forEach(agente => {
                if (!agente.valueAgente) {
                    agente.selected = true
                }
            })
            setSelectedAgent(data?.find(agente => agente.selected))
        },
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false
    })

    const navigate = useNavigate()
    const { chat_id } = useParams()

    // por motivo de bloqueio na rota do EntraID, rota somente estática.
    const [searchParams] = useSearchParams()
    const share_id = searchParams.get('share_id')

    const onUnArchiveChat = async (chat: IChat | null) => {
        if (chat) {
            await handleArchiveChat(chat)
            chat.arquivado = false
            setActiveChatByRoute(chat.id)
            setChatsHistory(prevChats => {
                const chatsArray = Object.values(prevChats)
                return [chat, ...chatsArray]
            })
            return navigate('/')
        }
    }

    const mutateContinueChat = useMutation(async (shareId: string) => await continueChatBySharingId(shareId), {
        onSuccess: async data => {
            handleAlert('info', 'Chat continuado')

            if (data?.id) {
                navigate(`/chat/${data.id}?tab=history`)

                setActiveChatByRoute(data.id)
                setChatsHistory(prevChats => {
                    return [data, ...(Array.isArray(prevChats) ? prevChats : [])]
                })
                await queryClient.invalidateQueries(['listFolders'])
            } else {
                handleAlert('error', 'Ocorreu um erro ao continuar o chat')
            }
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao continuar o chat')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const getChatByIdQuery = useQuery(
        ['cachedChats', chatId],
        async () => {
            if (chatId) {
                if (!isShared) return await listChatMessages(chatId)
                else {
                    const compart = await getSharedChatBySharingId(chatId)
                    compart.chat.shared = true
                    return compart.chat
                }
            }
            return null
        },
        {
            onSuccess: data => {
                if (data) {
                    setActiveChat(data)
                    setCachedChats(prev => [...prev, data])
                }
            },
            onError: () => {
                const isHome = !location.pathname.includes('chat')

                if (isShared || isHome) {
                    handleAlert('error', 'Este link foi revogado')
                    navigate('/')
                } else {
                    handleAlert('error', 'Ocorreu um erro ao listar o chat')
                }
            },
            staleTime: 0,
            cacheTime: 0,
            refetchOnWindowFocus: false,
            retry: false
        }
    )

    useEffect(() => {
        if (searchParams.get('tab') === 'store') {
            setRedirectForm(false)
        }
        setIsAgentSelectionEnabled(!activeChat?.isLoading)

        if (activeChat?.modelo_selecionado?.startsWith('o1')) {
            const agentDefault = getAgentByValue(queryClient, 'CONHECIMENTOGERAL')
            setSelectedAgent(agentDefault)
            setIsModelLocked(true)
        }
    }, [
        activeChat?.isLoading,
        activeChat?.modelo_selecionado,
        queryClient,
        setSelectedAgent,
        setIsModelLocked,
        searchParams
    ])

    useEffect(() => {
        if (activeChat) return setChatRef(activeChat)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat])

    useEffect(() => {
        if (chatId) {
            fetchChat()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId])

    useEffect(() => {
        if (chat_id) {
            setChatId(chat_id)
        }

        if (share_id) {
            setChatId(share_id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat_id, share_id])

    useEffect(() => {
        const isO1Model = activeChat?.modelo_selecionado?.startsWith('o1')

        if (isO1Model && activeChat?.isStreamActive) {
            const agentDefault = getAgentByValue(queryClient, 'CONHECIMENTOGERAL')
            setSelectedAgent(agentDefault)
            setIsModelLocked(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat?.isStreamActive, activeChat?.modelo_selecionado])

    const initNewChat = (newChat: IChat | null) => {
        setActiveChat(newChat)
        if (newChat) {
            setCachedChats(prevChats => {
                const chatsArray = Object.values(prevChats)
                return [newChat, ...chatsArray]
            })
            setChatsHistory(prevChats => {
                const chatsArray = Object.values(prevChats)
                return [newChat, ...chatsArray]
            })
        }
    }
    const updateChatStream = (updatedChat: IChat) => {
        updateCachedChats(updatedChat)
        handleAppTitle(`ChatTCU Playground | ${updatedChat.titulo?.toUpperCase()}`)
        if (!updatedChat.isStreamActive) {
            handleSetActiveChat(updatedChat)
            updateChatHistorys(updatedChat)
        }
    }

    const updateChatHistorys = (updatedChat: IChat) => {
        setChatsHistory(prevChats => {
            const updatedChats = Object.values(prevChats).map(chat => {
                chatHandler.set(chat)
                return chatHandler.isChatById(updatedChat) || chatHandler.isChatByTempChatId(updatedChat)
                    ? updatedChat
                    : chat
            })
            return updatedChats
        })
    }

    const updateCachedChats = (updatedChat: IChat) => {
        setCachedChats(cachedChats => {
            return cachedChats.map(chat => {
                chatHandler.set(chat)
                return chatHandler.isChatById(updatedChat) || chatHandler.isChatByTempChatId(updatedChat)
                    ? updatedChat
                    : chat
            })
        })
    }

    const handleSetActiveChat = (chatUpdated: IChat) => {
        if (!chatUpdated) return
        chatHandler.set(chatRef.current)
        if (chatHandler.isChatById(chatUpdated) || chatHandler.isChatByTempChatId(chatUpdated)) {
            setActiveChat(() => {
                return chatUpdated
            })
            handleAppTitle(`ChatTCU Playground | ${chatUpdated.titulo?.toUpperCase()}`)
        }
    }

    const handleMenuButtonClick = () => {
        if (isTelaMedia) {
            setIsShowSidebar(prev => !prev)
        } else {
            setIsShowDesktopSidebar(prev => !prev)
        }
    }

    const handleClikShowSidebar = () => {
        if (isTelaMedia) {
            setIsShowSidebar(false)
        }
    }

    const handleClickShowSidebarOrTabSwitcher = (showSidebar: boolean) => {
        setIsShowDesktopSidebar(showSidebar)
        setIsShowSidebar(showSidebar)
    }

    const openChatUrl = async (chat: IChat | null) => {
        let path = '/'

        if (inTeams && chat) {
            if (chat.arquivado) path = '?tab=archive'

            setActiveChatByRoute(chat.id)
        } else if (chat) {
            path = `/chat/${getChatIdOrTempChatId(chat)}`

            if (chat.arquivado) path += '?tab=archive'
        } else {
            const defaultAgent = getAgentByValue(queryClient, null)

            setActiveChat(null)
            atualizaAgenteSelecionadoNoCache(queryClient, defaultAgent)
            setSelectedAgent(defaultAgent)
            setFilesSelected([])
            await queryClient.invalidateQueries(['modelChats'])
            await queryClient.invalidateQueries(['listFolders'])
        }

        navigate(path)
    }

    const getChatIdOrTempChatId = (chat: IChat) => {
        const isChatById = chat.id ? chat.id : null
        if (isChatById) {
            return chat.id
        }

        return chat.temp_chat_id
    }

    const setActiveChatByRoute = async (id: string) => {
        const cachedChat = getChachedChatByIdOrTempChatId(id)
        setChatId(id)
        if (cachedChat) {
            setActiveChat(cachedChat)
        }
    }

    const setChatRef = (chat: IChat) => {
        chatRef.current = chat
    }

    const fetchChat = async () => {
        if (chatId) {
            await queryClient.invalidateQueries(['cachedChats', chatId])
            getChatByIdQuery.refetch()
        }
    }

    const getChachedChatByIdOrTempChatId = (id: string) => {
        const chatById = cachedChats.find(cachedChat => cachedChat.id === id)

        if (chatById) return chatById

        return cachedChats.find(cachedChat => cachedChat.temp_chat_id === id)
    }

    const handleSharedChatSelect = (sharedChat: ISharedChat) => {
        navigate(`/share?share_id=${sharedChat.id}&tab=share`)
    }

    const handleGoToOriginalChat = async (chat: IChat | null) => {
        if (!chat) {
            return
        }

        const { id: chatId } = chat

        const arquivados = await listArchive()

        if (!arquivados) {
            navigate(`/chat/${chatId}?tab=history`)
        }
        const isArquivado = arquivados.find(a => a.id === chatId)

        // Verificamos se o chat esta arquivado.
        if (isArquivado) {
            navigate(`/chat/${chatId}?tab=archive`)
        } else {
            navigate(`/chat/${chatId}?tab=history`)
        }
    }

    const handleContinueConversation = async (shareId: string | null | undefined) => {
        if (!shareId) {
            return
        }

        await mutateContinueChat.mutateAsync(shareId)
    }

    const handleStartShareChat = (chat: IChat) => {
        setChatToShare(chat)
        setOpenShareModal(true)
    }
    const { handleArchiveChat } = useArchiveFunctions('', activeChat)

    const sidebar = () => {
        return (
            <NewSidebar
                profile={profile}
                isShow={isShowSidebar || !isTelaMedia}
                isMobile={isTelaMedia}
                chatsHistory={chatsHistory}
                isLoading={isLoading}
                isSuccess={isSuccess}
                isFetching={isFetching}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
                onChatClick={openChatUrl}
                updateChatHistory={setChatsHistory}
                hideSidebar={handleClikShowSidebar}
                hasMoreChats={true}
                updatedFoldersFromChipsActions={updatedFoldersFromChipsActions}
                filesSelected={filesSelected}
                setFilesSelected={setFilesSelected}
                onAlert={handleAlert}
                onClickShowSidebar={handleClickShowSidebarOrTabSwitcher}
                onSharedChatSelect={handleSharedChatSelect}
                onUnArchiveChat={onUnArchiveChat}
                setSelectedAgent={setSelectedAgent}
                selectedAgent={selectedAgent}
                isArchive={activeChat?.arquivado || isShared}
                setIsModelLocked={setIsModelLocked}
                isAgentSelectionEnabled={isAgentSelectionEnabled}
                setRedirectForm={setRedirectForm}
            />
        )
    }

    return (
        <>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <Header
                    onClickShowSidebar={handleMenuButtonClick}
                    profile={profile}
                    toggleDarkMode={toggleDarkMode}
                    darkMode={darkMode}
                />
                <Box
                    component='nav'
                    sx={{
                        width: { md: isShowDesktopSidebar ? drawerWidth : 0 },
                        transition: 'all 250ms ease-in',
                        flexShrink: { md: 0 }
                    }}>
                    <Drawer
                        variant='temporary'
                        data-testid='drawer-temporary'
                        open={isShowSidebar}
                        onClose={handleClikShowSidebar}
                        ModalProps={{
                            keepMounted: true
                        }}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                        }}>
                        {sidebar()}
                    </Drawer>
                    <If test={!isTelaMedia}>
                        <Drawer
                            variant='permanent'
                            data-testid='drawer-permanent'
                            open={isShowDesktopSidebar}
                            sx={{
                                '& .MuiDrawer-paper': {
                                    boxSizing: 'border-box',
                                    width: isShowDesktopSidebar ? drawerWidth : 70,
                                    transition: 'all 250ms ease-in',
                                    border: 'none'
                                }
                            }}>
                            {sidebar()}
                        </Drawer>
                    </If>
                </Box>
                <Box
                    component='main'
                    data-testid='chatbox-area'
                    width='100%'>
                    {searchParams.get('tab') === 'store' ? (
                        <GptStoreContent
                            profile={profile}
                            isShow={isShowDesktopSidebar} // usando o estado existente da sidebar desktop
                            isMobile={isTelaMedia}
                            redirectForm={redirectForm}
                            setRedirectForm={setRedirectForm}
                        />
                    ) : (
                        <ChatBox
                            profile={profile}
                            activeChat={activeChat}
                            onInitNewChat={initNewChat}
                            updateChatStream={updateChatStream}
                            setUpdatedFoldersFromChipsActions={setUpdatedFoldersFromChipsActions}
                            filesSelected={filesSelected}
                            setFilesSelected={setFilesSelected}
                            onUnArchiveChat={onUnArchiveChat}
                            onAlert={handleAlert}
                            setActiveChat={setActiveChat}
                            setSelectedAgent={setSelectedAgent}
                            selectedAgent={selectedAgent}
                            isSharedChat={isShared}
                            isModelLocked={isModelLocked}
                            setIsModelLocked={setIsModelLocked}
                            shareId={share_id}
                            onGoToOriginalChat={handleGoToOriginalChat}
                            onContinueConversation={handleContinueConversation}
                            handleStartShareChat={handleStartShareChat}
                            handleClikShowSidebar={handleClikShowSidebar}
                        />
                    )}
                </Box>
            </Box>
            <ShareChatModal
                data-testid='share-chat-modal'
                profile={profile}
                chat={chatToShare}
                open={openShareModal}
                onClose={() => {
                    setOpenShareModal(false)
                    setChatToShare(null)
                }}
                handleAlert={handleAlert}
            />

            {alert && <MessageToast {...alert} />}
        </>
    )
}

export default ChatPage
