import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadError from '../../../components/sidebar/upload/upload-status/upload-error/UploadError'

const mockRemoveErrorMessage = jest.fn()

describe('UploadError', () => {
    afterEach(() => {
        mockRemoveErrorMessage.mockClear()
    })

    it('deve renderizar corretamente', () => {
        render(
            <UploadError
                name='Arquivo.txt'
                msgError='Erro ao carregar o arquivo'
                removeErrorMessage={mockRemoveErrorMessage}
            />
        )

        // Verificar se o nome do arquivo é exibido
        expect(screen.getByText('Arquivo.txt')).toBeInTheDocument()

        // Verificar se a mensagem de erro é exibida
        expect(screen.getByText('Erro ao carregar o arquivo')).toBeInTheDocument()

        // Verificar se o botão de fechar está presente
        expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    it('deve chamar removeErrorMessage ao clicar no botão de fechar', () => {
        render(
            <UploadError
                name='Arquivo.txt'
                msgError='Erro ao carregar o arquivo'
                removeErrorMessage={mockRemoveErrorMessage}
            />
        )

        // Clicar no botão de fechar
        fireEvent.click(screen.getByTestId('cancel-button'))

        // Verificar se a função removeErrorMessage foi chamada com o nome correto
        expect(mockRemoveErrorMessage).toHaveBeenCalledWith('Arquivo.txt')
        expect(mockRemoveErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('deve renderizar corretamente a estrutura do componente', () => {
        render(
            <UploadError
                name='Arquivo.pdf'
                msgError='Erro de validação'
                removeErrorMessage={mockRemoveErrorMessage}
            />
        )

        // Verificar se a estrutura do componente está renderizada corretamente
        const uploadError = screen.getByTestId('upload-error')
        expect(uploadError).toBeInTheDocument()

        const content = uploadError.querySelector('.upload-error__content')
        expect(content).toBeInTheDocument()

        const labels = content?.querySelector('.upload-error__labels')
        expect(labels).toBeInTheDocument()

        const nameLabel = labels?.querySelector('.upload-error__name')
        expect(nameLabel).toHaveTextContent('Arquivo.pdf')

        const msgError = screen.getByText('Erro de validação')
        expect(msgError).toBeInTheDocument()
    })
})
