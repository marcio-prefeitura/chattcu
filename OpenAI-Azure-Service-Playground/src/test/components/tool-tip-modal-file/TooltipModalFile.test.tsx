import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useFileDownload } from '../../../hooks/useFileDownload'
import TooltipModalFile from '../../../components/tooltip-modal-file/TooltipModalFile'

// Mock the useFileDownload hook
jest.mock('../../../hooks/useFileDownload', () => ({
    useFileDownload: jest.fn()
}))

describe('TooltipModalFile', () => {
    const mockHandleOpenModal = jest.fn()
    const mockDownloadSingleFile = jest.fn()

    const mockTrecho = {
        id_arquivo_mongo: 'test-id',
        id_registro: 'Test Title - número 123',
        conteudo: 'Test content',
        pagina_arquivo: 1
    }

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(useFileDownload as jest.Mock).mockReturnValue({
            downloadSingleFile: mockDownloadSingleFile
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders modal when open', () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('does not render when trecho is null', () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={null}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.queryByText('Download')).not.toBeInTheDocument()
    })

    it('closes modal when close button is clicked', () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        fireEvent.click(screen.getByLabelText('close'))
        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('closes modal when "Fechar" button is clicked', () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        fireEvent.click(screen.getByText('Fechar'))
        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('handles file download correctly', async () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        fireEvent.click(screen.getByText('Download'))

        expect(screen.getByTestId('progressbar')).toBeInTheDocument()

        await waitFor(() => {
            expect(mockDownloadSingleFile).toHaveBeenCalledWith({
                id: mockTrecho.id_arquivo_mongo,
                nome: mockTrecho.id_arquivo_mongo
            })
        })
    })

    it('handles content formatting for null page_arquivo', () => {
        const trechoWithoutPage = {
            ...mockTrecho,
            pagina_arquivo: null,
            conteudo: 'RESUMO Test content RESUMO'
        }

        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={trechoWithoutPage}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.getByText('Test content')).toBeInTheDocument()
        expect(screen.queryByText('RESUMO')).not.toBeInTheDocument()
    })

    it('disables download button while downloading', async () => {
        render(
            <TooltipModalFile
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        const downloadButton = screen.getByText('Download').closest('button')
        expect(downloadButton).not.toBeDisabled()

        fireEvent.click(downloadButton!)

        expect(downloadButton).toBeDisabled()

        await waitFor(() => {
            expect(downloadButton).not.toBeDisabled()
        })
    })
})
