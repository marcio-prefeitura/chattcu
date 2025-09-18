import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AcessoNegado } from '../../pages/AcessoNegado'

// jest.mock('../../infrastructure/api', () => ({
//     logout: jest.fn()
// }))

describe('AcessoNegado Component', () => {
    let queryClient

    beforeEach(() => {
        jest.mock('@azure/msal-browser')
        jest.mock('@azure/msal-react')
        jest.mock('../../', () => ({
            msalInstance: {
                initialize: jest.fn().mockImplementation(() => Promise.resolve())
            }
        }))
        queryClient = new QueryClient()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders component properly', () => {
        const { getByText } = render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <AcessoNegado />
                </QueryClientProvider>
            </MemoryRouter>
        )

        expect(getByText('Acesso Negado!')).toBeInTheDocument()
        expect(getByText('Seu usuário não tem permissão para acessar essa plataforma')).toBeInTheDocument()
    })

    it('calls logout function when "Sair" button is clicked', async () => {
        const { getByText } = render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <AcessoNegado />
                </QueryClientProvider>
            </MemoryRouter>
        )

        fireEvent.click(getByText('Sair'))
    })
})
