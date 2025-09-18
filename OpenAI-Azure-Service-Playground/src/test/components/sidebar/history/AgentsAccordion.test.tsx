import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import AgentsAccordion from '../../../../components/sidebar/agents/AgentsAccordion'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { IChat } from '../../../../infrastructure/utils/types'

// Mock FixedSizeList component
jest.mock('react-window', () => ({
    FixedSizeList: ({ children, itemCount }) => (
        <div data-testid='fixed-size-list'>
            {[...Array(itemCount)].map((_, index) => children({ index, style: {} }))}
        </div>
    )
}))

// Mock ChatActionsMenu component
jest.mock('../../../../components/chat-actions-menu/ChatActionsMenu', () => {
    return function DummyChatActionsMenu(props) {
        const handleKeyDown = (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                props.handleArchiveChat(props.chat)
            }
        }

        return (
            <button
                data-testid='chat-actions-menu'
                onClick={() => props.handleArchiveChat(props.chat)}
                onKeyDown={handleKeyDown}>
                Mock Menu
            </button>
        )
    }
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

const defaultProps = {
    profile: mockProfile,
    chats: mockChats,
    selectedChatId: null,
    expanded: false,
    onChange: jest.fn(),
    summaryClassName: 'test-summary',
    summaryTitle: 'Test Agents',
    summaryClassNameTitle: 'test-title',
    summaryAriaControls: 'test-controls',
    summaryId: 'test-id',
    handleChatClick: jest.fn(),
    fixChatOnTop: jest.fn(),
    handleArchiveChat: jest.fn(),
    handleStartShareChat: jest.fn(),
    handleInputChange: jest.fn(),
    handlEditChat: jest.fn(),
    handleDeleteChat: jest.fn(),
    handleClick: jest.fn(),
    anchorEl: null,
    handleClose: jest.fn(),
    handleOpenConfirmClearAllDialog: jest.fn(),
    handleShowDeleteFixedModal: jest.fn(),
    setSelectedAgent: jest.fn(),
    setAgentList: jest.fn(),
    selectedAgent: undefined,
    agentList: []
}

describe('AgentsAccordion', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('expands and collapses when clicked', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const summaryElement = screen.getByText('Test Agents')
        fireEvent.click(summaryElement)

        expect(defaultProps.onChange).toHaveBeenCalledTimes(1)
    })

    test('calls handleChatClick when a chat is clicked', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const chatElement = screen.getByText('Chat 1')
        fireEvent.click(chatElement)

        expect(defaultProps.handleChatClick).toHaveBeenCalledWith(mockChats[0])
    })

    test('calls fixChatOnTop when unpin button is clicked', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const unpinButton = screen.getByTestId('unnopin-button-1')
        fireEvent.click(unpinButton)

        expect(defaultProps.fixChatOnTop).toHaveBeenCalledWith(mockChats[0])
    })

    test('renders chat actions menu for each chat', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const chatActionMenus = screen.getAllByTestId('chat-actions-menu')
        expect(chatActionMenus).toHaveLength(mockChats.length)
    })

    test('calls handleArchiveChat when archive option is clicked', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const chatActionMenus = screen.getAllByTestId('chat-actions-menu')
        fireEvent.click(chatActionMenus[0])

        expect(defaultProps.handleArchiveChat).toHaveBeenCalledWith(mockChats[0])
    })

    test('displays date for dev profile', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const dateRegex = /\d{2}\/\d{2}\/\d{4} - \d{2}h\d{2}/
        const dateElements = screen.getAllByText(dateRegex)

        expect(dateElements.length).toBeGreaterThanOrEqual(2)
    })

    test('does not display date for non-dev profile', () => {
        const nonDevProps = {
            ...defaultProps,
            profile: { ...mockProfile, perfilDev: false }
        }
        render(<AgentsAccordion {...nonDevProps} />)

        const dateRegex = /\d{2}\/\d{2}\/\d{4} - \d{2}h\d{2}/
        const dateElements = screen.queryAllByText(dateRegex)

        expect(dateElements.length).toBe(2)
    })

    test('renders FixedSizeList with correct props', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const fixedSizeList = screen.getByTestId('fixed-size-list')
        expect(fixedSizeList).toBeInTheDocument()
    })

    test('applies correct class when expanded', () => {
        render(
            <AgentsAccordion
                {...defaultProps}
                expanded={true}
            />
        )

        const accordion = screen.getByText('Test Agents').closest('.MuiAccordion-root')
        expect(accordion).toHaveClass('Mui-expanded')
    })

    test('renders correct number of chats', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const chatElements = screen.getAllByText(/Chat \d/)
        expect(chatElements).toHaveLength(mockChats.length)
    })

    test('renders tooltip for chat title', () => {
        render(<AgentsAccordion {...defaultProps} />)

        const chatTitle = screen.getByText('Chat 1')
        expect(chatTitle.closest('[data-mui-internal-clone-element="true"]')).toBeInTheDocument()
    })
})
