import { render, fireEvent } from '../../test-utils'
import Sidebar from '../../../components/sidebar/NewSidebar'
// import moxios from 'moxios'
import DialogGenerico from '../../../components/dialog-generic/DialogGeneric'
import { waitFor } from '@testing-library/react'
import { AlertProvider } from '../../../../src/context/AlertContext' // Import AlertProvider and useAlert
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}))

jest.mock('react-markdown', () => props => {
    return <>{props.children}</>
})

jest.mock('remark-gfm', () => props => {
    return <>{props.children}</>
})

const mockProfile = {
    isError: false,
    isLoading: false,
    isSuccess: true,
    perfilDev: false,
    perfilDevOrPreview: false,
    perfilPreview: false,
    refetch: jest.fn(),
    data: {
        nome: 'teste'
    }
}

describe('Sidebar', () => {
    const hideSidebar = jest.fn()
    const onChatClick = jest.fn()
    const updateChatHistory = jest.fn()

    const chatsHistory = [
        {
            id: '1',
            titulo: 'Chat 1',
            usuario: 'Usuario 1',
            mensagens: [
                {
                    conteudo: 'Mensagem 1',
                    papel: 'USER'
                },
                {
                    conteudo: 'Mensagem 2',
                    papel: 'ASSISTANT'
                }
            ],
            apagado: false,
            fixado: false,
            deleting: false,
            editing: false,
            data_criacao: new Date(),
            data_ultima_iteracao: new Date(),
            temp_chat_id: '1'
        },
        {
            id: '2',
            titulo: 'Chat 2',
            usuario: 'Usuario 2',
            mensagens: [
                {
                    conteudo: 'Mensagem 1',
                    papel: 'USER'
                },
                {
                    conteudo: 'Mensagem 2',
                    papel: 'ASSISTANT'
                }
            ],
            apagado: false,
            fixado: false,
            deleting: false,
            editing: false,
            data_criacao: new Date(),
            data_ultima_iteracao: new Date(),
            temp_chat_id: '2'
        }
    ]

    const renderWithAlertProvider = ui => {
        return render(<AlertProvider>{ui}</AlertProvider>)
    }

    it('Deve redirecionar para a rota raiz após o click no botão nova conversa', () => {
        const { user, getByTestId } = renderWithAlertProvider(
            <Sidebar
                profile={mockProfile}
                chatsHistory={chatsHistory}
                hideSidebar={hideSidebar}
                onChatClick={onChatClick}
                updateChatHistory={updateChatHistory}
                handleAppTitle={jest.fn()}
                setIsModelLocked={jest.fn()}
            />
        )

        const buttonNova = getByTestId('new-chat')
        expect(buttonNova).toBeInTheDocument()

        user.click(buttonNova)

        waitFor(() => expect(window.location.pathname).toEqual('/'))
    })

    it('Deve mostrar o botão de nova conversa', () => {
        const { getByTestId } = renderWithAlertProvider(
            <Sidebar
                profile={mockProfile}
                chatsHistory={chatsHistory}
                hideSidebar={hideSidebar}
                updateChatHistory={updateChatHistory}
                handleAppTitle={jest.fn()}
                setIsModelLocked={jest.fn()}
            />
        )

        const button = getByTestId('new-chat')

        expect(button).toBeInTheDocument()
    })

    it('Deve mostrar o botão de limpar todas as conversas', () => {
        const { getByTestId } = renderWithAlertProvider(
            <Sidebar
                profile={mockProfile}
                chatsHistory={chatsHistory}
                hideSidebar={hideSidebar}
                onChatClick={onChatClick}
                updateChatHistory={updateChatHistory}
                handleAppTitle={jest.fn()}
                isLoading={false}
                isSuccess={true}
                isFetching={false}
                inTeams={undefined}
                isMobile={false}
                isShow={false}
                setIsModelLocked={jest.fn()}
            />
        )

        waitFor(() => {
            const button = getByTestId('clear-all-button')
            expect(button).toBeInTheDocument()
        })
    })

    it('Deve mostrar o botão de cancelar e chamar a função onCancel ao clicar', () => {
        const onCancel = jest.fn() // Mock para a função onCancel

        const { getByTestId } = renderWithAlertProvider(
            <DialogGenerico
                open={true}
                onClose={jest.fn()} // Mock para a função onClose
                titulo='Título do Diálogo'
                conteudo='Conteúdo do Diálogo'
                icone='icone-aqui'
                onConfirm={jest.fn()} // Mock para a função onConfirm
                onCancel={onCancel}
                confirmText='Confirmar'
                cancelText='Cancelar'
            />
        )

        const cancelButton = getByTestId('cancel-clear-all-button')
        fireEvent.click(cancelButton) // Simula o clique no botão de cancelar

        expect(cancelButton).toBeInTheDocument() // Verifica se o botão está presente no documento
        expect(cancelButton).toHaveTextContent('Cancelar') // Verifica se o botão contém o texto 'Cancelar'
        expect(onCancel).toHaveBeenCalledTimes(1) // Verifica se a função onCancel foi chamada uma vez
    })

    it('Deve mostrar o botão de confirmar limpar todas as conversas na modal', () => {
        const { user, getByTestId } = renderWithAlertProvider(
            <Sidebar
                profile={mockProfile}
                chatsHistory={chatsHistory}
                hideSidebar={hideSidebar}
                onChatClick={onChatClick}
                updateChatHistory={updateChatHistory}
                handleAppTitle={jest.fn()}
                isLoading={false}
                isSuccess={true}
                isFetching={false}
                inTeams={undefined}
                isMobile={false}
                isShow={false}
                setIsModelLocked={jest.fn()}
            />
        )

        waitFor(() => {
            const button = getByTestId('clear-all-button')
            user.click(button)
        })

        waitFor(() => {
            const button = getByTestId('confirm-clear-all-button')
            expect(button).toBeInTheDocument()
        })
    })
})
