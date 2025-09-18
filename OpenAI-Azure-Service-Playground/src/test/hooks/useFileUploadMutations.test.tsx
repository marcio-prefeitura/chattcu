import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as api from '../../infrastructure/api'
import { useFileUploadMutations } from '../../hooks/useFileUploadMutations'

// Mock das funções da API
jest.mock('../../infrastructure/api')

const queryClient = new QueryClient()

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useFileUploadMutations', () => {
    const mockHandlers = {
        onSuccess: jest.fn(),
        onError: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('deve criar uma pasta com sucesso', async () => {
        const mockCreateFolder = api.createFolder as jest.Mock
        mockCreateFolder.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateCreateFolder.mutateAsync('Nova Pasta')
        })

        expect(mockCreateFolder).toHaveBeenCalledWith({ nome: 'Nova Pasta' })
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Pasta "Nova Pasta" criada!')
    })

    test('deve lidar com erro ao criar uma pasta', async () => {
        const mockCreateFolder = api.createFolder as jest.Mock
        mockCreateFolder.mockRejectedValueOnce(new Error('Pasta já existe'))

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateCreateFolder.mutateAsync('Pasta Existente')
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockCreateFolder).toHaveBeenCalledWith({ nome: 'Pasta Existente' })
        expect(mockHandlers.onError).toHaveBeenCalledWith('Erro ao criar pasta: A pasta já existe com este nome !')
    })

    test('deve excluir uma pasta com sucesso', async () => {
        const mockDeleteFolder = api.deleteFolder as jest.Mock
        mockDeleteFolder.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateDeleteFolder.mutateAsync('folder-id-1')
        })

        expect(mockDeleteFolder).toHaveBeenCalledWith('folder-id-1')
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Pasta excluída!')
    })

    test('deve lidar com erro ao excluir uma pasta', async () => {
        const mockDeleteFolder = api.deleteFolder as jest.Mock
        mockDeleteFolder.mockRejectedValueOnce(new Error('Erro ao excluir a pasta'))

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateDeleteFolder.mutateAsync('folder-id-2')
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockDeleteFolder).toHaveBeenCalledWith('folder-id-2')
        expect(mockHandlers.onError).toHaveBeenCalledWith('Ocorreu um erro ao excluir a pasta!')
    })

    test('deve renomear uma pasta com sucesso', async () => {
        const mockEditFolder = api.editFolder as jest.Mock
        mockEditFolder.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateEditFolder.mutateAsync({ id: 'folder-id-3', nome: 'Nova Nome' })
        })

        expect(mockEditFolder).toHaveBeenCalledWith('folder-id-3', { id: 'folder-id-3', nome: 'Nova Nome' })
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Pasta Renomeada!')
    })

    test('deve lidar com erro ao renomear uma pasta', async () => {
        const mockEditFolder = api.editFolder as jest.Mock
        mockEditFolder.mockRejectedValueOnce({
            response: {
                data: {
                    mensagem: 'Ocorreu um erro ao editar a pasta!'
                }
            }
        })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateEditFolder.mutateAsync({ id: 'folder-id-4', nome: 'Novo Nome' })
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockEditFolder).toHaveBeenCalledWith('folder-id-4', { id: 'folder-id-4', nome: 'Novo Nome' })
        expect(mockHandlers.onError).toHaveBeenCalledWith('Ocorreu um erro ao editar a pasta!')
    })

    test('deve excluir um arquivo com sucesso', async () => {
        const mockDeleteFile = api.deleteFile as jest.Mock
        mockDeleteFile.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateDeleteFile.mutateAsync(['file-id-1'])
        })

        expect(mockDeleteFile).toHaveBeenCalledWith(['file-id-1'])
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Arquivo excluído!')
    })

    test('deve lidar com erro ao excluir um arquivo', async () => {
        const mockDeleteFile = api.deleteFile as jest.Mock
        mockDeleteFile.mockRejectedValueOnce(new Error('Erro ao excluir o arquivo'))

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateDeleteFile.mutateAsync(['file-id-2'])
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockDeleteFile).toHaveBeenCalledWith(['file-id-2'])
        expect(mockHandlers.onError).toHaveBeenCalledWith('Ocorreu um erro ao excluir o arquivo!')
    })

    test('deve excluir arquivos com sucesso', async () => {
        const mockDeleteFiles = api.deleteFile as jest.Mock
        mockDeleteFiles.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateDeleteFiles.mutateAsync(['file-id-3', 'file-id-4'])
        })

        expect(mockDeleteFiles).toHaveBeenCalledWith(['file-id-3', 'file-id-4'])
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Arquivos excluídos!')
    })

    test('deve lidar com erro ao excluir arquivos', async () => {
        const mockDeleteFiles = api.deleteFile as jest.Mock
        mockDeleteFiles.mockRejectedValueOnce(new Error('Erro ao excluir os arquivos'))

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateDeleteFiles.mutateAsync(['file-id-5', 'file-id-6'])
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockDeleteFiles).toHaveBeenCalledWith(['file-id-5', 'file-id-6'])
        expect(mockHandlers.onError).toHaveBeenCalledWith('Ocorreu um erro ao excluir os arquivos!')
    })

    test('deve editar um arquivo com sucesso', async () => {
        const mockEditFile = api.editFile as jest.Mock
        mockEditFile.mockResolvedValueOnce({ data: 'success' })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            await result.current.mutateEditFile.mutateAsync({ id: 'file-id-7', nome: 'Novo Nome' })
        })

        expect(mockEditFile).toHaveBeenCalledWith('file-id-7', { id: 'file-id-7', nome: 'Novo Nome' })
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith('Arquivo editado com sucesso!')
    })

    test('deve lidar com erro ao editar um arquivo', async () => {
        const mockEditFile = api.editFile as jest.Mock
        mockEditFile.mockRejectedValueOnce({
            response: {
                data: {
                    mensagem: 'Ocorreu um erro ao editar o arquivo!'
                }
            }
        })

        const { result } = renderHook(() => useFileUploadMutations(mockHandlers), { wrapper })

        await act(async () => {
            try {
                await result.current.mutateEditFile.mutateAsync({ id: 'file-id-8', nome: 'Novo Nome' })
            } catch (error) {
                // Expected to throw
            }
        })

        expect(mockEditFile).toHaveBeenCalledWith('file-id-8', { id: 'file-id-8', nome: 'Novo Nome' })
        expect(mockHandlers.onError).toHaveBeenCalledWith('Ocorreu um erro ao editar o arquivo!')
    })
})
