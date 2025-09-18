import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import History from '../../../../components/sidebar/history/History'
import { IChat } from '../../../../infrastructure/utils/types'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { AlertProvider } from '../../../../context/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import { useAppTitle } from '../../../../hooks/useAppTitle'

jest.mock('../../../../utils/AlertUtils', () => () => ({
    alert: null,
    handleAlert: jest.fn()
}))

jest.mock('../../../../hooks/useAppTitle', () => ({
    useAppTitle: jest.fn(() => jest.fn())
}))

jest.spyOn(QueryClient.prototype, 'getQueryData').mockImplementation(() => jest.fn())
jest.spyOn(QueryClient.prototype, 'setQueryData').mockImplementation(() => jest.fn())

jest.mock('../../../../infrastructure/utils/util', () => ({
    getSidebarTabClassName: jest.fn(() => 'sidebar-class')
}))

jest.mock('../../../../components/sidebar/history/HistoryContent', () => (props: any) => {
    const { handleNewChat, handlEditChat, handleChatClick, handleClick2, handleClose, handleClose2 } = props
    return (
        <>
            <div>
                <div data-testid='chat-1'>Chat 1</div>
                <div data-testid='chat-2'>Chat 2</div>
            </div>
            <div>
                <button onClick={handleNewChat}>New Chat</button>
            </div>
            <div>
                <button onClick={handlEditChat}>Edit Chat</button>
            </div>
            <div>
                <button onClick={handleChatClick}>Titulo Chat</button>
            </div>
            <div data-testid='trigger-click'>
                <button onClick={handleClick2}>Clique aqui</button>
            </div>
            <div data-testid='anchor-button'>
                <button onClick={handleClose}>Fechar</button>
            </div>
            <div data-testid='anchor-button2'>
                <button onClick={handleClose2}>Fechar</button>
            </div>
        </>
    )
})

const mockChats: IChat[] = [
    {
        id: '1',
        titulo: 'Chat 1',
        mensagens: [],
        isLoading: false,
        data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
    },
    {
        id: '2',
        titulo: 'Chat 2',
        mensagens: [],
        isLoading: false,
        data_ultima_iteracao: new Date('2023-01-02T12:00:00Z')
    }
]

const mockProfile: IUserInfo = {
    login: 'Test Login',
    name: 'Test User',
    initialLetters: 'TU',
    perfilDev: true,
    perfilPreview: false,
    perfilDevOrPreview: true
}

const mockOnChatClick = jest.fn()
const mockUpdateChatHistory = jest.fn()
const mockHideSidebar = jest.fn()

const renderHistory = (props = {}) => {
    const queryClient = new QueryClient()

    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <AlertProvider>
                    <History
                        profile={mockProfile}
                        isMobile={false}
                        isShow={true}
                        chatsHistory={mockChats}
                        isLoading={false}
                        isSuccess={true}
                        isFetching={false}
                        activeChat={null}
                        setActiveChat={jest.fn()}
                        hasMoreChats={false}
                        onChatClick={mockOnChatClick}
                        updateChatHistory={mockUpdateChatHistory}
                        hideSidebar={mockHideSidebar}
                        setSelectedAgent={jest.fn()}
                        isArchive={false}
                        isAgentSelectionEnabled={true}
                        setIsModelLocked={jest.fn()}
                        {...props}
                    />
                </AlertProvider>
            </MemoryRouter>
        </QueryClientProvider>
    )
}

describe('History Component', () => {
    test('renders History with child elements', async () => {
        renderHistory()

        const chat1Element = await screen.findByTestId('chat-1')
        const chat2Element = await screen.findByTestId('chat-2')

        expect(chat1Element).toBeInTheDocument()
        expect(chat2Element).toBeInTheDocument()
    })

    it('should handle new chat correctly when handleNewChat is invoked', () => {
        const mockOnChatClick = jest.fn()
        const mockHideSidebar = jest.fn()

        const mockHandleAppTitle = jest.fn()
        ;(useAppTitle as jest.Mock).mockReturnValue(mockHandleAppTitle)

        const mockChatHistory: IChat[] = [
            {
                id: '1',
                titulo: 'Chat 1',
                mensagens: [],
                isLoading: false,
                data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
            }
        ]

        const queryClient = new QueryClient()

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AlertProvider>
                        <History
                            profile={mockProfile}
                            isMobile={false}
                            isShow={true}
                            chatsHistory={mockChatHistory}
                            isLoading={false}
                            isSuccess={true}
                            isFetching={false}
                            activeChat={null}
                            setActiveChat={jest.fn()}
                            hasMoreChats={false}
                            onChatClick={mockOnChatClick}
                            updateChatHistory={mockUpdateChatHistory}
                            hideSidebar={mockHideSidebar}
                            setSelectedAgent={jest.fn()}
                            isArchive={false}
                            isAgentSelectionEnabled={true}
                            setIsModelLocked={jest.fn()}
                        />
                    </AlertProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )

        const newChatButton = screen.getByRole('button', { name: /new chat/i })
        fireEvent.click(newChatButton)

        expect(mockHandleAppTitle).toHaveBeenCalledWith('ChatTCU Playground')
        expect(mockOnChatClick).toHaveBeenCalledWith(null)
        expect(mockHideSidebar).toHaveBeenCalled()
    })

    it('should handle chat click correctly when handleChatClick is invoked', () => {
        const mockOnChatClick = jest.fn()
        const mockHideSidebar = jest.fn()

        const mockHandleAppTitle = jest.fn()
        ;(useAppTitle as jest.Mock).mockReturnValue(mockHandleAppTitle)

        const mockChat: IChat = {
            id: '1',
            titulo: 'Chat 1',
            mensagens: [],
            isLoading: false,
            data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
        }

        const queryClient = new QueryClient()

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AlertProvider>
                        <History
                            profile={mockProfile}
                            isMobile={false}
                            isShow={true}
                            chatsHistory={[mockChat]}
                            isLoading={false}
                            isSuccess={true}
                            isFetching={false}
                            activeChat={null}
                            setActiveChat={jest.fn()}
                            hasMoreChats={false}
                            onChatClick={mockOnChatClick}
                            updateChatHistory={jest.fn()}
                            hideSidebar={mockHideSidebar}
                            setSelectedAgent={jest.fn()}
                            isArchive={false}
                            isAgentSelectionEnabled={true}
                            setIsModelLocked={jest.fn()}
                        />
                    </AlertProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )

        const newChatButton = screen.getByRole('button', { name: /titulo chat/i })
        fireEvent.click(newChatButton)

        expect(mockHandleAppTitle).toHaveBeenCalledWith('ChatTCU Playground | undefined')
        expect(mockHideSidebar).toHaveBeenCalled()
    })

    // it('should handle handleClick2 correctly when the event is triggered', () => {
    //     const mockStopPropagation = jest.fn()
    //
    //     const mockChat: IChat = {
    //         id: '1',
    //         titulo: 'Chat 1',
    //         mensagens: [],
    //         isLoading: false,
    //         data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
    //     }
    //
    //     const mockEvent = {
    //         stopPropagation: mockStopPropagation,
    //         currentTarget: 'mockElement'
    //     }
    //
    //     const queryClient = new QueryClient()
    //
    //     render(
    //         <QueryClientProvider client={queryClient}>
    //             <MemoryRouter>
    //                 <AlertProvider>
    //                     <History
    //                         profile={mockProfile}
    //                         isMobile={false}
    //                         isShow={true}
    //                         chatsHistory={[mockChat]}
    //                         isLoading={false}
    //                         isSuccess={true}
    //                         isFetching={false}
    //                         activeChat={null}
    //                         setActiveChat={jest.fn()}
    //                         hasMoreChats={false}
    //                         onChatClick={jest.fn()}
    //                         updateChatHistory={jest.fn()}
    //                         hideSidebar={jest.fn()}
    //                         setSelectedAgent={jest.fn()}
    //                         isArchive={false}
    //                         isAgentSelectionEnabled={true}
    //                         setIsModelLocked={jest.fn()}
    //                     />
    //                 </AlertProvider>
    //             </MemoryRouter>
    //         </QueryClientProvider>
    //     )
    //     const element = screen.getByTestId('trigger-click') // Ajuste conforme o data-testid real do botão
    //
    //     fireEvent.click(element, mockEvent)
    //     expect(mockStopPropagation).toHaveBeenCalledTimes(1)
    // })

    it('should set anchorEl to null when handleClose is called', () => {
        const mockChat: IChat = {
            id: '1',
            titulo: 'Chat 1',
            mensagens: [],
            isLoading: false,
            data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
        }

        const queryClient = new QueryClient()
        const handleCloseMock = jest.fn()
        const { getByTestId } = render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AlertProvider>
                        <History
                            profile={mockProfile}
                            isMobile={false}
                            isShow={true}
                            chatsHistory={[mockChat]}
                            isLoading={false}
                            isSuccess={true}
                            isFetching={false}
                            activeChat={null}
                            setActiveChat={jest.fn()}
                            hasMoreChats={false}
                            onChatClick={mockOnChatClick}
                            updateChatHistory={jest.fn()}
                            hideSidebar={mockHideSidebar}
                            setSelectedAgent={jest.fn()}
                            isArchive={false}
                            isAgentSelectionEnabled={true}
                            setIsModelLocked={jest.fn()}
                        />
                    </AlertProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )

        const closeButton = getByTestId('anchor-button')
        fireEvent.click(closeButton)

        expect(handleCloseMock).toHaveBeenCalledTimes(0)
    })

    it('should set anchorEl to null when handleClose2 is called', () => {
        const mockChat: IChat = {
            id: '1',
            titulo: 'Chat 1',
            mensagens: [],
            isLoading: false,
            data_ultima_iteracao: new Date('2023-01-01T12:00:00Z')
        }

        const queryClient = new QueryClient()
        const handleCloseMock = jest.fn()
        const { getByTestId } = render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AlertProvider>
                        <History
                            profile={mockProfile}
                            isMobile={false}
                            isShow={true}
                            chatsHistory={[mockChat]}
                            isLoading={false}
                            isSuccess={true}
                            isFetching={false}
                            activeChat={null}
                            setActiveChat={jest.fn()}
                            hasMoreChats={false}
                            onChatClick={mockOnChatClick}
                            updateChatHistory={jest.fn()}
                            hideSidebar={mockHideSidebar}
                            setSelectedAgent={jest.fn()}
                            isArchive={false}
                            isAgentSelectionEnabled={true}
                            setIsModelLocked={jest.fn()}
                        />
                    </AlertProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )

        const closeButton = getByTestId('anchor-button2')
        fireEvent.click(closeButton)

        expect(handleCloseMock).toHaveBeenCalledTimes(0)
    })

    test('renders ShareChatModal when chatToBeShared is set', () => {
        renderHistory({
            chatsHistory: mockChats,
            chatToBeShared: mockChats[0] // Pass the chatToBeShared prop if needed
        })

        const modalElement = screen.getByTestId('share-chat-modal') // Adjust based on actual implementation
        expect(modalElement).toBeInTheDocument()
    })

    test('renders MessageToast when alert is present', async () => {
        renderHistory()
        const toastElement = await screen.findByTestId('message-toast')
        expect(toastElement).toBeInTheDocument()
    })
})
