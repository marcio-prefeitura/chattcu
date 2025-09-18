import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewSidebar from '../../../components/sidebar/NewSidebar'

jest.mock('../../../components/sidebar/archive/Archive', () => () => <div data-testid='archive-component' />)
jest.mock('../../../components/sidebar/history/History', () => () => <div data-testid='history-component' />)
jest.mock('../../../components/sidebar/sharing/Sharing', () => () => <div data-testid='sharing-component' />)
jest.mock('../../../components/sidebar/upload/Upload', () => () => <div data-testid='upload-component' />)

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '' })
}))

jest.mock(
    '../../../components/sidebar/sidebar-switcher/SidebarSwitcher',
    () =>
        ({ onClickNewChat, onContentTypeChange }) =>
            (
                <div data-testid='sidebar-switcher'>
                    <button
                        data-testid='new-chat-button'
                        onClick={onClickNewChat}>
                        New Chat
                    </button>
                    <button
                        data-testid='change-tab-button'
                        onClick={() => onContentTypeChange('files')}>
                        Change Tab
                    </button>
                </div>
            )
)

jest.mock('../../../components/sidebar/archive/Archive', () => ({ onChatClick }) => (
    <div data-testid='archive-component'>
        <button
            data-testid='select-archived-chat'
            onClick={() => onChatClick({ id: '1', title: 'Test Chat' })}>
            Select Chat
        </button>
    </div>
))

jest.mock('../../../components/sidebar/sharing/Sharing', () => ({ onSharedChatSelect }) => (
    <div data-testid='sharing-component'>
        <button
            data-testid='select-shared-chat'
            onClick={() => onSharedChatSelect({ id: '1', title: 'Shared Chat' })}>
            Select Shared Chat
        </button>
        <button
            data-testid='shared-chat-button'
            onClick={() => onSharedChatSelect({ id: '1', title: 'Shared Chat' })}>
            Select Chat
        </button>
    </div>
))

const mockProfile = {
    login: 'teste',
    name: 'Teste da Silva',
    initialLetters: 'TS',
    perfilDev: true,
    perfilPreview: false,
    perfilDevOrPreview: false
}

// const openFilesTab = (setSelectedTab: React.Dispatch<React.SetStateAction<string>>,  onClickShowSidebar: (value: boolean) => void) => {
//     setSelectedTab('files')
//     setTimeout(() => {
//         onClickShowSidebar(true)
//     }, 50)
// }

describe('NewSidebar', () => {
    const defaultProps = {
        profile: mockProfile,
        isShow: true,
        isMobile: false,
        chatsHistory: [],
        isLoading: false,
        isSuccess: true,
        isFetching: false,
        activeChat: null,
        setActiveChat: jest.fn(),
        hasMoreChats: false,
        onChatClick: jest.fn(),
        updateChatHistory: jest.fn(),
        hideSidebar: jest.fn(),
        updatedFoldersFromChipsActions: [],
        filesSelected: [],
        setFilesSelected: jest.fn(),
        onClickShowSidebar: jest.fn(),
        onSharedChatSelect: jest.fn(),
        onUnArchiveChat: jest.fn(),
        setSelectedAgent: jest.fn(),
        selectedAgent: undefined,
        isArchive: false,
        isAgentSelectionEnabled: true,
        setIsModelLocked: jest.fn(),
        setRedirectForm: jest.fn(),
        onAlert: jest.fn()
    }

    const renderComponent = (props = {}) => {
        return render(
            <MemoryRouter>
                <NewSidebar
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        renderComponent()
        expect(screen.getByTestId('sidebar-switcher')).toBeInTheDocument()
    })

    it('renders history component by default', () => {
        renderComponent()
        expect(screen.getByTestId('history-component')).toBeInTheDocument()
    })

    it('renders upload component when files tab is selected', () => {
        const searchParams = new URLSearchParams('?tab=files')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])
        renderComponent()
        expect(screen.getByTestId('upload-component')).toBeInTheDocument()
    })

    it('renders sharing component when share tab is selected', () => {
        const searchParams = new URLSearchParams('?tab=share')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])
        renderComponent()
        expect(screen.getByTestId('sharing-component')).toBeInTheDocument()
    })

    it('renders archive component when archive tab is selected', () => {
        const searchParams = new URLSearchParams('?tab=archive')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])
        renderComponent()
        expect(screen.getByTestId('archive-component')).toBeInTheDocument()
    })

    it('handles new chat creation', async () => {
        const searchParams = new URLSearchParams('?tab=history')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])

        const { getByTestId } = renderComponent()
        fireEvent.click(getByTestId('new-chat-button'))

        expect(defaultProps.onChatClick).toHaveBeenCalledWith(null)
    })

    it('handles chat selection for archived chats', () => {
        const searchParams = new URLSearchParams('?tab=archive')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])

        const { getByTestId } = renderComponent()
        fireEvent.click(getByTestId('select-archived-chat'))

        expect(defaultProps.onChatClick).toHaveBeenCalledWith({ id: '1', title: 'Test Chat' })
        expect(defaultProps.hideSidebar).toHaveBeenCalled()
    })

    it('handles chat selection for shared chats', () => {
        const searchParams = new URLSearchParams('?tab=share')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])

        const { getByTestId } = renderComponent()
        fireEvent.click(getByTestId('shared-chat-button'))

        expect(defaultProps.onSharedChatSelect).toHaveBeenCalledWith({ id: '1', title: 'Shared Chat' })
        expect(defaultProps.hideSidebar).toHaveBeenCalled()
    })

    // it('calls openFilesTab and updates state correctly', () => {
    //     jest.useFakeTimers()
    //     const onClickShowSidebarMock = jest.fn()
    //
    //     const { result } = renderHook(() => {
    //         const [selectedTab, setSelectedTab] = useState('')
    //         return { selectedTab, setSelectedTab }
    //     })
    //
    //     act(() => {
    //         openFilesTab(result.current.setSelectedTab, onClickShowSidebarMock)
    //     })
    //
    //     expect(result.current.selectedTab).toBe('files')
    //     jest.advanceTimersByTime(50)
    //
    //     expect(onClickShowSidebarMock).toHaveBeenCalledWith(true)
    //     jest.useRealTimers()
    // })

    it('handles tab change and updates URL', () => {
        const searchParams = new URLSearchParams('?tab=history')
        jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([searchParams])

        const { getByTestId } = renderComponent()
        fireEvent.click(getByTestId('change-tab-button'))

        expect(defaultProps.setRedirectForm).toHaveBeenCalledWith(false)
        expect(defaultProps.onClickShowSidebar).toHaveBeenCalledWith(true)
        expect(mockNavigate).toHaveBeenCalledWith('/?tab=files')
    })
})
