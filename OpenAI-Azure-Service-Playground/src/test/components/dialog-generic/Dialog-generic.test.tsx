import { render, fireEvent } from '@testing-library/react'
import DialogGeneric from '../../../components/dialog-generic/DialogGeneric'

describe('DialogGeneric', () => {
    it('deve renderizar corretamente com os dados fornecidos', () => {
        const handleClose = jest.fn()
        const onCancel = jest.fn()
        const onConfirm = jest.fn()

        const { getByText } = render(
            <DialogGeneric
                open={true}
                onClose={handleClose}
                titulo='Título do Diálogo'
                conteudo='Conteúdo do Diálogo'
                icone='icone-aqui'
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmText='Confirmar'
                cancelText='Cancelar'
            />
        )

        expect(getByText('Título do Diálogo')).toBeInTheDocument()
        expect(getByText('Conteúdo do Diálogo')).toBeInTheDocument()
        expect(getByText('Cancelar')).toBeInTheDocument()
        expect(getByText('Confirmar')).toBeInTheDocument()
    })

    it('deve chamar a função onCancel ao clicar no botão de cancelar', () => {
        const handleClose = jest.fn()
        const onCancel = jest.fn()
        const onConfirm = jest.fn()

        const { getByTestId } = render(
            <DialogGeneric
                open={true}
                onClose={handleClose}
                titulo='Título do Diálogo'
                conteudo='Conteúdo do Diálogo'
                icone='icone-aqui'
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmText='Confirmar'
                cancelText='Cancelar'
            />
        )

        fireEvent.click(getByTestId('cancel-clear-all-button'))

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('deve chamar a função onConfirm ao clicar no botão de confirmar', () => {
        const handleClose = jest.fn()
        const onCancel = jest.fn()
        const onConfirm = jest.fn()

        const { getByTestId } = render(
            <DialogGeneric
                open={true}
                onClose={handleClose}
                titulo='Título do Diálogo'
                conteudo='Conteúdo do Diálogo'
                icone='icone-aqui'
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmText='Confirmar'
                cancelText='Cancelar'
            />
        )

        fireEvent.click(getByTestId('confirm-clear-all-button'))

        expect(onConfirm).toHaveBeenCalledTimes(1)
    })
})
