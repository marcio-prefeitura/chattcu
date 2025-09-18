import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { IMessageHistory } from '../../../infrastructure/utils/types'
import MessageContent from '../../../components/chat-box/message/MessageContent'

jest.mock('../../../browser-auth', () => {
    return {
        msalInstance: {
            initialize: jest.fn().mockResolvedValue(undefined),
            handleRedirectPromise: jest.fn().mockResolvedValue(null),
            setActiveAccount: jest.fn(),
            getAllAccounts: jest.fn().mockReturnValue([]),
            getActiveAccount: jest.fn(),
            logoutRedirect: jest.fn()
        }
    }
})

const mockMessage: IMessageHistory = {
    codigo: '123',
    conteudo: 'Hello, this is a test message.',
    papel: 'USER',
    isTyping: false,
    pausedText: '',
    isStreamActive: false
}

jest.mock('react-markdown', () => props => {
    return <>{props.children}</>
})

jest.mock('remark-gfm', () => props => {
    return <>{props.children}</>
})

const mockOpenModalTooltip = jest.fn()

describe('MessageContent Component', () => {
    test('renders user message content', () => {
        render(
            <MessageContent
                message={mockMessage}
                openModalTooltip={mockOpenModalTooltip}
                isSharedChat={false}
            />
        )

        expect(screen.getByText('Hello, this is a test message.')).toBeInTheDocument()
    })

    test('renders assistant message content with code', () => {
        const assistantMessage: IMessageHistory = {
            ...mockMessage,
            conteudo: '```javascript\nconsole.log("Hello World");\n```',
            papel: 'ASSISTANT'
        }

        render(
            <MessageContent
                message={assistantMessage}
                openModalTooltip={mockOpenModalTooltip}
                isSharedChat={false}
            />
        )

        expect(screen.getByText('javascript')).toBeInTheDocument()
        expect(screen.getByText('console')).toBeInTheDocument()
        expect(screen.getByText('.log(')).toBeInTheDocument()
        expect(screen.getByText('"Hello World"')).toBeInTheDocument()
        expect(screen.getByText(');')).toBeInTheDocument()
    })

    test('renders assistant message content with table', () => {
        const assistantMessage: IMessageHistory = {
            ...mockMessage,
            conteudo: '| Header1 | Header2 |\n|---------|---------|\n| Cell1   | Cell2   |',
            papel: 'ASSISTANT'
        }

        render(
            <MessageContent
                message={assistantMessage}
                openModalTooltip={mockOpenModalTooltip}
                isSharedChat={false}
            />
        )

        expect(screen.getAllByTestId('markdown-table')[0]).toBeInTheDocument()
    })

    // test('calls stopTyping when typing is finished', () => {
    //     const typingMessage = {
    //         ...mockMessage,
    //         conteudo: '',
    //         isTyping: true,
    //         pausedText: ''
    //     }
    //
    //     const { rerender } = render(
    //         <MessageContent
    //             message={typingMessage}
    //             openModalTooltip={mockOpenModalTooltip}
    //             isSharedChat={false}
    //             isLastMessage={true}
    //             stopTyping={mockstopTyping}
    //             shouldScrollToBottom={mockShouldScrollToBottom}
    //             profile={mockProfile}
    //         />
    //     )
    //
    //     const finishedTypingMessage = {
    //         ...typingMessage,
    //         isTyping: false
    //     }
    //
    //     rerender(
    //         <MessageContent
    //             message={finishedTypingMessage}
    //             openModalTooltip={mockOpenModalTooltip}
    //             isSharedChat={false}
    //             isLastMessage={true}
    //             stopTyping={mockstopTyping}
    //             shouldScrollToBottom={mockShouldScrollToBottom}
    //             profile={mockProfile}
    //         />
    //     )
    //
    //     expect(mockstopTyping).toHaveBeenCalled()
    // })

    // test('calls shouldScrollToBottom when typing', () => {
    //     const typingMessage = {
    //         ...mockMessage,
    //         conteudo: 'teste',
    //         isTyping: true,
    //         pausedText: ''
    //     }
    //
    //     const { rerender } = render(
    //         <MessageContent
    //             message={typingMessage}
    //             openModalTooltip={mockOpenModalTooltip}
    //             isSharedChat={false}
    //             isLastMessage={true}
    //             stopTyping={mockstopTyping}
    //             shouldScrollToBottom={mockShouldScrollToBottom}
    //             profile={mockProfile}
    //         />
    //     )
    //
    //     const finishedTypingMessage = {
    //         ...typingMessage,
    //         isTyping: false
    //     }
    //
    //     rerender(
    //         <MessageContent
    //             message={finishedTypingMessage}
    //             openModalTooltip={mockOpenModalTooltip}
    //             isSharedChat={false}
    //             isLastMessage={true}
    //             stopTyping={mockstopTyping}
    //             shouldScrollToBottom={mockShouldScrollToBottom}
    //             profile={mockProfile}
    //         />
    //     )
    //
    //     expect(mockShouldScrollToBottom).toHaveBeenCalled()
    // })
})
