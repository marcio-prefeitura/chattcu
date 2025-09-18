import React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { render, screen, fireEvent } from '@testing-library/react'

import '@testing-library/jest-dom'
import GptStoreSave, { GptStoreSaveProps } from '../../../../components/sidebar/store/GptStoreSave'
import { IUserInfo } from '../../../../hooks/useUserInfo'

jest.mock('../../../../components/select-base/SelectBase', () => () => <div data-testid='select-base'>SelectBase</div>)
jest.mock('../../../../components/chat-box/InputFiles', () => () => <div data-testid='input-files'>InputFiles</div>)
jest.mock('../../../../utils/AlertUtils', () => ({
    __esModule: true,
    default: () => ({
        alert: null,
        handleAlert: jest.fn()
    })
}))

describe('GptStoreSave Component', () => {
    const mockProfile: IUserInfo = {
        login: 'testuser',
        name: 'Test User',
        initialLetters: 'TU',
        perfilDev: true,
        perfilPreview: false,
        perfilDevOrPreview: true
    }

    const renderComponent = (props: Partial<GptStoreSaveProps> = {}) => {
        return render(
            <MemoryRouter>
                <GptStoreSave profile={{ ...mockProfile, ...props }} />
            </MemoryRouter>
        )
    }

    it('renders all required elements', () => {
        renderComponent()

        expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Descrição')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Instruções')).toBeInTheDocument()
        expect(screen.getByTestId('select-base')).toBeInTheDocument()
        expect(screen.getByTestId('input-files')).toBeInTheDocument()
    })

    it('shows validation messages on submitting empty form', () => {
        renderComponent()
        fireEvent.click(screen.getByText('Criar Especialista'))

        expect(screen.getByText('Este campo Nome é obrigatório.')).toBeInTheDocument()
        expect(screen.getByText('Este campo Descrição é obrigatório.')).toBeInTheDocument()
        expect(screen.getByText('Este campo Instruções é obrigatório.')).toBeInTheDocument()
    })

    it('updates form fields on user input', () => {
        renderComponent()
        const nomeInput = screen.getByPlaceholderText('Nome')

        fireEvent.change(nomeInput, { target: { value: 'Teste Nome' } })
        expect(nomeInput).toHaveValue('Teste Nome')
    })

    it('submits the form successfully when fields are valid', () => {
        const { container } = renderComponent()
        const nomeInput = screen.getByPlaceholderText('Nome')
        const descricaoInput = screen.getByPlaceholderText('Descrição')
        const instrucoesInput = screen.getByPlaceholderText('Instruções')

        fireEvent.change(nomeInput, { target: { value: 'Teste Nome' } })
        fireEvent.change(descricaoInput, { target: { value: 'Teste Descrição' } })
        fireEvent.change(instrucoesInput, { target: { value: 'Teste Instruções' } })

        fireEvent.submit(container.querySelector('form')!)

        expect(screen.queryByText('Este campo Nome é obrigatório.')).not.toBeInTheDocument()
        expect(screen.queryByText('Este campo Descrição é obrigatório.')).not.toBeInTheDocument()
        expect(screen.queryByText('Este campo Instruções é obrigatório.')).not.toBeInTheDocument()
    })

    it('renders SelectBase and InputFiles components correctly', () => {
        renderComponent()

        expect(screen.getByTestId('select-base')).toBeInTheDocument()
        expect(screen.getByTestId('input-files')).toBeInTheDocument()
    })

    it('should clear the primeiroQuebraGelo field when the clear icon is clicked', () => {
        renderComponent()

        const textField = screen.getByPlaceholderText('Primeiro Quebra-gelo') as HTMLInputElement

        fireEvent.change(textField, { target: { value: 'Texto de exemplo' } })

        expect(textField.value).toBe('Texto de exemplo')

        const clearButton = screen.getByTestId('clear-files-1')

        fireEvent.click(clearButton)
        expect(textField.value).toBe('')
    })

    it('should clear the segundoQuebraGelo field when the clear icon is clicked', () => {
        renderComponent()

        const textField = screen.getByPlaceholderText('Segundo Quebra-gelo') as HTMLInputElement

        fireEvent.change(textField, { target: { value: 'Texto de exemplo' } })

        expect(textField.value).toBe('Texto de exemplo')

        const clearButton = screen.getByTestId('clear-files-2')

        fireEvent.click(clearButton)
        expect(textField.value).toBe('')
    })

    it('should clear the terceiroQuebraGelo field when the clear icon is clicked', () => {
        renderComponent()

        const textField = screen.getByPlaceholderText('Terceiro Quebra-gelo') as HTMLInputElement

        fireEvent.change(textField, { target: { value: 'Texto de exemplo' } })

        expect(textField.value).toBe('Texto de exemplo')

        const clearButton = screen.getByTestId('clear-files-3')

        fireEvent.click(clearButton)
        expect(textField.value).toBe('')
    })

    it('should clear the quartoQuebraGelo field when the clear icon is clicked', () => {
        renderComponent()

        const textField = screen.getByPlaceholderText('Quarto Quebra-gelo') as HTMLInputElement

        fireEvent.change(textField, { target: { value: 'Texto de exemplo' } })

        expect(textField.value).toBe('Texto de exemplo')

        const clearButton = screen.getByTestId('clear-files-4')

        fireEvent.click(clearButton)
        expect(textField.value).toBe('')
    })

    it('handles file input correctly', () => {
        renderComponent()
        const fileInput = screen.getByTestId('input-files')

        expect(fileInput).toBeInTheDocument()
    })
})
