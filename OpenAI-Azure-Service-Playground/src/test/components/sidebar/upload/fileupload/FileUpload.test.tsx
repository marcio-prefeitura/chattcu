import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import FileUpload from '../../../../../components/sidebar/upload/fileupload/FileUpload'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { IUserInfo } from '../../../../../hooks/useUserInfo'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    useMutation: jest.fn(() => ({
        mutateAsync: jest.fn()
    }))
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
        tamanho: '1',
        status: null,
        arquivos: [
            {
                id: '658afbd239f1d19055bcad16',
                nome: 'Certificado_De_Teste.pdf',
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
        show: true,
        uploaded: true,
        open: false
    },
    {
        id: '657337d347595c11401b1234',
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
                id: '658afbd239f1d19055bcad36',
                nome: 'Certificado.pdf',
                usuario: 'x29153049802',
                st_removido: false,
                id_pasta_pai: '657337d347595c11401b1234',
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
        show: true,
        uploaded: true,
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
    let queryClient = new QueryClient()

    beforeEach(() => {
        jest.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false }
            }
        })
    })

    it('should render the component correctly', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload {...defaultProps} />
            </QueryClientProvider>
        )

        const dropzone = screen.getByTestId('dropzone-box')
        expect(dropzone).toBeInTheDocument()
    })

    it('should update uploadedFiles when updatedFoldersFromChipsActions changes', async () => {
        const setUploadedFilesMock = jest.fn()

        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    setUploadedFiles={setUploadedFilesMock}
                    updatedFoldersFromChipsActions={[]}
                    uploadedFiles={mockedUploadedFiles}
                />
            </QueryClientProvider>
        )

        const updatedFolders = [
            { id: 'folder1', selected: true },
            { id: 'folder2', selected: false }
        ]

        rerender(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    setUploadedFiles={setUploadedFilesMock}
                    updatedFoldersFromChipsActions={updatedFolders}
                    uploadedFiles={mockedUploadedFiles}
                />
            </QueryClientProvider>
        )

        await waitFor(() => {
            expect(setUploadedFilesMock).toHaveBeenCalledWith(updatedFolders)
        })
    })

    it('should save a new folder and update the state correctly', async () => {
        const mockMutateCreateFolder = jest.fn().mockResolvedValue({
            data: {
                status: true,
                pasta: {
                    id: 'new-folder-id',
                    nome: 'Nova Pasta Teste'
                }
            }
        })

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        useMutation.mockReturnValue({
            mutateAsync: mockMutateCreateFolder
        })

        const setUploadedFilesMock = jest.fn()
        const onUploadedFilesChangeMock = jest.fn()

        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    setUploadedFiles={setUploadedFilesMock}
                    onUploadedFilesChange={onUploadedFilesChangeMock}
                />
            </QueryClientProvider>
        )

        const input = screen.getByPlaceholderText('Criar pasta')
        fireEvent.change(input, { target: { value: 'Nova Pasta Teste' } })

        const saveButton = screen.getByTestId('button-save-folder')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockMutateCreateFolder).toHaveBeenCalledWith('Nova Pasta Teste')
            expect(setUploadedFilesMock).toHaveBeenCalled()
            expect(onUploadedFilesChangeMock).toHaveBeenCalled()
        })
    })

    it('should edit a folder and update the state correctly', async () => {
        const mockMutateEditFolder = jest.fn().mockResolvedValue({
            data: {
                status: true,
                pasta: {
                    id: '657337d347595c11401b1c33',
                    nome: 'Nova Pasta Teste'
                }
            }
        })

        const mockUpdateFolders = jest.fn().mockImplementation((folders, updatedFolder) => {
            return folders.map(folder => (folder.id === updatedFolder.id ? { ...folder, ...updatedFolder } : folder))
        })

        const mockOrganizeFolders = jest
            .fn()
            .mockImplementation(folders => folders.sort((a, b) => a.nome.localeCompare(b.nome)))

        jest.mock('../../../../../hooks/useFolder', () => ({
            useFolder: jest.fn().mockReturnValue({
                updateFolders: mockUpdateFolders,
                organizeFolders: mockOrganizeFolders
            })
        }))

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        useMutation.mockReturnValue({
            mutateAsync: mockMutateEditFolder
        })

        const setUploadedFilesMock = jest.fn()
        const onUploadedFilesChangeMock = jest.fn()

        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    folderUnselectedId='1'
                    setUploadedFiles={setUploadedFilesMock}
                    onUploadedFilesChange={onUploadedFilesChangeMock}
                    uploadedFiles={mockedUploadedFiles}
                    opcaoSelecionada={'657337d347595c11401b1c33'}
                />
            </QueryClientProvider>
        )

        const moreVertIcon = screen.getByTestId('folder-action-menu-3-dots-657337d347595c11401b1c33')
        fireEvent.click(moreVertIcon)

        await waitFor(() => {
            const editButton = screen.getByTestId('edit-button-657337d347595c11401b1c33')
            fireEvent.click(editButton)
        })

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'Pasta Teste' } })

        await waitFor(() => {
            const confirmButton = screen.getByText('Confirmar')
            fireEvent.click(confirmButton)
        })

        await waitFor(() => {
            expect(setUploadedFilesMock).toHaveBeenCalled()
            expect(onUploadedFilesChangeMock).toHaveBeenCalled()
        })
    })

    it('should delete a folder and update the state correctly', async () => {
        const mockMutateDeleteFolder = jest.fn().mockResolvedValue({
            status: true
        })

        jest.mock('../../../../../hooks/useFolder', () => ({
            useFolder: jest.fn().mockReturnValue({
                updateFolders: jest.fn(),
                organizeFolders: jest.fn()
            })
        }))

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        useMutation.mockReturnValue({
            mutateAsync: mockMutateDeleteFolder
        })

        const setUploadedFilesMock = jest.fn()
        const onUploadedFilesChangeMock = jest.fn()
        const setOpcaoSelecionadaMock = jest.fn()

        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    folderUnselectedId='1'
                    setUploadedFiles={setUploadedFilesMock}
                    onUploadedFilesChange={onUploadedFilesChangeMock}
                    uploadedFiles={mockedUploadedFiles}
                    opcaoSelecionada={'657337d347595c11401b1c33'}
                    setOpcaoSelecionada={setOpcaoSelecionadaMock}
                />
            </QueryClientProvider>
        )

        const listFolders = screen.getByTestId('list-folders-custom')
        fireEvent.click(listFolders)

        await waitFor(() => {
            const moreVertIcon = screen.getByTestId('folder-action-menu-3-dots-657337d347595c11401b1c33')
            fireEvent.click(moreVertIcon)
        })

        await waitFor(() => {
            const deleteButton = screen.getByTestId('delete-button-657337d347595c11401b1c33')
            fireEvent.click(deleteButton)
        })

        await waitFor(() => {
            const confirmButton = screen.getByText('Confirmar')
            fireEvent.click(confirmButton)
        })

        await waitFor(() => {
            expect(mockMutateDeleteFolder).toHaveBeenCalledWith('657337d347595c11401b1c33')

            expect(setUploadedFilesMock).toHaveBeenCalledWith(
                expect.arrayContaining(mockedUploadedFiles.filter(folder => folder.id !== '657337d347595c11401b1c33'))
            )

            expect(onUploadedFilesChangeMock).toHaveBeenCalledWith(
                expect.arrayContaining(mockedUploadedFiles.filter(folder => folder.id !== '657337d347595c11401b1c33'))
            )
        })
    })

    it('should delete a folder without changing selected option when deleting non-selected folder', async () => {
        const mockMutateDeleteFolder = jest.fn().mockResolvedValue({
            status: true
        })

        jest.mock('../../../../../hooks/useFolder', () => ({
            useFolder: jest.fn().mockReturnValue({
                updateFolders: jest.fn(),
                organizeFolders: jest.fn()
            })
        }))

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        useMutation.mockReturnValue({
            mutateAsync: mockMutateDeleteFolder
        })

        const setUploadedFilesMock = jest.fn()
        const onUploadedFilesChangeMock = jest.fn()
        const setOpcaoSelecionadaMock = jest.fn()

        render(
            <QueryClientProvider client={queryClient}>
                <FileUpload
                    {...defaultProps}
                    folderUnselectedId='1'
                    setUploadedFiles={setUploadedFilesMock}
                    onUploadedFilesChange={onUploadedFilesChangeMock}
                    uploadedFiles={mockedUploadedFiles}
                    opcaoSelecionada={'657337d347595c11401b1c33'}
                    setOpcaoSelecionada={setOpcaoSelecionadaMock}
                />
            </QueryClientProvider>
        )

        const listFolders = screen.getByTestId('list-folders-custom')
        fireEvent.click(listFolders)

        await waitFor(() => {
            const moreVertIcon = screen.getByTestId('folder-action-menu-3-dots-657337d347595c11401b1234')
            fireEvent.click(moreVertIcon)
        })

        await waitFor(() => {
            const deleteButton = screen.getByTestId('delete-button-657337d347595c11401b1234')
            fireEvent.click(deleteButton)
        })

        await waitFor(() => {
            const confirmButton = screen.getByText('Confirmar')
            fireEvent.click(confirmButton)
        })

        await waitFor(() => {
            expect(mockMutateDeleteFolder).toHaveBeenCalledWith('657337d347595c11401b1234')

            expect(setUploadedFilesMock).toHaveBeenCalledWith(
                expect.arrayContaining(mockedUploadedFiles.filter(folder => folder.id !== '657337d347595c11401b1234'))
            )

            expect(onUploadedFilesChangeMock).toHaveBeenCalledWith(
                expect.arrayContaining(mockedUploadedFiles.filter(folder => folder.id !== '657337d347595c11401b1234'))
            )

            // Verificar que a pasta selecionada não foi alterada
            expect(setOpcaoSelecionadaMock).not.toHaveBeenCalled()
        })
    })
})
