import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ISelectedFiles } from '../../../shared/interfaces/SelectedFiles'
import InputFiles from '../../../components/chat-box/InputFiles'
import { IFile } from '../../../shared/interfaces/Folder'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/test' })
}))

const createMockFile = (id: string, name: string): IFile => ({
    id,
    nome: name,
    tipo_midia: 'text',
    id_pasta_pai: '10',
    usuario: 'User1',
    st_removido: false,
    data_criacao: '2023-01-01T00:00:00Z',
    st_arquivo: true,
    tamanho: 1024,
    nome_blob: `blob${id}`,
    status: 'active',
    selected: false,
    progress: 0,
    show: true,
    uploaded: true
})

const createMockFolder = (id: string) => ({
    id,
    nome: 'Test Folder',
    usuario: 'User1',
    st_removido: false,
    id_pasta_pai: '0',
    data_criacao: '2023-01-01T00:00:00Z',
    st_arquivo: false,
    open: false,
    selected: false,
    arquivos: [],
    show: true,
    loading: false,
    tamanho: 0,
    nivel: 1,
    tipo_midia: 'folder',
    nome_blob: `blob-folder-${id}`,
    status: 'active'
})

const mockFilesSelected: ISelectedFiles[] = [
    {
        folder_name: 'Folder 1',
        selected_files: [createMockFile('1', 'File 1')]
    }
]

describe('InputFiles Component', () => {
    const mockSetFilesSelected = jest.fn()
    const mockSetShowClearButton = jest.fn()
    const mockSetUpdatedFoldersFromChipsActions = jest.fn()

    const defaultProps = {
        filesSelected: mockFilesSelected,
        setFilesSelected: mockSetFilesSelected,
        foldersRef: { current: [] },
        showClearButton: false,
        setShowClearButton: mockSetShowClearButton,
        setUpdatedFoldersFromChipsActions: mockSetUpdatedFoldersFromChipsActions,
        profile: {
            user_id: 1,
            name: 'Test User',
            email: 'test@example.com',
            login: 'testuser',
            initialLetters: 'TU',
            perfilDev: true,
            perfilPreview: false,
            perfilDevOrPreview: true
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renderiza corretamente com os arquivos iniciais', () => {
        const { getByText, getByTestId } = render(
            <MemoryRouter>
                <InputFiles {...defaultProps} />
            </MemoryRouter>
        )

        expect(getByText('File 1')).toBeInTheDocument()
        expect(getByTestId('file-chip-1')).toBeInTheDocument()
    })

    it('mostra botão limpar quando mais de 3 arquivos são selecionados', () => {
        const manyFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: Array(4)
                    .fill(null)
                    .map((_, index) => createMockFile(`${index + 1}`, `File ${index + 1}`))
            }
        ]

        render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={manyFiles}
                    showClearButton={true}
                />
            </MemoryRouter>
        )

        expect(mockSetShowClearButton).toHaveBeenCalledWith(true)
    })

    it('limpar todos os arquivos quando o botão limpar é clicado', () => {
        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    showClearButton={true}
                />
            </MemoryRouter>
        )

        fireEvent.click(getByTestId('clear-all-button'))
        expect(mockSetFilesSelected).toHaveBeenCalledWith([])
        expect(mockSetShowClearButton).toHaveBeenCalledWith(false)
    })

    it('navega e abre pasta e mostra o arquivo quando o chip do arquivo é clicado', () => {
        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('10'),
                    arquivos: [createMockFile('1', 'File 1')]
                }
            ]
        }

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    foldersRef={mockFoldersRef}
                />
            </MemoryRouter>
        )

        fireEvent.click(getByTestId('file-chip-1'))
        expect(mockNavigate).toHaveBeenCalledWith('/test?tab=files')
    })

    it('atualiza as referências quando a pasta está fechada', () => {
        const mockFile = createMockFile('1', 'File 1')
        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('10'),
                    open: false,
                    arquivos: [mockFile]
                }
            ]
        }

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    foldersRef={mockFoldersRef}
                />
            </MemoryRouter>
        )

        fireEvent.click(getByTestId('file-chip-1'))
        expect(mockFoldersRef.current[0].open).toBe(true)
        expect(mockSetUpdatedFoldersFromChipsActions).toHaveBeenCalled()
    })

    it('atualiza o estado quando arquivos são modificados', () => {
        const { rerender } = render(
            <MemoryRouter>
                <InputFiles {...defaultProps} />
            </MemoryRouter>
        )

        const manyFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: Array(4)
                    .fill(null)
                    .map((_, index) => createMockFile(`${index + 1}`, `File ${index + 1}`))
            }
        ]

        rerender(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={manyFiles}
                />
            </MemoryRouter>
        )

        expect(mockSetShowClearButton).toHaveBeenCalledWith(true)
    })

    it('deve remover um único arquivo e limpar a seleção', () => {
        const singleFile = [
            {
                folder_name: 'Folder 1',
                selected_files: [createMockFile('1', 'File 1')]
            }
        ]

        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('10'),
                    arquivos: [createMockFile('1', 'File 1')]
                }
            ]
        }

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={singleFile}
                    foldersRef={mockFoldersRef}
                />
            </MemoryRouter>
        )

        const deleteButton = getByTestId('file-delete-1').querySelector('.MuiChip-deleteIcon') as HTMLElement
        fireEvent.click(deleteButton)

        expect(mockSetFilesSelected).toHaveBeenCalledWith([])
        expect(mockSetShowClearButton).toHaveBeenCalledWith(false)
    })

    it('deve remover um arquivo de múltiplos selecionados', () => {
        const multipleFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: [createMockFile('1', 'File 1'), createMockFile('2', 'File 2')]
            }
        ]

        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('10'),
                    arquivos: [
                        { ...createMockFile('1', 'File 1'), selected: true },
                        { ...createMockFile('2', 'File 2'), selected: true }
                    ]
                }
            ]
        }

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={multipleFiles}
                    foldersRef={mockFoldersRef}
                />
            </MemoryRouter>
        )

        const deleteButton = getByTestId('file-delete-1').querySelector('.MuiChip-deleteIcon') as HTMLElement
        fireEvent.click(deleteButton)

        const expectedFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: [createMockFile('2', 'File 2')] // Removido selected: true
            }
        ]

        expect(mockSetFilesSelected).toHaveBeenCalledWith(expectedFiles)
    })

    it('deve atualizar a pasta quando um arquivo é removido', () => {
        const mockFile = { ...createMockFile('1', 'File 1'), selected: true }
        const files = [
            {
                folder_name: 'Folder 1',
                selected_files: [mockFile]
            }
        ]

        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('10'),
                    arquivos: [mockFile]
                }
            ]
        }

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={files}
                    foldersRef={mockFoldersRef}
                />
            </MemoryRouter>
        )

        const deleteButton = getByTestId('file-delete-1').querySelector('.MuiChip-deleteIcon') as HTMLElement
        fireEvent.click(deleteButton)

        expect(mockFoldersRef.current[0].arquivos[0].selected).toBe(false)
    })

    it('deve filtrar arquivos corretamente ao remover', () => {
        const file1 = { ...createMockFile('1', 'File 1'), selected: true }
        const file2 = { ...createMockFile('2', 'File 2'), selected: true }
        const multipleFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: [file1, file2]
            }
        ]

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={multipleFiles}
                />
            </MemoryRouter>
        )

        const deleteButton = getByTestId('file-delete-1').querySelector('.MuiChip-deleteIcon') as HTMLElement
        fireEvent.click(deleteButton)

        const expectedFilteredFiles = [
            {
                folder_name: 'Folder 1',
                selected_files: [file2]
            }
        ]

        expect(mockSetFilesSelected).toHaveBeenCalledWith(expectedFilteredFiles)
    })

    it('deve executar scroll para o arquivo quando encontrado', async () => {
        const mockElement = document.createElement('div')
        mockElement.id = 'treeview-files-1'
        mockElement.scrollIntoView = jest.fn()
        document.getElementById = jest.fn().mockReturnValue(mockElement)

        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles {...defaultProps} />
            </MemoryRouter>
        )

        fireEvent.click(getByTestId('file-chip-1'))

        await new Promise(r => setTimeout(r, 1100))

        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    })

    it('deve renderizar o ícone correto baseado no tipo de mídia', () => {
        const filesWithDifferentTypes = [
            {
                folder_name: 'Folder 1',
                selected_files: [
                    {
                        ...createMockFile('1', 'test.pdf'),
                        tipo_midia: 'pdf'
                    }
                ]
            }
        ]

        const { container } = render(
            <MemoryRouter>
                <InputFiles
                    {...defaultProps}
                    filesSelected={filesWithDifferentTypes}
                />
            </MemoryRouter>
        )

        expect(container.querySelector('.icon-pdf')).toBeInTheDocument()
    })

    it('deve mostrar tooltip com o nome completo do arquivo', async () => {
        const { getByTestId } = render(
            <MemoryRouter>
                <InputFiles {...defaultProps} />
            </MemoryRouter>
        )

        const chip = getByTestId('file-chip-1')
        const tooltipText = chip.querySelector('.chat-box__chip-item')

        expect(tooltipText).toHaveTextContent('File 1')
    })

    it('deve mostrar o nome da pasta corretamente', () => {
        const { container } = render(
            <MemoryRouter>
                <InputFiles {...defaultProps} />
            </MemoryRouter>
        )

        const label = container.querySelector('.chat-box__float-label')
        expect(label).toHaveTextContent('Folder 1')
    })
})
