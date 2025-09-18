import { render, screen } from '../../test-utils'
import UnauthenticatedErrorBoundary from '../../../infrastructure/auth/UnauthenticatedErrorBoundary'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import moxios from 'moxios'
import { InTeamsContext } from '../../../context/AppContext'
import * as api from '../../../infrastructure/api'

describe('<UnauthenticatedErrorBoundary />', () => {
    const ChildHttp401 = () => {
        useQuery(['key'], () => axios.get('/uri?param=012'), {
            useErrorBoundary: error => error?.response?.status === 401
        })
        return <div data-testid='child' />
    }

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterAll(() => {
        jest.clearAllMocks()
    })

    beforeEach(() => {
        moxios.install()
    })

    afterEach(() => {
        moxios.uninstall()
    })

    it('Deve redirecionar para o link de login em caso de erro HTTP 401', async () => {
        moxios.stubRequest('/uri?param=012', { status: 401 })

        render(
            <UnauthenticatedErrorBoundary>
                <ChildHttp401 />
            </UnauthenticatedErrorBoundary>
        )

        await moxios.wait(() => {
            expect(screen.queryByTestId('child')).not.toBeInTheDocument()
            expect(screen.getByText('Usuário não autenticado. Redirecionando para tela de login...')).toBeVisible()
        })
    })

    it('Deve exibir mensagem de erro para erro HTTP 403', async () => {
        moxios.stubRequest('/uri?param=012', { status: 403 })

        render(
            <UnauthenticatedErrorBoundary>
                <ChildHttp401 />
            </UnauthenticatedErrorBoundary>
        )

        await moxios.wait(() => {
            expect(screen.queryByTestId('child')).not.toBeInTheDocument()
            expect(screen.getByText('Usuário Sem permissão para realizar operação')).toBeVisible()
        })
    })

    it('Deve carregar os componentes filhos para erro diferente de HTTP 401 ou 403', async () => {
        moxios.stubRequest('/uri?param=012', { status: 400 })

        render(
            <UnauthenticatedErrorBoundary>
                <ChildHttp401 />
            </UnauthenticatedErrorBoundary>
        )

        await moxios.wait(() => {
            expect(screen.getByTestId('child')).toBeVisible()
        })
    })

    it('Deve recarregar a página quando inTeams é true', async () => {
        const reloadMock = jest.fn()
        delete window.location
        window.location = { reload: reloadMock }

        render(
            <InTeamsContext.Provider value={{ inTeams: true }}>
                <UnauthenticatedErrorBoundary>
                    <ChildHttp401 />
                </UnauthenticatedErrorBoundary>
            </InTeamsContext.Provider>
        )

        await moxios.wait(() => {
            expect(reloadMock).toHaveBeenCalled()
        })

        delete window.location
    })

    it('Deve renderizar os filhos quando não houver erro', () => {
        Object.defineProperty(window, 'location', {
            value: {
                href: '',
                origin: 'http://localhost',
                pathname: '/test-path'
            },
            writable: true
        })

        render(
            <UnauthenticatedErrorBoundary>
                <div data-testid='child' />
            </UnauthenticatedErrorBoundary>
        )

        const child = screen.getByTestId('child')
        expect(child).toBeInTheDocument()
        expect(child).toBeVisible()
    })

    it('Deve redirecionar para o link de login quando gerarLinkLogin for chamado', async () => {
        const mockLinkLogin = jest.fn(() => Promise.resolve('http://localhost/login'))
        jest.spyOn(api, 'linkLogin').mockImplementation(mockLinkLogin)

        Object.defineProperty(window, 'location', {
            value: {
                origin: 'http://localhost',
                pathname: '/current-path',
                href: ''
            },
            writable: true
        })

        const wrapper = new UnauthenticatedErrorBoundary({})
        await wrapper.gerarLinkLogin()

        expect(mockLinkLogin).toHaveBeenCalledWith('http://localhost', '%2Fcurrent-path')
        expect(window.location.href).toBe('http://localhost/login')
    })

    it('Deve registrar o erro e as informações do erro no console ao capturar um erro', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const error = new Error('Erro de teste')
        const errorInfo = { componentStack: 'Stack trace' }

        const wrapper = new UnauthenticatedErrorBoundary({})
        wrapper.componentDidCatch(error, errorInfo)

        expect(consoleErrorSpy).toHaveBeenCalledWith(error)
        expect(consoleErrorSpy).toHaveBeenCalledWith(errorInfo)

        consoleErrorSpy.mockRestore()
    })

    it('Deve retornar o estado correto com base no código de status do erro', () => {
        const error = { response: { status: 401 } }
        const derivedState = UnauthenticatedErrorBoundary.getDerivedStateFromError(error)

        expect(derivedState).toEqual({ error: 401 })

        const errorWithoutResponse = { message: 'Erro sem response' }
        const derivedStateWithoutResponse = UnauthenticatedErrorBoundary.getDerivedStateFromError(errorWithoutResponse)

        expect(derivedStateWithoutResponse).toEqual({ error: undefined })
    })
})
