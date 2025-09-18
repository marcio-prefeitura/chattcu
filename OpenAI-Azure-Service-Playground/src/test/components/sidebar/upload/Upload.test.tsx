import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Upload from '../../../../components/sidebar/upload/Upload'
import { ISelectedFiles } from '../../../../shared/interfaces/SelectedFiles'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { AgentModel } from '../../../../shared/interfaces/AgentModel'
import { IFolder } from '../../../../shared/interfaces/Folder'
import React from 'react'

const mockFolders: IFolder[] = [
    {
        id: '1',
        nome: 'Folder 1',
        usuario: '',
        st_removido: false,
        id_pasta_pai: '',
        data_criacao: undefined,
        st_arquivo: false,
        tamanho: '',
        tipo_midia: '',
        nome_blob: '',
        status: '',
        arquivos: [],
        open: false,
        selected: false
    },
    {
        id: '2',
        nome: 'Folder 2',
        usuario: '',
        st_removido: false,
        id_pasta_pai: '',
        data_criacao: undefined,
        st_arquivo: false,
        tamanho: '',
        tipo_midia: '',
        nome_blob: '',
        status: '',
        arquivos: [],
        open: false,
        selected: false
    }
]
jest.mock('../../../../components/sidebar/history/AgentAccordion', () => ({
    ...jest.requireActual('../../../../components/sidebar/history/AgentAccordion'),
    getAgentByValue: jest.fn(),
    atualizaAgenteSelecionadoNoCache: jest.fn()
}))

jest.mock('../../../../components/sidebar/upload/fileupload/FileUpload', () => props => (
    <div data-testid='file-upload'>
        <button onClick={() => props.onSelectFile([{ name: 'file1' }])}>Select File</button>
        <button onClick={() => props.onMoveFolder([{ name: 'movedFile' }])}>Move Folder</button>
        <button onClick={() => props.onSelectFolder(['Folder1', 'Folder2'])}>Select Folder</button>
        <button onClick={() => props.handleMessageSuccess('Upload successful')}>Trigger Success</button>
        <button onClick={() => props.handleMessageErro('Upload failed')}>Trigger Error</button>
        <button onClick={() => props.onUploadedFilesChange(mockFolders)}>Update Folders</button>
    </div>
))

jest.mock('../../../../components/message-toast/MessageToastError', () => ({ onClose }) => (
    <button
        data-testid='error-message'
        onClick={onClose}>
        Error Message
    </button>
))
jest.mock('../../../../components/message-toast/MessageToastSuccess', () => ({ onClose }) => (
    <button
        data-testid='success-message'
        onClick={onClose}>
        Success Message
    </button>
))

const queryClient = new QueryClient()

describe('Upload Component', () => {
    const defaultProps = {
        profile: {} as IUserInfo,
        updatedFoldersFromChipsActions: [],
        filesSelected: [] as ISelectedFiles[],
        setFilesSelected: jest.fn(),
        setSelectedAgent: jest.fn(),
        selectedAgent: { valueAgente: 'some-agent' } as AgentModel | undefined
    }

    const renderComponent = () =>
        render(
            <QueryClientProvider client={queryClient}>
                <Upload {...defaultProps} />
            </QueryClientProvider>
        )

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    test('renders FileUpload component', () => {
        renderComponent()
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
    })

    test('renders success and error message components', () => {
        renderComponent()
        const triggerSuccessButton = screen.getByText('Trigger Success')
        fireEvent.click(triggerSuccessButton)
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
        const triggerErrorButton = screen.getByText('Trigger Error')
        fireEvent.click(triggerErrorButton)
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })

    test('calls handleFileSelection and updates filesSelected', () => {
        renderComponent()
        const selectFileButton = screen.getByText('Select File')
        fireEvent.click(selectFileButton)

        expect(defaultProps.setFilesSelected).toHaveBeenCalledWith([{ name: 'file1' }])
        expect(defaultProps.setSelectedAgent).toHaveBeenCalled()
    })

    test('displays success message on handleMessageSucess call', () => {
        renderComponent()
        const triggerSuccessButton = screen.getByText('Trigger Success')
        fireEvent.click(triggerSuccessButton)

        expect(screen.getByTestId('success-message')).toBeInTheDocument()
    })

    test('displays error message on handleMessageErro call', () => {
        renderComponent()
        const triggerErrorButton = screen.getByText('Trigger Error')
        fireEvent.click(triggerErrorButton)

        expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })

    test('calls handleFileSelection and updates selectedAgent if valueAgente exists', () => {
        renderComponent()
        const selectFileButton = screen.getByText('Select File')
        fireEvent.click(selectFileButton)

        expect(defaultProps.setSelectedAgent).toHaveBeenCalled()
    })

    test('closes success message on onClose', () => {
        renderComponent()
        const triggerSuccessButton = screen.getByText('Trigger Success')
        fireEvent.click(triggerSuccessButton)

        const successMessage = screen.getByTestId('success-message')
        expect(successMessage).toBeInTheDocument()

        fireEvent.click(successMessage)
        expect(screen.queryByTestId('success-message')).not.toBeInTheDocument()
    })

    test('closes error message on onClose', () => {
        renderComponent()
        const triggerErrorButton = screen.getByText('Trigger Error')
        fireEvent.click(triggerErrorButton)

        const errorMessage = screen.getByTestId('error-message')
        expect(errorMessage).toBeInTheDocument()
        fireEvent.click(errorMessage)
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    test('calls handleMoveFolder and updates filesSelected', () => {
        renderComponent()
        const moveFolderButton = screen.getByText('Move Folder')
        fireEvent.click(moveFolderButton)

        expect(defaultProps.setFilesSelected).toHaveBeenCalledWith([{ name: 'movedFile' }])
    })

    test('calls handleFolderSelection and updates foldersSelected', () => {
        renderComponent()
        const selectFolderButton = screen.getByText('Select Folder')
        fireEvent.click(selectFolderButton)

        expect(screen.queryByTestId('file-upload')).toBeInTheDocument()
    })

    test('updates foldersRef.current with the folders passed', () => {
        const foldersRef = { current: [] as IFolder[] }
        const mockUpdateFolders = jest.fn()
        jest.spyOn(React, 'useRef').mockReturnValue(foldersRef)

        const updatedProps = {
            ...defaultProps,
            updateFolders: mockUpdateFolders
        }

        render(
            <QueryClientProvider client={queryClient}>
                <Upload {...updatedProps} />
            </QueryClientProvider>
        )

        const updateFoldersButton = screen.getByText('Update Folders')
        fireEvent.click(updateFoldersButton)

        expect(foldersRef.current).toEqual(mockFolders)
    })
})
