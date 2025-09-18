import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '../../pages/NotFound'

const mockedNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate
}))

jest.mock('../../infrastructure/environments/Environments', () => ({
    Environments: {
        email: 'test@example.com'
    }
}))

describe('NotFound Component', () => {
    it('renders the NotFound component with correct text', () => {
        render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        )

        expect(screen.getByText('404')).toBeInTheDocument()
        expect(screen.getByText('Página não encontrada!')).toBeInTheDocument()
        expect(screen.getByText('Caso o erro persista, entre em contato com o gestor do sistema:')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('renders a mailto link with the correct email', () => {
        render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        )

        const emailLink = screen.getByRole('link', { name: /test@example.com/i })
        expect(emailLink).toHaveAttribute(
            'href',
            'mailto:test@example.com?subject=Análise Controle - Página não encontrada.'
        )
    })

    it('navigates to the home page when the button is clicked', () => {
        render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        )

        const button = screen.getByRole('button', { name: /Voltar a página inicial/i })
        userEvent.click(button)

        expect(mockedNavigate).toHaveBeenCalledWith('/')
    })
})
