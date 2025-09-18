import React from 'react'
import ModalRealtime from '../../../components/realtime-audio/ModalRealtime'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// jest.mock('../../../components/realtime-audio/AudioControl', () => {
//     const React = require('react')
//     const forwardRef = React.forwardRef
//     return jest.fn().mockImplementation(
//         forwardRef((props, ref) => (
//             <div
//                 data-testid='audio-control'
//                 ref={ref as React.Ref<HTMLDivElement>}
//             />
//         ))
//     )
// })

describe('ModalRealtime Component', () => {
    const mockHandleOpenModal = jest.fn()
    const defaultProps = {
        openModal: true,
        handleOpenModal: mockHandleOpenModal,
        titulo: 'Teste de Modal',
        descricao: '<p>Descrição do Modal</p>'
    }

    it('deve renderizar o título e a descrição corretamente', () => {
        render(<ModalRealtime {...defaultProps} />)

        expect(screen.getByText('Teste de Modal')).toBeInTheDocument()
        expect(screen.getByText('Descrição do Modal')).toBeInTheDocument()
    })

    it('deve chamar handleOpenModal(false) ao fechar o modal', () => {
        render(<ModalRealtime {...defaultProps} />)

        const closeButton = screen.getByLabelText('close')
        fireEvent.click(closeButton)

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('não deve renderizar o modal quando openModal for false', () => {
        render(
            <ModalRealtime
                {...defaultProps}
                openModal={false}
            />
        )
        expect(screen.queryByText('Teste de Modal')).not.toBeInTheDocument()
    })

    it('deve limpar o audioControl ao fechar o modal', () => {
        render(<ModalRealtime {...defaultProps} />)

        const closeButton = screen.getByLabelText('close')
        fireEvent.click(closeButton)

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })
})
