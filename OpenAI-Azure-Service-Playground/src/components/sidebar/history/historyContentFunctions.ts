// src/components/sidebar/history/historyContentFunctions.ts

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Filterchats, IChat } from '../../../infrastructure/utils/types'
import {
    apagarChat,
    apagarTodosChatsFixados,
    apagarTodosChatsRecentes,
    desafixarTodosChats,
    fixarChat,
    listChatsPaginado
} from '../../../infrastructure/api'
import { useAlert } from '../../../context/AlertContext'

export const useHistoryContentFunctions = (handleNewChat: () => void, searchText: string, activeChat: IChat | null) => {
    const [openModalDeleteAllFixed, setOpenModalDeleteAllFixed] = useState<boolean>(false)
    const [openModalDeleteAllRecent, setOpenModalDeleteAllRecent] = useState<boolean>(false)
    const [openModalUnfixedOrFixedAll, setOpenModalUnfixedOrFixedAll] = useState<boolean>(false)
    const queryClient = useQueryClient()
    const { handleAlert } = useAlert()

    const [filters, setFilters] = useState<Filterchats>({
        per_page: 15,
        page: 1,
        fixados: false,
        searchText: '',
        arquivados: false
    })

    const invalidateAndRefetchChats = () => {
        queryClient.invalidateQueries(['fixedChats'])
        queryClient.invalidateQueries(['recentChats'])
        refetchChats()
    }
    const refetchChats = () => {
        queryClient.refetchQueries(['fixedChats'])
        queryClient.refetchQueries(['recentChats'])
    }

    const mutateDeleteChat = useMutation(async (chat_id: string) => await apagarChat(chat_id), {
        onSuccess: () => {
            handleAlert('info', 'Chat Excluído')
            invalidateAndRefetchChats()
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
        console.log('deleteChat no historyContentFunctions')
        mutateDeleteChat.mutateAsync(chat.id)
        handleNewChat()
    }

    const mutateFixChatOnTop = useMutation((chat: IChat) => fixarChat(chat), {
        onSuccess: (data, chat) => {
            if (data && chat.fixado) {
                handleAlert('info', 'Chat fixado')
            } else {
                handleAlert('info', 'Chat desafixado')
            }
            invalidateAndRefetchChats()
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao fixar chat')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateDesafixarAllChats = useMutation(async () => await desafixarTodosChats(), {
        onSuccess: () => {
            handleNewChat()
            handleAlert('info', 'Chats fixados limpados')
            invalidateAndRefetchChats()
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao desafixar chats')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateClearAllRecentsChats = useMutation(async () => await apagarTodosChatsRecentes(), {
        onSuccess: () => {
            handleNewChat()
            handleAlert('info', 'Chats recentes apagados')
            invalidateAndRefetchChats()
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao apagar chats')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateClearAllFixedsChats = useMutation(async () => await apagarTodosChatsFixados(), {
        onSuccess: () => {
            handleNewChat()
            handleAlert('info', 'Chats fixados apagados')
            invalidateAndRefetchChats()
        },
        onError: () => {
            handleAlert('error', 'Ocorreu um erro ao apagar chats')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const fetchChats =
        (isFixed: boolean) =>
        async ({ pageParam = 1 }) => {
            return await listChatsPaginado({ ...filters, page: pageParam, fixados: isFixed })
        }
    const {
        data: fixedData,
        fetchNextPage: fetchNextFixedPage,
        hasNextPage: hasNextFixedPage,
        isFetchingNextPage: isFetchingNextFixedPage,
        isLoading: isLoadingFixedChats
    } = useInfiniteQuery(['fixedChats', filters], fetchChats(true), {
        getNextPageParam: (lastPage, pages) => {
            const totalChats = lastPage.total
            const loadedChats = pages.flatMap(page => page.chats).filter(chat => chat !== undefined).length
            return loadedChats < totalChats ? pages.length + 1 : false
        }
    })

    const {
        data: recentData,
        fetchNextPage: fetchNextRecentPage,
        hasNextPage: hasNextRecentPage,
        isFetchingNextPage: isFetchingNextRecentPage,
        isLoading: isLoadingRecentChats
    } = useInfiniteQuery(['recentChats', filters], fetchChats(false), {
        getNextPageParam: (lastPage, pages) => {
            const totalChats = lastPage.total
            const loadedChats = pages.flatMap(page => page.chats).filter(chat => chat !== undefined).length
            return loadedChats < totalChats ? pages.length + 1 : false
        }
    })

    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            searchText
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText])

    useEffect(() => {
        if (activeChat?.id && !activeChat?.fixado && !activeChat?.shared) {
            queryClient.invalidateQueries(['recentChats'])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        if (hasNextFixedPage && !isFetchingNextFixedPage) {
            fetchNextFixedPage()
        }
        if (scrollHeight - scrollTop === clientHeight) {
            if (hasNextRecentPage && !isFetchingNextRecentPage) {
                fetchNextRecentPage()
            }
        }
    }

    const fixOrUpinChat = async (chat: IChat) => {
        chat.fixado = !chat.fixado
        await mutateFixChatOnTop.mutateAsync(chat)
    }

    const handleConfirmClearAll = async () => {
        await mutateDesafixarAllChats.mutateAsync()
        setOpenModalUnfixedOrFixedAll(false)
    }

    const handleClearPinnedConversations = async () => {
        setOpenModalDeleteAllFixed(false)
        await mutateClearAllFixedsChats.mutateAsync()
    }

    const handleClearRecentsConversations = async () => {
        await mutateClearAllRecentsChats.mutateAsync()
        setOpenModalDeleteAllRecent(false)
    }

    return {
        openModalDeleteAllFixed,
        setOpenModalDeleteAllFixed,
        openModalDeleteAllRecent,
        setOpenModalDeleteAllRecent,
        openModalUnfixedOrFixedAll,
        setOpenModalUnfixedOrFixedAll,
        filters,
        setFilters,
        handleScroll,
        fixOrUpinChat,
        deleteChat,
        handleConfirmClearAll,
        handleClearPinnedConversations,
        handleClearRecentsConversations,
        fixedData,
        recentData,
        alert,
        isLoadingRecentChats,
        isLoadingFixedChats,
        isFetchingNextFixedPage,
        isFetchingNextRecentPage
    }
}
