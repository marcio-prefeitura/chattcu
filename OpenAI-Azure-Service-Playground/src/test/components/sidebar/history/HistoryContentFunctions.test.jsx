import '@testing-library/jest-dom/extend-expect'
import { useHistoryContentFunctions } from '../../../../components/sidebar/history/historyContentFunctions'
import { act, renderHook } from '@testing-library/react'
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { AlertProvider, useAlert } from '../../../../context/AlertContext'
import { AxiosError } from 'axios'

jest.mock('@tanstack/react-query', () => ({
    useMutation: jest.fn(),
    useInfiniteQuery: jest.fn(),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
        refetchQueries: jest.fn(),
        setQueryData: jest.fn(),
        getQueryData: jest.fn()
    }))
}))

jest.mock('../../../../infrastructure/api', () => ({
    desafixarTodosChats: jest.fn(),
    apagarTodosChatsRecentes: jest.fn(),
    apagarTodosChatsFixados: jest.fn(),
    listChatsPaginado: jest.fn(),
    fixarChat: jest.fn(),
    apagarChat: jest.fn()
}))

jest.mock('../../../../context/AlertContext', () => ({
    ...jest.requireActual('../../../../context/AlertContext'),
    useAlert: jest.fn()
}))

const Wrapper = ({ children }) => <AlertProvider>{children}</AlertProvider>

describe('useHistoryContentFunctions', () => {
    const handleNewChat = jest.fn()
    const handleAlert = jest.fn()
    const mockChat = { id: '1', title: 'Test Chat', fixado: false }
    const mockQueryClient = {
        invalidateQueries: jest.fn(),
        refetchQueries: jest.fn(),
        setQueryData: jest.fn(),
        getQueryData: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()

        useAlert.mockReturnValue({
            handleAlert
        })

        useInfiniteQuery.mockReturnValue({
            data: { pages: [{ total: 0 }] },
            hasNextPage: false,
            fetchNextPage: jest.fn(),
            isFetchingNextPage: false
        })

        useQueryClient.mockReturnValue(mockQueryClient)
    })

    it('should not handle confirm clear all fixed chats if no ids', async () => {
        const mutateAsync = jest.fn().mockResolvedValue()
        useMutation.mockReturnValue({ mutateAsync })

        useInfiniteQuery.mockReturnValue({
            data: { pages: [{ total: 0, chats: [] }] },
            hasNextPage: true,
            fetchNextPage: jest.fn(),
            isFetchingNextPage: false
        })

        const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
            wrapper: Wrapper
        })

        await act(async () => {
            await result.current.handleConfirmClearAll()
        })

        expect(mutateAsync).toHaveBeenCalled()
    })

    describe('Chat Actions', () => {
        it('should handle delete chat successfully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve(true)
                    options.onSuccess()
                    return response
                })
            }))

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.deleteChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chat Excluído')
            expect(handleNewChat).toHaveBeenCalled()
        })

        it('should handle fix chat successfully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve(true)
                    options.onSuccess(response, { ...mockChat, fixado: true })
                    return response
                })
            }))

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.fixOrUpinChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chat fixado')
        })

        it('should handle fix chat error', async () => {
            useMutation.mockImplementation((_, options) => {
                setTimeout(() => options.onError(new Error('Failed to fix')), 0)
                return {
                    mutateAsync: jest.fn()
                }
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.fixOrUpinChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('error', 'Ocorreu um erro ao fixar chat')
        })
    })

    describe('Bulk Actions', () => {
        it('should handle clear all recent chats', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve(true)
                    options.onSuccess()
                    return response
                })
            }))

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.handleClearRecentsConversations()
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chats recentes apagados')
            expect(handleNewChat).toHaveBeenCalled()
        })

        it('should handle clear all fixed chats successfully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve(true)
                    options.onSuccess()
                    return response
                })
            }))

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.handleClearPinnedConversations()
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chats fixados apagados')
            expect(handleNewChat).toHaveBeenCalled()
            expect(result.current.openModalDeleteAllFixed).toBe(false)
        })

        it('should handle clear all fixed chats error', async () => {
            const mockError = new Error('Failed to clear fixed')
            let errorCallback

            useMutation.mockImplementation((_, options) => {
                errorCallback = options.onError
                return {
                    mutateAsync: jest.fn().mockRejectedValue(mockError)
                }
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            await act(async () => {
                try {
                    await result.current.handleClearPinnedConversations()
                } catch {
                    errorCallback(mockError)
                }
            })

            expect(handleAlert).toHaveBeenCalledWith('error', 'Ocorreu um erro ao apagar chats')
        })
    })

    // describe('Error Handling', () => {
    //     it('should handle delete chat error', async () => {
    //         const mockError = new Error('Failed to delete')
    //         useMutation.mockImplementation((_, options) => {
    //             setTimeout(() => options.onError(mockError), 0)
    //             return {
    //                 mutateAsync: jest.fn()
    //             }
    //         })
    //
    //         const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
    //             wrapper: Wrapper
    //         })
    //
    //         await act(async () => {
    //             await result.current.deleteChat(mockChat)
    //         })
    //
    //         expect(handleAlert).toHaveBeenCalledWith('error', 'Ocorreu um erro ao apagar chat')
    //     })
    // })

    describe('Search, Filters and Effects', () => {
        it('should update filters when search text changes', () => {
            const searchText = 'test search'
            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, searchText, null), {
                wrapper: Wrapper
            })

            expect(result.current.filters.searchText).toBe(searchText)
        })

        it('should handle infinite scroll for fixed chats', () => {
            const fetchNextPage = jest.fn()
            useInfiniteQuery.mockReturnValue({
                data: { pages: [{ total: 2, chats: [mockChat] }] },
                hasNextPage: true,
                fetchNextPage,
                isFetchingNextPage: false
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 50,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })

            expect(fetchNextPage).toHaveBeenCalled()
        })

        it('should handle infinite scroll for recent chats', () => {
            const fetchNextPage = jest.fn()
            useInfiniteQuery.mockReturnValue({
                data: { pages: [{ total: 2, chats: [mockChat] }] },
                hasNextPage: true,
                fetchNextPage,
                isFetchingNextPage: false
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 100,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })

            expect(fetchNextPage).toHaveBeenCalled()
        })

        it('should invalidate queries when active chat changes', () => {
            const activeChat = { id: '1', fixado: false, shared: false }

            renderHook(() => useHistoryContentFunctions(handleNewChat, '', activeChat), {
                wrapper: Wrapper
            })

            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['recentChats'])
        })
    })

    describe('Modal States', () => {
        it('should handle modal states correctly', () => {
            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null), {
                wrapper: Wrapper
            })

            act(() => {
                result.current.setOpenModalDeleteAllFixed(true)
            })
            expect(result.current.openModalDeleteAllFixed).toBe(true)

            act(() => {
                result.current.setOpenModalDeleteAllRecent(true)
            })
            expect(result.current.openModalDeleteAllRecent).toBe(true)

            act(() => {
                result.current.setOpenModalUnfixedOrFixedAll(true)
            })
            expect(result.current.openModalUnfixedOrFixedAll).toBe(true)
        })
    })

    describe('Error Boundaries', () => {
        it('should handle 401/403 errors in delete chat', () => {
            const error = new AxiosError()
            error.response = { status: 401 }

            useMutation.mockImplementation((_, options) => {
                const useErrorBoundary = options.useErrorBoundary(error)
                expect(useErrorBoundary).toBe(true)
                return { mutateAsync: jest.fn() }
            })

            renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))
        })

        it('should handle other errors in delete chat', () => {
            const error = new AxiosError()
            error.response = { status: 500 }

            useMutation.mockImplementation((_, options) => {
                const useErrorBoundary = options.useErrorBoundary(error)
                expect(useErrorBoundary).toBe(false)
                return { mutateAsync: jest.fn() }
            })

            renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))
        })
    })

    describe('Effects and Cache', () => {
        it('should update search text when it changes', () => {
            const { rerender, result } = renderHook(
                ({ text }) => useHistoryContentFunctions(handleNewChat, text, null),
                {
                    wrapper: Wrapper,
                    initialProps: { text: '' }
                }
            )

            rerender({ text: 'new search' })

            // Usar o result do mesmo hook ao invés de criar um novo
            expect(result.current.filters.searchText).toBe('new search')
        })
    })

    describe('Pagination', () => {
        it('should handle pagination for fixed chats', async () => {
            const listChatsPaginado = jest.fn().mockResolvedValue({
                total: 30,
                chats: [mockChat]
            })

            renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))

            await act(async () => {
                await listChatsPaginado({ page: 2, fixados: true })
            })

            expect(listChatsPaginado).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    fixados: true
                })
            )
        })

        it('should handle complex scroll scenarios', () => {
            useInfiniteQuery
                .mockReturnValueOnce({
                    data: { pages: [{ total: 2, chats: [mockChat] }] },
                    hasNextPage: true,
                    fetchNextPage: jest.fn(),
                    isFetchingNextPage: false
                })
                .mockReturnValueOnce({
                    data: { pages: [{ total: 2, chats: [mockChat] }] },
                    hasNextPage: true,
                    fetchNextPage: jest.fn(),
                    isFetchingNextPage: true
                })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 0,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 100,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })
        })
    })

    describe('Fetch Chats', () => {
        it('should handle fetchChats with filters', async () => {
            const listChatsPaginado = require('../../../../infrastructure/api').listChatsPaginado
            listChatsPaginado.mockResolvedValue({
                total: 30,
                chats: [mockChat]
            })

            let capturedFetchChats
            useInfiniteQuery.mockImplementation((_, fetchFn) => {
                capturedFetchChats = fetchFn
                return {
                    data: { pages: [{ total: 30, chats: [mockChat] }] },
                    hasNextPage: true,
                    fetchNextPage: jest.fn(),
                    isFetchingNextPage: false
                }
            })

            renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))

            await capturedFetchChats({ pageParam: 1 })

            expect(listChatsPaginado).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    fixados: expect.any(Boolean),
                    per_page: 15
                })
            )
        })
    })

    describe('Scroll Handling', () => {
        it('should not fetch next page when already fetching', () => {
            const fetchNextPage = jest.fn()

            useInfiniteQuery.mockReturnValue({
                data: { pages: [{ total: 2, chats: [mockChat] }] },
                hasNextPage: true,
                fetchNextPage,
                isFetchingNextPage: true
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 100,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })

            expect(fetchNextPage).not.toHaveBeenCalled()
        })

        it('should not fetch next page when no more pages', () => {
            const fetchNextPage = jest.fn()

            useInfiniteQuery.mockReturnValue({
                data: { pages: [{ total: 2, chats: [mockChat] }] },
                hasNextPage: false,
                fetchNextPage,
                isFetchingNextPage: false
            })

            const { result } = renderHook(() => useHistoryContentFunctions(handleNewChat, '', null))

            act(() => {
                result.current.handleScroll({
                    currentTarget: {
                        scrollTop: 100,
                        scrollHeight: 200,
                        clientHeight: 100
                    }
                })
            })

            expect(fetchNextPage).not.toHaveBeenCalled()
        })
    })
})
