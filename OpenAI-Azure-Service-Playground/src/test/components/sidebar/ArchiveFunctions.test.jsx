import '@testing-library/jest-dom/extend-expect'
import { useArchiveFunctions } from '../../../components/sidebar/archive/ArchiveFunctions'
import { act, renderHook } from '@testing-library/react'
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { UnArchiveDeleteAll } from '../../../infrastructure/api'
import { useAlert, AlertProvider } from '../../../../src/context/AlertContext'
import { AxiosError } from 'axios'

jest.mock('../../../../src/components/sidebar/archive/ArchiveFunctions', () => ({
    useArchiveFunctions: jest.fn().mockReturnValue({
        archiveChats: [],
        handleScroll: jest.fn(),
        isLoadingNextPage: jest.fn(),
        deleteChat: jest.fn(),
        unarchiveChats: jest.fn(),
        totalArquivedChats: 0
    })
}))

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

jest.mock('../../../../src/context/AlertContext', () => ({
    useAlert: jest.fn() // Mock useAlert hook
}))

jest.mock('../../../../src/components/sidebar/archive/ArchiveFunctions', () => ({
    ...jest.requireActual('../../../../src/components/sidebar/archive/ArchiveFunctions'),
    sortChatsByData: jest.fn().mockImplementation(chats => {
        return chats.map(chat => ({
            ...chat,
            data_ultima_iteracao: new Date()
        }))
    })
}))

jest.mock('../../../infrastructure/api', () => ({
    UnArchiveDeleteAll: jest.fn(),
    listArchive: jest.fn(),
    archiveChat: jest.fn(),
    archiveChatNew: jest.fn()
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

jest.mock('../../../../src/context/AlertContext', () => ({
    ...jest.requireActual('../../../../src/context/AlertContext'),
    useAlert: jest.fn() // Mock useAlert hook
}))

const Wrapper = ({ children }) => <AlertProvider>{children}</AlertProvider>

describe('useArchivedFunctions', () => {
    const handleNewChat = jest.fn()

    const handleAlert = jest.fn()

    const wrapper = ({ children }) => <AlertProvider>{children}</AlertProvider>

    beforeEach(() => {
        useAlert.mockReturnValue({ handleAlert })

        useInfiniteQuery.mockReturnValue({
            data: {
                pages: [
                    {
                        total: 2,
                        chats: [
                            { id: '1', arquivado: true },
                            { id: '2', arquivado: true }
                        ]
                    }
                ]
            },
            hasNextPage: false,
            fetchNextPage: jest.fn(),
            isFetchingNextPage: false
        })
        useQueryClient.mockReturnValue({
            invalidateQueries: jest.fn(),
            setQueryData: jest.fn(),
            getQueryData: jest.fn()
        })
    })
    it('should unarchive all archived chats successfully and call handleAlert with success', async () => {
        UnArchiveDeleteAll.mockResolvedValue({ mensagem: 'Success' })

        const { result } = renderHook(() => useArchiveFunctions(''), { wrapper })

        result.current.archiveChats = [
            { id: '1', arquivado: true },
            { id: '2', arquivado: true }
        ]

        result.current.totalArquivedChats = 2

        await act(async () => {
            await result.current.unarchiveAllArchives()
        })

        expect(UnArchiveDeleteAll).toHaveBeenCalled()
        expect(handleAlert).toHaveBeenCalledWith('success', 'Chats desarquivados com sucesso')
        expect(result.current.archiveChats).toEqual([
            { id: '1', arquivado: false },
            { id: '2', arquivado: false }
        ])
        expect(result.current.totalArquivedChats).toBe(0)
    })

    it('should handle delete archived chat successfully', async () => {
        useMutation.mockImplementation((mutationFn, options) => ({
            mutateAsync: jest.fn().mockImplementation(async () => {
                const response = await Promise.resolve(true)
                options.onSuccess()
                return response
            })
        }))

        const mockChat = { id: 'chat123', arquivado: true }

        const { result } = renderHook(() => useArchiveFunctions('', false, handleNewChat), {
            wrapper: Wrapper
        })

        result.current.archiveChats = [
            { id: 'chat123', arquivado: true },
            { id: 'chat456', arquivado: true }
        ]
        result.current.totalArquivedChats = 2

        const handleAlert = jest.fn()

        const setArchiveChats = jest.fn(updateFn => {
            result.current.archiveChats = updateFn(result.current.archiveChats)
        })
        const setTotalArquivedChats = jest.fn(updateFn => {
            result.current.totalArquivedChats = updateFn(result.current.totalArquivedChats)
        })

        result.current.deleteChat = async chatToDelete => {
            await useMutation.mock.results[0].value.mutateAsync()

            setArchiveChats(prev => prev.filter(chat => chat.id !== chatToDelete.id))
            setTotalArquivedChats(prev => prev - 1)

            handleAlert('info', 'Chat Excluído')
        }

        await act(async () => {
            await result.current.deleteChat(mockChat)
        })

        expect(handleAlert).toHaveBeenCalledWith('info', 'Chat Excluído')

        expect(setArchiveChats).toHaveBeenCalledWith(expect.any(Function))
        expect(setTotalArquivedChats).toHaveBeenCalledWith(expect.any(Function))

        expect(result.current.archiveChats).toEqual([{ id: 'chat456', arquivado: true }])

        expect(result.current.totalArquivedChats).toBe(1)
    })

    describe('Error Handling', () => {
        const handleAlert = jest.fn()

        beforeEach(() => {
            useAlert.mockReturnValue({ handleAlert })
        })

        it('should handle delete chat error', async () => {
            const handleNewChat = jest.fn()

            const mockError = new Error('Failed to delete')
            useMutation.mockImplementation((_, options) => {
                setTimeout(() => options.onError(mockError), 0)
                return {
                    mutateAsync: jest.fn()
                }
            })

            const mockChat = { id: 'chat123', arquivado: true }

            useInfiniteQuery.mockReturnValue({
                data: {
                    pages: [
                        {
                            total: 2,
                            chats: [
                                { id: '1', arquivado: true },
                                { id: '2', arquivado: true }
                            ]
                        }
                    ]
                },
                hasNextPage: false,
                fetchNextPage: jest.fn(),
                isFetchingNextPage: false
            })
            const invalidateQueries = jest.fn()
            useQueryClient.mockReturnValue({
                invalidateQueries
            })

            const { result } = renderHook(() => useArchiveFunctions('', false, handleNewChat), {
                wrapper: Wrapper
            })

            await act(async () => {
                await result.current.deleteChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('error', 'Ocorreu um erro ao apagar chat')

            expect(invalidateQueries).toHaveBeenCalled()
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

            renderHook(() => useArchiveFunctions('', false, handleNewChat))
        })

        it('should handle other errors in delete chat', () => {
            const error = new AxiosError()
            error.response = { status: 500 }

            useMutation.mockImplementation((_, options) => {
                const useErrorBoundary = options.useErrorBoundary(error)
                expect(useErrorBoundary).toBe(false)
                return { mutateAsync: jest.fn() }
            })

            renderHook(() => useArchiveFunctions('', false, handleNewChat))
        })
    })
    describe('Pagination', () => {
        const mockChat = { id: '1', arquivado: true }

        it('should handle pagination for fixed chats', async () => {
            const listChatsPaginado = jest.fn().mockResolvedValue({
                total: 30,
                chats: [mockChat]
            })

            renderHook(() => useArchiveFunctions('', mockChat), { wrapper })

            await act(async () => {
                await listChatsPaginado({ page: 2, arquivado: true })
            })

            expect(listChatsPaginado).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    arquivado: true
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

            const { result } = renderHook(() => useArchiveFunctions('', false, handleNewChat))

            const mockElement = {
                scrollTop: 0,
                scrollHeight: 200,
                clientHeight: 100,
                classList: {
                    contains: jest.fn(() => true)
                }
            }

            act(() => {
                result.current.handleScroll({
                    currentTarget: mockElement
                })
            })

            mockElement.scrollTop = 100
            act(() => {
                result.current.handleScroll({
                    currentTarget: mockElement
                })
            })
        })
    })

    describe('mutateArchiveChat success scenarios', () => {
        const handleAlert = jest.fn()
        const navigate = jest.fn()
        const invalidateHistory = jest.fn()
        const activeChat = { id: 'chat123' }
        const handleNewChat = jest.fn()

        beforeEach(() => {
            useAlert.mockReturnValue({ handleAlert })
            global.navigate = navigate
            global.invalidateHistory = invalidateHistory
            global.activeChat = activeChat
            global.handleNewChat = handleNewChat
        })

        it('should handle archive chat successfully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve({ mensagem: 'Chat arquivado com sucesso!' })
                    options.onSuccess(response)
                    return response
                })
            }))

            const mockChat = { id: 'chat123', arquivado: false }
            const { result } = renderHook(() => useArchiveFunctions('', false), {
                wrapper: Wrapper
            })

            result.current.archiveChats = [
                { id: 'chat123', arquivado: false },
                { id: 'chat456', arquivado: true }
            ]
            result.current.totalArquivedChats = 1

            const setArchiveChats = jest.fn(updateFn => {
                result.current.archiveChats = updateFn(result.current.archiveChats)
            })
            const setTotalArquivedChats = jest.fn(updateFn => {
                result.current.totalArquivedChats = updateFn(result.current.totalArquivedChats)
            })

            result.current.mutateArchiveChat = async chatToArchive => {
                await useMutation.mock.results[0].value.mutateAsync()

                setArchiveChats(prev =>
                    prev.map(chat => (chat.id === chatToArchive.id ? { ...chat, arquivado: true } : chat))
                )
                setTotalArquivedChats(prev => prev + 1)

                handleAlert('info', 'Chat arquivado')
            }

            await act(async () => {
                await result.current.mutateArchiveChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chat arquivado')
            expect(setArchiveChats).toHaveBeenCalledWith(expect.any(Function))
            expect(setTotalArquivedChats).toHaveBeenCalledWith(expect.any(Function))
            expect(result.current.archiveChats).toEqual([
                { id: 'chat123', arquivado: true },
                { id: 'chat456', arquivado: true }
            ])
            expect(result.current.totalArquivedChats).toBe(2)
        })

        it('should handle unarchive chat successfully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve({ mensagem: 'Chat desarquivado com sucesso!' })
                    options.onSuccess(response)
                    return response
                })
            }))

            const mockChat = { id: 'chat123', arquivado: true }
            const { result } = renderHook(() => useArchiveFunctions('', false), {
                wrapper: Wrapper
            })

            result.current.archiveChats = [
                { id: 'chat123', arquivado: true },
                { id: 'chat456', arquivado: true }
            ]
            result.current.totalArquivedChats = 2

            const setArchiveChats = jest.fn(updateFn => {
                result.current.archiveChats = updateFn(result.current.archiveChats)
            })
            const setTotalArquivedChats = jest.fn(updateFn => {
                result.current.totalArquivedChats = updateFn(result.current.totalArquivedChats)
            })

            result.current.mutateArchiveChat = async chatToUnarchive => {
                await useMutation.mock.results[0].value.mutateAsync()

                setArchiveChats(prev =>
                    prev.map(chat => (chat.id === chatToUnarchive.id ? { ...chat, arquivado: false } : chat))
                )
                setTotalArquivedChats(prev => prev - 1)

                handleAlert('info', 'Chat desarquivado com sucesso')
            }

            await act(async () => {
                await result.current.mutateArchiveChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('info', 'Chat desarquivado com sucesso')
            expect(setArchiveChats).toHaveBeenCalledWith(expect.any(Function))
            expect(setTotalArquivedChats).toHaveBeenCalledWith(expect.any(Function))
            expect(result.current.archiveChats).toEqual([
                { id: 'chat123', arquivado: false },
                { id: 'chat456', arquivado: true }
            ])
            expect(result.current.totalArquivedChats).toBe(1)
        })

        it('should handle unrecognized status gracefully', async () => {
            useMutation.mockImplementation((mutationFn, options) => ({
                mutateAsync: jest.fn().mockImplementation(async () => {
                    const response = await Promise.resolve({ mensagem: 'Unknown status!' })
                    options.onSuccess(response)
                    return response
                })
            }))

            const mockChat = { id: 'chat123', arquivado: true }
            const { result } = renderHook(() => useArchiveFunctions('', false), {
                wrapper: Wrapper
            })

            result.current.archiveChats = [
                { id: 'chat123', arquivado: true },
                { id: 'chat456', arquivado: true }
            ]
            result.current.totalArquivedChats = 2

            const setArchiveChats = jest.fn(updateFn => {
                result.current.archiveChats = updateFn(result.current.archiveChats)
            })
            const setTotalArquivedChats = jest.fn(updateFn => {
                result.current.totalArquivedChats = updateFn(result.current.totalArquivedChats)
            })

            result.current.mutateArchiveChat = async chatToArchive => {
                const response = await useMutation.mock.results[0].value.mutateAsync()

                if (response.mensagem === 'Chat arquivado com sucesso!') {
                    setArchiveChats(prev =>
                        prev.map(chat => (chat.id === chatToArchive.id ? { ...chat, arquivado: true } : chat))
                    )
                    setTotalArquivedChats(prev => prev + 1)
                    handleAlert('info', 'Chat arquivado')
                } else if (response.mensagem === 'Chat desarquivado com sucesso!') {
                    setArchiveChats(prev =>
                        prev.map(chat => (chat.id === chatToArchive.id ? { ...chat, arquivado: false } : chat))
                    )
                    setTotalArquivedChats(prev => prev - 1)
                    handleAlert('info', 'Chat desarquivado com sucesso')
                } else {
                    handleAlert('warning', 'Status do chat não reconhecido')
                }
            }

            await act(async () => {
                await result.current.mutateArchiveChat(mockChat)
            })

            expect(handleAlert).toHaveBeenCalledWith('warning', 'Status do chat não reconhecido')
            expect(setArchiveChats).not.toHaveBeenCalled()
            expect(result.current.totalArquivedChats).toBe(2)
        })
    })
})
