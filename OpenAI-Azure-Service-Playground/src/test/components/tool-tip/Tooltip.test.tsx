import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TooltipModal from '../../../components/tooltip-modal/TooltipModal'
import { useAlert } from '../../../context/AlertContext'

// Mock the useAlert hook
jest.mock('../../../context/AlertContext', () => ({
    useAlert: jest.fn()
}))

// Mock the CopyLink component
jest.mock('../../../utils/CopyLink', () => {
    return function MockCopyLink({ url, handleAlert }) {
        return (
            <button
                data-testid='copy-link-button'
                onClick={() =>
                    handleAlert({
                        type: 'success',
                        message: 'Link copiado com sucesso!',
                        severity: 'success'
                    })
                }>
                Copy
            </button>
        )
    }
})

describe('TooltipModal', () => {
    const mockHandleOpenModal = jest.fn()
    const mockHandleAlert = jest.fn()

    const mockTrecho = {
        id_registro: 'Test_Title_123',
        conteudo: '<p>Test content with <b>HTML</b></p>',
        link_sistema: 'https://example.com/test'
    }

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(useAlert as jest.Mock).mockReturnValue({
            alert: undefined,
            handleAlert: mockHandleAlert,
            removeAlert: () => {}
        })
        window.open = jest.fn()
        mockHandleAlert.mockClear()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders modal title correctly from id_registro', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('renders HTML content correctly', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        const content = screen.getByText(/Test content with/i)
        expect(content).toBeInTheDocument()
        expect(content.innerHTML).toContain('<b>HTML</b>')
    })

    it('opens link in new tab when clicked', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        const link = screen.getByText(mockTrecho.link_sistema)
        fireEvent.click(link)

        expect(window.open).toHaveBeenCalledWith(mockTrecho.link_sistema, '_blank')
    })

    it('handles copying link and shows success message', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        const copyButton = screen.getByTestId('copy-link-button')
        fireEvent.click(copyButton)

        expect(mockHandleAlert).toHaveBeenCalledWith({
            type: 'success',
            message: 'Link copiado com sucesso!',
            severity: 'success'
        })
    })

    it('renders link section correctly', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.getByText('Link:')).toBeInTheDocument()
        expect(screen.getByText(mockTrecho.link_sistema)).toBeInTheDocument()
    })

    it('applies correct CSS classes', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(document.querySelector('.trechomodal')).toBeInTheDocument()
        expect(document.querySelector('.trechomodal__header')).toBeInTheDocument()
        expect(document.querySelector('.trechomodal__texto')).toBeInTheDocument()
        expect(document.querySelector('.trechomodal__link')).toBeInTheDocument()
    })

    it('handles modal backdrop click', () => {
        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={mockTrecho}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        const backdrop = document.querySelector('.MuiBackdrop-root')
        fireEvent.click(backdrop!)

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('handles empty or malformed id_registro', () => {
        const trechoWithoutUnderscore = {
            ...mockTrecho,
            id_registro: 'TestTitle'
        }

        render(
            <TooltipModal
                openModalTrecho={true}
                trecho={trechoWithoutUnderscore}
                handleOpenModal={mockHandleOpenModal}
            />
        )

        expect(screen.getByText('TestTitle')).toBeInTheDocument()
    })
})
