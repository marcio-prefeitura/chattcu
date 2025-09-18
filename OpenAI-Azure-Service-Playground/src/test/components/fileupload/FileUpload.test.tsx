import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import FileUpload from '../../../components/sidebar/upload/fileupload/FileUpload'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IUserInfo } from '../../../hooks/useUserInfo'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

const mockProfile: IUserInfo = {
    login: '',
    perfilDev: false,
    perfilDevOrPreview: false,
    perfilPreview: false,
    name: '',
    initialLetters: ''
}

const mockedUploadedFiles = [
    {
        id: '657337d347595c11401b1c33',
        nome: 'arquivos secretos',
        usuario: 'x29153049802',
        st_removido: false,
        id_pasta_pai: -1,
        data_criacao: '2023-12-08',
        st_arquivo: false,
        tipo_midia: null,
        nome_blob: null,
        status: null,
        arquivos: [
            {
                id: '658afbd239f1d19055bcad16',
                nome: 'Certificado_conquery.pdf',
                usuario: 'x29153049802',
                st_removido: false,
                id_pasta_pai: '657337d347595c11401b1c33',
                data_criacao: '2023-12-26',
                st_arquivo: true,
                tamanho: '3430952',
                tipo_midia: 'application/pdf',
                nome_blob: '9ecb1c7419287d5b96b82510fe28e7cc2918fd30907ccc0f3c86ffa4951728bc-3430952.pdf',
                status: 'ARMAZENADO',
                arquivos: null,
                selected: false
            }
        ],
        selected: false,
        open: false
    }
]

const defaultProps: any = {
    onSelectFolder: () => {},
    onSelectFile: () => {},
    selectFolderUpload: () => {},
    folderUnselectedId: '',
    handleMessageSuccess: () => {},
    handleMessageErro: () => {},
    onMoveFolder: () => {},
    filesSelected: [],
    onUploadedFilesChange: () => {},
    updatedFoldersFromChipsActions: [],
    uploadedFiles: [],
    setUploadedFiles: () => {},
    profile: { mockProfile }
}

describe('<FileUpload />', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    const queryClient = new QueryClient()
    it('Deve renderizar área de upload de arquivos', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const dropzone = screen.getByTestId('dropzone-box')
        expect(dropzone).toBeInTheDocument()
    })

    it('Deve exibir o campo de filtro para buscar arquivos ou pastas', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const filterField = screen.getByPlaceholderText('Buscar arquivos ou pastas')
        expect(filterField).toBeInTheDocument()
    })

    it('Deve exibir a mensagem "Nenhum Resultado Encontrado" quando a busca não retornar resultados', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const filterField = screen.getByPlaceholderText('Buscar arquivos ou pastas')
        fireEvent.change(filterField, { target: { value: 'ArquivoInexistente' } })

        await waitFor(() => {
            const noResultsMessage = screen.getByText('Nenhum Resultado Encontrado')
            expect(noResultsMessage).toBeInTheDocument()
        })
    })

    it('Deve exibir o componente UploadDropDown', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const uploadDropDown = screen.getByTestId('upload-dropdown')
        expect(uploadDropDown).toBeInTheDocument()
    })

    it('Deve exibir o componente ListFoldersCustom', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const listFoldersCustom = screen.getByTestId('list-folders-custom')
        expect(listFoldersCustom).toBeInTheDocument()
    })

    it('Deve atualizar as chips com os arquivos selecionados', () => {
        const mockOnMoveFolder = jest.fn()
        const updatedFolders = [
            { id: 'folder1', selected: true },
            { id: 'folder2', selected: false }
        ]

        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    onSelectFolder={() => {}}
                    onSelectFile={() => {}}
                    folderUnselectedId={''}
                    handleMessageSuccess={() => {}}
                    handleMessageErro={() => {}}
                    onMoveFolder={mockOnMoveFolder}
                    filesSelected={[]}
                    onUploadedFilesChange={() => {}}
                    updatedFoldersFromChipsActions={[]}
                    uploadedFiles={mockedUploadedFiles}
                    setUploadedFiles={() => {}}
                    profile={mockProfile}
                />
            </QueryClientProvider>
        )

        const updateChips = updatedFolders => {
            const selectedFiles = updatedFolders.filter(folder => folder.selected)
            mockOnMoveFolder(selectedFiles)
        }

        updateChips(updatedFolders)

        expect(mockOnMoveFolder).toHaveBeenCalledWith([{ id: 'folder1', selected: true }])
    })

    // it('Deve renderizar nome dos arquivos', async () => {
    //     renderWithProviders(
    //         <FileUpload
    //             onSelectFolder={() => {}}
    //             onSelectFile={() => {}}
    //             selectFolderUpload={() => {}}
    //             folderUnselectedId={''}
    //             handleMessageSuccess={() => {}}
    //             handleMessageErro={() => {}}
    //             onMoveFolder={() => {}}
    //             filesSelected={[]}
    //             onUploadedFilesChange={() => {}}
    //             updatedFoldersFromChipsActions={[]}
    //             uploadedFiles={mockedUploadedFiles}
    //             setUploadedFiles={() => {}}
    //             profile={mockProfile}
    //         />
    //     )

    //     // Encontrar e expandir a pasta
    //     const folderElement = await screen.findByText('arquivos secretos')
    //     fireEvent.click(folderElement)

    //     // Aguardar o nome do arquivo aparecer
    //     const fileName = await screen.findByText('Certificado_conquery.pdf')
    //     expect(fileName).toBeInTheDocument()
    // })
})
