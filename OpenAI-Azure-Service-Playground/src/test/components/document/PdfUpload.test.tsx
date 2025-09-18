import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react-dom/test-utils'
import { PdfUpload } from '../../../components/document/PdfUpload'
import { deleteFile } from '../../../infrastructure/api'

jest.mock('../../../infrastructure/api', () => ({
    deleteFile: jest.fn()
}))

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false
        },
        mutations: {
            retry: false
        }
    }
})

const mockUploadedFiles = [
    {
        id: '1',
        file: new Blob(),
        nome: 'file1.pdf',
        size: 1024,
        uploaded: true,
        error: false,
        selected: false
    },
    {
        id: '2',
        file: new Blob(),
        nome: 'file2.pdf',
        size: 2048,
        uploaded: true,
        error: false,
        selected: false
    }
]

const mockSetUploadedFiles = jest.fn()
const mockOnSelectFile = jest.fn()

const renderComponent = (props = {}) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <PdfUpload
                setUploadedFiles={mockSetUploadedFiles}
                onSelectFile={mockOnSelectFile}
                uploadedFiles={mockUploadedFiles}
                {...props}
            />
        </QueryClientProvider>
    )
}

describe('PdfUpload', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('deve renderizar o componente corretamente', () => {
        renderComponent()
        expect(screen.getByTestId('uploaded-files-list')).toBeInTheDocument()
    })

    test('deve renderizar o componente sem arquivos', () => {
        renderComponent({ uploadedFiles: [] })
        expect(screen.queryByTestId('uploaded-files-list')).not.toBeInTheDocument()
        expect(screen.getByTestId('dropzone-box')).toBeInTheDocument()
    })

    test('deve exibir a lista de arquivos enviados', () => {
        renderComponent()
        const fileContainers = screen.getAllByTestId('file-upload-view-container')
        expect(fileContainers).toHaveLength(mockUploadedFiles.length)
    })

    test('deve filtrar a lista de arquivos enviados com base na consulta', async () => {
        renderComponent()
        const filterInput = screen.getByPlaceholderText('Filtrar...')
        fireEvent.change(filterInput, { target: { value: 'file1' } })

        await waitFor(() => {
            const fileNames = screen.getAllByTestId('file-upload-filename')
            const visibleFileNames = fileNames.map(node => node.textContent).filter(name => name?.includes('1'))
            expect(visibleFileNames.length).toBe(1)
        })
    })

    test('deve abrir o modal excluir arquivo quando o botão excluir for clicado', () => {
        renderComponent()
        const deleteButton = screen.getAllByTestId('file-upload-trash-btn')[0]
        fireEvent.click(deleteButton)
        expect(screen.getByText('Confirma a exclusão do Arquivo?')).toBeInTheDocument()
    })

    test('deve deletar arquivo com sucesso', async () => {
        const mockDeleteFile = deleteFile as jest.Mock
        mockDeleteFile.mockResolvedValue({ status: true })

        renderComponent()

        const deleteButton = screen.getAllByTestId('file-upload-trash-btn')[0]
        fireEvent.click(deleteButton)

        const confirmButton = screen.getByText('Confirmar')
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockSetUploadedFiles).toHaveBeenCalled()
        })
    })

    test('deve cancelar a exclusão do arquivo', async () => {
        renderComponent()

        const deleteButton = screen.getAllByTestId('file-upload-trash-btn')[0]
        fireEvent.click(deleteButton)

        const cancelButton = screen.getByText('Cancelar')
        await act(async () => {
            fireEvent.click(cancelButton)
        })

        await waitFor(() => {
            expect(screen.queryByText('Confirma a exclusão do Arquivo?')).not.toBeInTheDocument()
        })
        expect(deleteFile).not.toHaveBeenCalled()
    })
})
