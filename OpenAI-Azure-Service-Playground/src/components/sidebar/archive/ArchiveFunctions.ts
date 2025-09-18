import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Filterchats, IChat } from '../../../infrastructure/utils/types'
import { apagarChat, archiveChatNew, listChatsPaginado, UnArchiveDeleteAll } from '../../../infrastructure/api'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAlert } from '../../../context/AlertContext'

export const useArchiveFunctions = (
    searchText: string,
    activeChat?: IChat | null,
    handleNewChat?: () => void | null
) => {
    const navigate = useNavigate()
    const [archiveChats, setArchiveChats] = useState<IChat[]>([])
    const [isLoadingNextPage, setIsLoadingNextPage] = useState<boolean>(false)
    const queryClient = useQueryClient()
    const { handleAlert } = useAlert()
    const [filters, setFilters] = useState<Filterchats>({
        per_page: 15,
        page: 1,
        searchText: '',
        arquivados: true
    })

    const fetchChats =
        () =>
        async ({ pageParam = 1 }) => {
            return await listChatsPaginado({ ...filters, page: pageParam })
        }
    const {
        data: archiveData,
        fetchNextPage: fetchNextArchivePage,
        hasNextPage: hasNextArchivePage,
        isFetchingNextPage: isFetchingNextArchivePage,
        isLoading: isLoadingFixedChats
    } = useInfiniteQuery(['archiveChats', filters], fetchChats(), {
        getNextPageParam: (lastPage, pages) => {
            const totalChats = lastPage.total
            const loadedChats = pages.flatMap(page => page.chats).length
            return loadedChats < totalChats ? pages.length + 1 : false
        }
    })
    const mutateDeleteChat = useMutation(async (idChat: string) => await apagarChat(idChat), {
        onSuccess: () => {
            handleAlert('info', 'Chat Excluído')
            invalidateArchived()
            if (handleNewChat) {
                handleNewChat()
            }
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao apagar chat')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const deleteChat = async (chat: IChat) => {
        mutateDeleteChat.mutateAsync(chat.id)
        setArchiveChats(prev => sortChatsByData(prev.filter(c => c.id !== chat.id)))
        setTotalArquivedChats(prev => prev - 1)
    }

    const mutateArchiveChat = useMutation(async (chat: IChat) => await archiveChatNew(chat), {
        onSuccess: data => {
            const messageMap = {
                'Chat arquivado com sucesso!': 'Chat arquivado',
                'Chat desarquivado com sucesso!': 'Chat desarquivado com sucesso'
            }

            const message = messageMap[data.mensagem] || 'Status do chat não reconhecido'
            const alertType =
                data.mensagem === 'Chat arquivado com sucesso!' || data.mensagem === 'Chat desarquivado com sucesso!'
                    ? 'info'
                    : 'warning'
            handleAlert(alertType, message)
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao arquivar chat')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const handleArchiveChat = async (chat: IChat) => {
        try {
            const response = await mutateArchiveChat.mutateAsync(chat)
            const { mensagem } = response

            if (mensagem === 'Chat arquivado com sucesso!') {
                chat.arquivado = true
                if (chat.id === activeChat?.id) {
                    if (handleNewChat) {
                        handleNewChat()
                    }
                }
                invalidateHistory()
            } else if (mensagem === 'Chat desarquivado com sucesso!') {
                chat.arquivado = false
                if (chat.id === activeChat?.id) {
                    navigate(`/chat/${chat.id}?tab=history`)
                }
                invalidateHistory()
            }
        } catch (error) {
            console.error('Error handling archive chat:', error)
            handleAlert('error', 'Ocorreu um erro ao arquivar/desarquivar o chat')
        }
    }

    const unarchiveAllArchives = async () => {
        if (archiveChats.length) {
            try {
                const { mensagem } = await UnArchiveDeleteAll()
                if (mensagem) {
                    handleAlert('success', 'Chats desarquivados com sucesso')
                    setArchiveChats(prevChats => prevChats.map(chat => ({ ...chat, arquivado: false })))
                    setTotalArquivedChats(0)
                }
            } catch {
                handleAlert('error', 'Erro ao desarquivar todos os chats')
            }
            if (handleNewChat) {
                handleNewChat()
            }
            invalidateArchived()
        }
    }

    const invalidateHistory = () => {
        queryClient.invalidateQueries(['fixedChats'])
        queryClient.invalidateQueries(['recentChats'])
    }

    const invalidateArchived = () => {
        queryClient.invalidateQueries(['archiveChats'])
    }

    useEffect(() => {
        queryClient.invalidateQueries(['archiveChats'])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (archiveData) {
            const sortedArchiveDataChats = sortChatsByData(archiveData.pages.flatMap(page => page.chats) || [])
            setArchiveChats(sortedArchiveDataChats)
        }
    }, [archiveData])

    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            searchText
        }))
    }, [searchText])

    useEffect(() => {
        setIsLoadingNextPage(isFetchingNextArchivePage || isLoadingFixedChats)
    }, [isFetchingNextArchivePage, isLoadingFixedChats])
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        if (scrollHeight - scrollTop === clientHeight) {
            const isFixed = e.currentTarget.classList.contains('sidebar__container')
            if (isFixed && hasNextArchivePage && !isFetchingNextArchivePage) {
                fetchNextArchivePage()
            }
        }
    }

    const [totalArquivedChats, setTotalArquivedChats] = useState<number>(archiveData?.pages[0]?.total || 0)

    useEffect(() => {
        setTotalArquivedChats(archiveData?.pages[0]?.total || 0)
    }, [archiveData])

    return {
        archiveChats,
        handleScroll,
        isLoadingNextPage,
        deleteChat,
        unarchiveAllArchives,
        totalArquivedChats,
        alert,
        handleArchiveChat
    }
}
const sortChatsByData = (chats: IChat[]): IChat[] => {
    const sortedChats = [...chats]

    sortedChats.sort((a, b) => {
        if (a?.data_ultima_iteracao instanceof Date && b?.data_ultima_iteracao instanceof Date) {
            return a.data_ultima_iteracao.getDate() - b.data_ultima_iteracao.getDate()
        }
        return 0
    })
    return sortedChats
}
