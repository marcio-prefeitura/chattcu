import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as api from '../../../../infrastructure/api'
import GptStoreContent from '../../../../components/sidebar/store/GptStoreContent'

// Mock das APIs
jest.mock('../../../../infrastructure/api', () => ({
    listCategorias: jest.fn(),
    listTotaisEspecialistasPorTipo: jest.fn(),
    listEspecialistasPaginado: jest.fn()
}))

const mockCategorias = [{ nome: 'Categoria 1' }, { nome: 'Categoria 2' }]

const mockTotaisEspecialistas = [
    { categoria: 'Categoria 1', total: 10 },
    { categoria: 'Categoria 2', total: 5 }
]

const mockEspecialistasPaginado = {
    especialistas: [
        {
            valueAgente: '1',
            labelAgente: 'Especialista 1',
            icon: 'icon1',
            descricao: 'Descrição 1',
            autor: 'Autor 1',
            categoria: { nome: 'Categoria 1' }
        },
        {
            valueAgente: '2',
            labelAgente: 'Especialista 2',
            icon: 'icon2',
            descricao: 'Descrição 2',
            autor: 'Autor 2',
            categoria: { nome: 'Categoria 1' }
        }
    ],
    total: 10
}

const queryClient = new QueryClient()
const mockProfile = {
    login: 'testuser',
    name: 'Test User',
    initialLetters: 'TU',
    perfilDev: true,
    perfilPreview: false,
    perfilDevOrPreview: true
}
const renderComponent = (props = {}) => {
    render(
        <QueryClientProvider client={queryClient}>
            <GptStoreContent
                profile={mockProfile}
                redirectForm={false}
                setRedirectForm={jest.fn()}
                {...props}
            />
        </QueryClientProvider>
    )
}

describe('GptStoreContent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        api.listCategorias.mockResolvedValue(mockCategorias)
        api.listTotaisEspecialistasPorTipo.mockResolvedValue(mockTotaisEspecialistas)
        api.listEspecialistasPaginado.mockResolvedValue(mockEspecialistasPaginado)
    })

    it('deve renderizar o componente com categorias e especialistas', async () => {
        renderComponent()

        expect(screen.getByText('Especialistas')).toBeInTheDocument()
        expect(screen.getByText(/Explore e desenvolva versões customizadas/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText('Categoria 1')).toBeInTheDocument()
            expect(screen.getByText('Categoria 2')).toBeInTheDocument()
        })
    })

    it('deve carregar especialistas ao clicar em uma aba', async () => {
        renderComponent()

        await waitFor(() => {
            expect(screen.getByText('Categoria 1')).toBeInTheDocument()
        })

        const tab = screen.getByText('Categoria 1')
        fireEvent.click(tab)

        await waitFor(() => {
            expect(screen.getByText('Especialista 1')).toBeInTheDocument()
            expect(screen.getByText('Especialista 2')).toBeInTheDocument()
        })
    })

    it('deve redirecionar para o formulário ao clicar no botão "Criar Especialista"', () => {
        const setRedirectForm = jest.fn()
        renderComponent({ setRedirectForm })

        const criarButton = screen.getByText('Criar Especialista')
        fireEvent.click(criarButton)

        expect(setRedirectForm).toHaveBeenCalledWith(true)
    })
})
