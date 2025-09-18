import { fireEvent, render } from '../../test-utils'
import { FileUploadView } from '../../../components/file-upload-view/FileUploadView'
import { filesize } from 'filesize'
import moxios from 'moxios'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

const fileUploaded = {
    id: 'file-id',
    file: new File([''], 'filename.pdf', { type: 'application/pdf' }),
    nome: 'filename',
    size: 1000,
    progress: 100,
    uploaded: true,
    error: false,
    selected: false
}

const fileUploading = {
    id: 'file-id',
    file: new File([''], 'filename.pdf', { type: 'application/pdf' }),
    nome: 'filename',
    size: 1000,
    progress: 50,
    uploaded: false,
    error: false,
    selected: false
}

const fileErrorUpload = {
    id: 'file-id',
    file: new File([''], 'filename.pdf', { type: 'application/pdf' }),
    nome: 'filename',
    size: 1000,
    progress: 100,
    uploaded: true,
    error: true,
    msgError: 'error',
    selected: false
}

const onCancelDummy = jest.fn()
const onSelectFileDummy = jest.fn()
const setFileNameDummy = jest.fn()
const openModalDeleteFileDummy = jest.fn()

describe('<FileUploadView />', () => {
    beforeEach(() => {
        moxios.install()
    })

    afterEach(() => {
        moxios.uninstall()
    })

    it('Deve mostrar o nome do arquivo', async () => {
        const readableSize: string = fileUploaded?.size ? `${filesize(fileUploaded?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileUploaded}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const fileNameEl = getByTestId('file-upload-filename')
            expect(fileNameEl).toHaveTextContent('file-id')
        })
    })

    it('Deve mostrar o mensagem de erro', async () => {
        const readableSize: string = fileErrorUpload?.size ? `${filesize(fileErrorUpload?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileErrorUpload}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const fileErrorEl = getByTestId('file-upload-msg-error')
            expect(fileErrorEl).toHaveTextContent('error')
        })
    })

    it('Deve ter botao de lixeira', async () => {
        const readableSize: string = fileErrorUpload?.size ? `${filesize(fileErrorUpload?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileErrorUpload}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const trashBtn = getByTestId('file-upload-trash-btn')
            expect(trashBtn).toBeInTheDocument()
        })
    })

    it('Deve ter botao de cancelar', async () => {
        const readableSize: string = fileErrorUpload?.size ? `${filesize(fileErrorUpload?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileErrorUpload}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const cancelBtn = getByTestId('cancel-button')
            expect(cancelBtn).toBeInTheDocument()
        })
    })

    it('Deve ter barra de progresso', async () => {
        const readableSize: string = fileUploading?.size ? `${filesize(fileUploading?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileUploading}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const progressBar = getByTestId('progressbar')
            expect(progressBar).toBeInTheDocument()
        })
    })

    it('Deve chamar setFileOpenModal', async () => {
        const readableSize: string = fileUploaded?.size ? `${filesize(fileUploaded?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileUploaded}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const trashBtn = getByTestId('file-upload-trash-btn')

            fireEvent.click(trashBtn)

            expect(openModalDeleteFileDummy).toHaveBeenCalled()
            expect(setFileNameDummy).toHaveBeenCalled()
        })
    })

    it('Deve chamar onCancel', async () => {
        const readableSize: string = fileUploaded?.size ? `${filesize(fileUploaded?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileUploaded}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const cancelBtn = getByTestId('cancel-button')

            fireEvent.click(cancelBtn)

            expect(onCancelDummy).toHaveBeenCalled()
        })
    })
    it('Deve chamar onSelectFile ao selecionar um arquivo', async () => {
        const readableSize: string = fileUploaded?.size ? `${filesize(fileUploaded?.size)}` : '0B'

        const { waitFor, getByTestId } = render(
            <FileUploadView
                onCancel={onCancelDummy}
                onSelectFile={onSelectFileDummy}
                fileUpload={fileUploaded}
                readableSize={readableSize}
                handleDeleteFile={setFileNameDummy}
                handleOpenModal={openModalDeleteFileDummy}
            />,
            ['/']
        )

        await waitFor(() => {
            const checkboxInput = getByTestId('file-upload-checkbox').querySelector('input')
            if (checkboxInput) {
                fireEvent.click(checkboxInput)
            }

            expect(onSelectFileDummy).toHaveBeenCalledWith(fileUploaded.id)
        })
    })
})
