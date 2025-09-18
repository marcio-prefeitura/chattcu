import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistoryContentFunctions } from '../../../../components/sidebar/history/historyContentFunctions'
import HistoryContent from '../../../../components/sidebar/history/HistoryContent'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { InTeamsContext } from '../../../../context/AppContext'
import { BrowserRouter } from 'react-router-dom'
import { AlertProvider, useAlert } from '../../../../context/AlertContext'

jest.mock('../../../../components/sidebar/history/historyContentFunctions', () => ({
    useHistoryContentFunctions: jest.fn()
}))

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ chat_id: 'test-chat-id' })
}))

jest.mock('../../../../components/dialog-generic/DialogGeneric', () => {
    return function MockDialog(props: any) {
        return props.open ? (
            <div data-testid={props['data-testid']}>
                <button onClick={props.onCancel}>Cancelar</button>
                <button onClick={props.onConfirm}>Confirmar</button>
            </div>
        ) : null
    }
})
const queryClient = new QueryClient()

const mockChatFixado = { id: 1, fixado: true, data_ultima_iteracao: new Date(), titulo: 'Chat Fixado' }
const mockChatRecent = { id: 2, fixado: false, data_ultima_iteracao: new Date(), titulo: 'Chat Recente' }
const mockUseHistoryContentFunctions = {
    handleScroll: jest.fn(),
    fixOrUpinChat: jest.fn(),
    deleteChat: jest.fn(),
    arqchiveChat: jest.fn(),
    handleConfirmClearAll: jest.fn(),
    handleClearPinnedConversations: jest.fn(),
    handleClearRecentsConversations: jest.fn(),
    openModalDeleteAllFixed: false,
    setOpenModalDeleteAllFixed: jest.fn(),
    openModalDeleteAllRecent: false,
    setOpenModalDeleteAllRecent: jest.fn(),
    openModalUnfixedOrFixedAll: false,
    setOpenModalUnfixedOrFixedAll: jest.fn(),
    totalFixedChats: 1,
    totalRecentChats: 1,
    filters: { searchText: '', page: 1, per_page: 10, fixados: false },
    setFilters: jest.fn(),
    isLoadingNextPage: false,
    fixedData: { pages: [{ total: 1, chats: [mockChatFixado] }] },
    recentData: { pages: [{ total: 1, chats: [mockChatRecent] }] },
    isLoadingRecentChats: false,
    isLoadingFixedChats: false,
    isFetchingNextFixedPage: false,
    isFetchingNextRecentPage: false
}

const mockProfile: IUserInfo = {
    login: '',
    perfilDev: true,
    perfilDevOrPreview: true,
    perfilPreview: true,
    name: '',
    initialLetters: ''
}

const mockProps = {
    profile: mockProfile,
    chats: [],
    agentsExpanded: false,
    fixadoExpanded: true,
    recenteExpanded: true,
    isFiltering: false,
    selectedChatId: null,
    setAgentsExpanded: jest.fn(),
    setFixadoExpanded: jest.fn(),
    setRecenteExpanded: jest.fn(),
    handleClick: jest.fn(),
    handleClick2: jest.fn(),
    handleClose: jest.fn(),
    handleClose2: jest.fn(),
    handleStartShareChat: jest.fn(),
    fixChatOnTop: jest.fn(),
    handleArchiveChat: jest.fn(),
    handleShowModal: jest.fn(),
    handleChatClick: jest.fn(),
    handlEditChat: jest.fn(),
    handleDeleteChat: jest.fn(),
    handleInputChange: jest.fn(),
    handleOpenConfirmClearAllDialog: jest.fn(),
    handleShowDeleteFixedModal: jest.fn(),
    anchorEl: null,
    anchorEl2: null,
    setSelectedAgent: jest.fn(),
    selectedAgent: undefined,
    isArchive: false,
    searchText: '',
    handleNewChat: jest.fn(),
    activeChat: null,
    isAgentSelectionEnabled: false,
    query: '',
    setQuery: jest.fn(),
    isLoading: false,
    isFetching: false,
    setIsModelLocked: jest.fn()
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <InTeamsContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
            <AlertProvider>
                <BrowserRouter>{children}</BrowserRouter>
            </AlertProvider>
        </QueryClientProvider>
    </InTeamsContext.Provider>
)

describe('HistoryContent Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue(mockUseHistoryContentFunctions)
    })

    it('deve renderizar corretamente quando está no Teams', () => {
        const teamsWrapper = ({ children }: { children: React.ReactNode }) => (
            <InTeamsContext.Provider value={true}>
                <QueryClientProvider client={queryClient}>
                    <AlertProvider>
                        <BrowserRouter>{children}</BrowserRouter>
                    </AlertProvider>
                </QueryClientProvider>
            </InTeamsContext.Provider>
        )

        render(<HistoryContent {...mockProps} />, { wrapper: teamsWrapper })

        const historyContent = screen.getByTestId('history-content')
        expect(historyContent).toHaveClass('new-sidebar__message-list__teams')
    })

    it('deve chamar a função de rolagem quando o usuário rola até o fim', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const chatContainer = screen.getByTestId('history-content')

        fireEvent.scroll(chatContainer, {
            target: { scrollTop: chatContainer.scrollHeight - chatContainer.clientHeight }
        })

        expect(mockUseHistoryContentFunctions.handleScroll).toHaveBeenCalled()
    })

    it('deve chamar handleChatClick quando o usuário clica em um chat fixado', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const fixedChat = screen.getByText('Chat Fixado')
        fireEvent.click(fixedChat)

        expect(mockProps.handleChatClick).toHaveBeenCalledWith(mockChatFixado)
    })

    it('deve chamar handleChatClick quando o usuário clica em um chat recente', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const recentChat = screen.getByText('Chat Recente')
        fireEvent.click(recentChat)

        expect(mockProps.handleChatClick).toHaveBeenCalledWith(mockChatRecent)
    })

    it('deve mostrar loading state corretamente', () => {
        const propsWithLoading = {
            ...mockProps,
            isLoadingRecentChats: true,
            isLoadingFixedChats: true
        }

        const mockDataEmpty = {
            ...mockUseHistoryContentFunctions,
            isLoadingRecentChats: true,
            isLoadingFixedChats: true,
            fixedData: { pages: [{ total: 0, chats: [] }] },
            recentData: { pages: [{ total: 0, chats: [] }] }
        }

        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue(mockDataEmpty)

        render(<HistoryContent {...propsWithLoading} />, { wrapper: Wrapper })

        expect(screen.getByTestId('loading-message')).toBeInTheDocument()
        expect(screen.getByText(/Carregando Chats/i)).toBeInTheDocument()
    })

    it('deve mostrar mensagem quando não há resultados', () => {
        const mockEmptyData = {
            ...mockUseHistoryContentFunctions,
            fixedData: { pages: [{ total: 0, chats: [] }] },
            recentData: { pages: [{ total: 0, chats: [] }] }
        }
        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue(mockEmptyData)

        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })
        expect(screen.getByText('Nenhum Resultado Encontrado')).toBeInTheDocument()
    })

    it('deve abrir e fechar modal de desafixar todos', () => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue({
            ...mockUseHistoryContentFunctions,
            openModalUnfixedOrFixedAll: true
        })

        const { getByText } = render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const confirmButton = getByText('Confirmar')
        expect(confirmButton).toBeInTheDocument()

        fireEvent.click(getByText('Cancelar'))
        expect(mockUseHistoryContentFunctions.setOpenModalUnfixedOrFixedAll).toHaveBeenCalledWith(false)
    })

    it('deve abrir e fechar modal de excluir fixados', () => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue({
            ...mockUseHistoryContentFunctions,
            openModalDeleteAllFixed: true
        })

        const { getByText } = render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const confirmButton = getByText('Confirmar')
        expect(confirmButton).toBeInTheDocument()

        fireEvent.click(confirmButton)
        expect(mockUseHistoryContentFunctions.handleClearPinnedConversations).toHaveBeenCalled()
    })

    it('deve abrir e fechar modal de excluir recentes', () => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue({
            ...mockUseHistoryContentFunctions,
            openModalDeleteAllRecent: true
        })

        const { getByText } = render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const confirmButton = getByText('Confirmar')
        expect(confirmButton).toBeInTheDocument()

        fireEvent.click(confirmButton)
        expect(mockUseHistoryContentFunctions.handleClearRecentsConversations).toHaveBeenCalled()
    })

    it('deve alternar estado de expansão dos acordeões', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const fixedHeader = screen.getByText('Fixados')
        fireEvent.click(fixedHeader)
        expect(mockProps.setFixadoExpanded).toHaveBeenCalled()

        const recentHeader = screen.getByText('Recentes')
        fireEvent.click(recentHeader)
        expect(mockProps.setRecenteExpanded).toHaveBeenCalled()
    })

    it('deve atualizar filtro ao digitar', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        const filterInput = screen.getByPlaceholderText('Filtrar recentes ou fixados')
        fireEvent.change(filterInput, { target: { value: 'teste' } })

        expect(filterInput).toHaveValue('teste')
    })

    it('deve chamar handleOpenConfirmClearAllDialog ao tentar desafixar todos', () => {
        const mockDataWithChats = {
            ...mockUseHistoryContentFunctions,
            fixedData: {
                pages: [
                    {
                        total: 1,
                        chats: [mockChatFixado]
                    }
                ]
            }
        }

        ;(useHistoryContentFunctions as jest.Mock).mockReturnValue(mockDataWithChats)

        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })

        mockUseHistoryContentFunctions.setOpenModalUnfixedOrFixedAll(true)
        expect(mockUseHistoryContentFunctions.setOpenModalUnfixedOrFixedAll).toHaveBeenCalledWith(true)
    })

    it('deve chamar funções corretas ao interagir com chat fixado', () => {
        render(<HistoryContent {...mockProps} />, { wrapper: Wrapper })
    })
})
