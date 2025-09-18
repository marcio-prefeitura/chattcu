import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import UploadDropDown from '../../../../../components/sidebar/upload/fileupload/UploadDropDown'
import { uploadFileToAnalysis } from '../../../../../infrastructure/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InTeamsContext } from '../../../../../context/AppContext'
import { IUserInfo } from '../../../../../hooks/useUserInfo'
import { IFolder } from '../../../../../shared/interfaces/Folder'

jest.mock('uuid', () => ({
    v4: () => 'test-uuid'
}))

jest.mock('../../../../../infrastructure/api', () => ({
    uploadFileToAnalysis: jest.fn()
}))

jest.mock('../../../../../hooks/useFolder', () => ({
    useFolder: () => ({
        organizeFolders: folders => folders
    })
}))

describe('UploadDropDown', () => {
    const mockProfile: IUserInfo = {
        login: 'testuser',
        name: 'Test User',
        initialLetters: 'TU',
        perfilDev: true,
        perfilPreview: false,
        perfilDevOrPreview: true
    }

    const mockFolder = {
        id: '1',
        nome: 'Pasta 1',
        usuario: 'testuser',
        st_removido: false,
        id_pasta_pai: '',
        data_criacao: '2024-01-01',
        st_arquivo: false,
        tamanho: 0,
        tipo_midia: 'folder',
        nome_blob: 'pasta-1',
        status: 'active',
        arquivos: [],
        open: false,
        selected: false
    }

    const defaultProps = {
        uploadedFiles: [mockFolder],
        setUploadedFiles: jest.fn(),
        opcaoSelecionada: '1',
        setOpcaoSelecionada: jest.fn(),
        updateChips: jest.fn(),
        handleMessageSuccess: jest.fn(),
        handleMessageErro: jest.fn(),
        onSelectFolder: jest.fn(),
        saveNewFolder: jest.fn(),
        setTrasitionFolderField: jest.fn(),
        trasitionFolderField: false,
        profile: mockProfile
    }

    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
            <InTeamsContext.Provider value={false}>{children}</InTeamsContext.Provider>
        </QueryClientProvider>
    )

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the component correctly', () => {
        render(<UploadDropDown {...defaultProps} />, { wrapper })
        expect(screen.getByTestId('upload-dropdown')).toBeInTheDocument()
        expect(screen.getByTestId('link-upload-imput')).toBeInTheDocument()
    })

    it('handles successful single file upload', async () => {
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
        const mockResponse = {
            data: {
                status: 1,
                arquivo: {
                    id: '123',
                    nome: 'test.pdf',
                    nome_blob: 'test.pdf',
                    status: 'complete',
                    data_criacao: '2024-01-01',
                    id_pasta_pai: '1',
                    st_arquivo: true,
                    st_removido: false,
                    tamanho: 1000,
                    tipo_midia: 'pdf',
                    usuario: 'testuser'
                }
            }
        }

        ;(uploadFileToAnalysis as jest.Mock).mockImplementation((_, id, __, callback) => {
            callback(id, { progress: 50 })
            return Promise.resolve(mockResponse)
        })

        render(<UploadDropDown {...defaultProps} />, { wrapper })

        const input = screen.getByTestId('dropzone')
        await act(async () => {
            fireEvent.change(input, {
                target: { files: [file] }
            })
        })

        await waitFor(() => {
            expect(defaultProps.handleMessageSuccess).toHaveBeenCalledWith(
                'Upload bem sucedido: arquivo foi carregado na pasta Pasta 1',
                true
            )
        })
    })

    it('handles multiple file upload', async () => {
        const files = [
            new File(['test1'], 'a.pdf', { type: 'application/pdf' }),
            new File(['test2'], 'b.pdf', { type: 'application/pdf' })
        ]

        const mockResponses = files.map(file => ({
            data: {
                status: 1,
                arquivo: {
                    id: file.name,
                    nome: file.name,
                    nome_blob: file.name,
                    status: 'complete',
                    data_criacao: '2024-01-01',
                    id_pasta_pai: '1',
                    st_arquivo: true,
                    st_removido: false,
                    tamanho: 1000,
                    tipo_midia: 'pdf',
                    usuario: 'testuser'
                }
            }
        }))

        ;(uploadFileToAnalysis as jest.Mock)
            .mockResolvedValueOnce(mockResponses[0])
            .mockResolvedValueOnce(mockResponses[1])

        render(<UploadDropDown {...defaultProps} />, { wrapper })

        const input = screen.getByTestId('dropzone')
        await act(async () => {
            fireEvent.change(input, {
                target: { files }
            })
        })

        await waitFor(() => {
            expect(defaultProps.handleMessageSuccess).toHaveBeenCalledWith(
                'Upload bem sucedido: 2 arquivos foram carregados na pasta Pasta 1',
                true
            )
        })
    })

    it('handles duplicate file error', async () => {
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

        render(<UploadDropDown {...defaultProps} />, { wrapper })

        const input = screen.getByTestId('dropzone')
        await act(async () => {
            const messageError = {
                error: 'Arquivo já existe na pasta',
                filesName: ['test.pdf']
            }
            defaultProps.handleMessageErro(messageError)
            fireEvent.change(input, {
                target: { files: [file] }
            })
        })

        await waitFor(() => {
            expect(defaultProps.handleMessageErro).toHaveBeenCalledWith({
                error: 'Arquivo já existe na pasta',
                filesName: ['test.pdf']
            })
        })
    })

    it('validates folder selection before upload', async () => {
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
        const propsWithoutFolder = {
            ...defaultProps,
            uploadedFiles: []
        }

        render(<UploadDropDown {...propsWithoutFolder} />, { wrapper })

        const input = screen.getByTestId('dropzone')
        await act(async () => {
            fireEvent.change(input, {
                target: { files: [file] }
            })
        })

        expect(uploadFileToAnalysis).not.toHaveBeenCalled()
    })

    describe('YouTube Link functionality', () => {
        it('should validate YouTube link correctly', async () => {
            render(<UploadDropDown {...defaultProps} />, { wrapper })

            const input = screen.getByPlaceholderText('Link para transcrição (YouTube)')

            fireEvent.change(input, {
                target: { value: 'https://www.youtube.com/watch?v=123456' }
            })

            expect(input.closest('.MuiOutlinedInput-root')).not.toHaveClass('Mui-error')
            expect(screen.queryByText('Link não permitido (SOMENTE YOUTUBE)')).not.toBeInTheDocument()
        })

        it('should show error state and message for non-YouTube link', async () => {
            render(<UploadDropDown {...defaultProps} />, { wrapper })

            const input = screen.getByPlaceholderText('Link para transcrição (YouTube)')

            fireEvent.change(input, {
                target: { value: 'https://example.com/video' }
            })

            expect(input.closest('.MuiOutlinedInput-root')).toHaveClass('Mui-error')
            expect(screen.getByText('Apenas links do YouTube são permitidos')).toBeInTheDocument()
        })

        it('should clear input when clicking X button', async () => {
            render(<UploadDropDown {...defaultProps} />, { wrapper })

            const input = screen.getByPlaceholderText('Link para transcrição (YouTube)')

            fireEvent.change(input, {
                target: { value: 'https://www.creditas.com/aluguel-er' }
            })

            fireEvent.click(screen.getByTestId('clear-button'))

            expect(input).toHaveValue('')
            expect(screen.queryByText('Link para transcrição (YouTube)')).not.toBeInTheDocument()
        })

        it('should clear input after successful submission', () => {
            render(<UploadDropDown {...defaultProps} />, { wrapper })

            const input = screen.getByPlaceholderText('Link para transcrição (YouTube)')

            fireEvent.change(input, {
                target: { value: 'https://youtube.com/watch?v=123' }
            })

            fireEvent.click(screen.getByTestId('submit-button'))

            expect(input).toHaveValue('')
        })
    })
})
