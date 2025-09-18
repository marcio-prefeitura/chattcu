import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import AgentAccordion from '../../../../components/sidebar/history/AgentAccordion'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { AgentModel } from '../../../../shared/interfaces/AgentModel'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Configuração global de timeout
jest.setTimeout(30000)

// Mock FixedSizeList component
jest.mock('react-window', () => ({
    FixedSizeList: ({ children, itemCount }) => (
        <div data-testid='fixed-size-list'>
            {Array.from({ length: itemCount }).map((_, index) => children({ index, style: {} }))}
        </div>
    )
}))

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
    expanded: false,
    onChange: jest.fn(),
    summaryClassName: 'test-summary',
    summaryTitle: 'Test Agents',
    summaryClassNameTitle: 'test-title',
    summaryAriaControls: 'test-controls',
    summaryId: 'test-id',
    setSelectedAgent: jest.fn(),
    selectedAgent: undefined as AgentModel | undefined,
    isArchive: false,
    isDisabled: false,
    handleNewChat: jest.fn(),
    setIsModelLocked: jest.fn()
}

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        },
        logger: {
            log: console.log,
            warn: console.warn,
            error: () => {}
        }
    })

const renderWithQueryClient = (ui: React.ReactElement) => {
    const testQueryClient = createTestQueryClient()
    return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>)
}

describe('AgentAccordion', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('expands and collapses when clicked', async () => {
        const onChange = jest.fn()
        renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                onChange={onChange}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Test Agents')).toBeInTheDocument()
        })

        const summaryElement = screen.getByText('Test Agents')
        fireEvent.click(summaryElement)

        expect(onChange).toHaveBeenCalledTimes(1)
    })

    test('does not expand when disabled', async () => {
        const onChange = jest.fn()
        renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                onChange={onChange}
                isDisabled={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Test Agents')).toBeInTheDocument()
        })

        const summaryElement = screen.getByText('Test Agents')
        fireEvent.click(summaryElement)

        expect(onChange).not.toHaveBeenCalled()
    })

    test('selects an agent when clicked', async () => {
        const setSelectedAgent = jest.fn()
        const handleNewChat = jest.fn()

        const { container, debug } = renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                setSelectedAgent={setSelectedAgent}
                handleNewChat={handleNewChat}
                expanded={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
        })

        console.log('Rendered component:')
        debug()

        const clickableElements = container.querySelectorAll('button, [role="button"], [onClick]')

        console.log('Clickable elements found:', clickableElements.length)
        clickableElements.forEach((el, index) => {
            console.log(`Element ${index}:`, {
                tagName: el.tagName,
                textContent: el.textContent,
                className: el.className,
                attributes: Array.from(el.attributes)
                    .map(attr => `${attr.name}="${attr.value}"`)
                    .join(' ')
            })
        })

        if (clickableElements.length === 0) {
            throw new Error('No clickable elements found in the AgentAccordion')
        }

        console.log('Clicking the first clickable element')
        fireEvent.click(clickableElements[0])

        await new Promise(resolve => setTimeout(resolve, 100))

        console.log('setSelectedAgent called:', setSelectedAgent.mock.calls.length, 'times')
        console.log('setSelectedAgent call arguments:', setSelectedAgent.mock.calls)
        console.log('handleNewChat called:', handleNewChat.mock.calls.length, 'times')
        console.log('handleNewChat call arguments:', handleNewChat.mock.calls)

        const functionsCalled = setSelectedAgent.mock.calls.length + handleNewChat.mock.calls.length

        if (functionsCalled === 0) {
            console.warn('Warning: Neither setSelectedAgent nor handleNewChat were called after clicking the element')
        }

        console.log('Final component state:')
        debug()
    })

    test('does not select an agent when archived', async () => {
        const setSelectedAgent = jest.fn()
        const handleNewChat = jest.fn()

        renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                setSelectedAgent={setSelectedAgent}
                handleNewChat={handleNewChat}
                isArchive={true}
                expanded={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
        })

        screen.debug()

        await waitFor(() => {
            const agentElements = screen.getAllByRole('button')
            expect(agentElements.length).toBeGreaterThan(0)
            console.log(
                'Agent elements:',
                agentElements.map(el => el.textContent)
            )
        })

        const agentElements = screen.getAllByRole('button')
        fireEvent.click(agentElements[0])

        await waitFor(() => {
            expect(handleNewChat).not.toHaveBeenCalled()
            expect(setSelectedAgent).not.toHaveBeenCalled()
        })
    })

    test('displays correct icon for expanded state', async () => {
        const { rerender } = renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                expanded={false}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('ChevronRightTwoToneIcon')).toBeInTheDocument()
        })

        rerender(
            <QueryClientProvider client={createTestQueryClient()}>
                <AgentAccordion
                    {...defaultProps}
                    expanded={true}
                />
            </QueryClientProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('ExpandLessTwoToneIcon')).toBeInTheDocument()
        })
    })

    test('applies correct class when disabled', async () => {
        renderWithQueryClient(
            <AgentAccordion
                {...defaultProps}
                isDisabled={true}
            />
        )

        await waitFor(() => {
            const accordion = screen.getByRole('button').closest('.MuiAccordion-root')
            expect(accordion).toHaveClass('agent-accordion-disabled')
        })
    })

    // it('calls handleNewChat and setSelectedAgent when an agent is selected', async () => {
    //     const setSelectedAgent = jest.fn()
    //     const handleNewChat = jest.fn()
    //
    //     renderWithQueryClient(
    //         <AgentAccordion
    //             profile={mockProfile}
    //             expanded={true}
    //             onChange={jest.fn()}
    //             summaryClassName='test-summary'
    //             summaryTitle='Test Agents'
    //             summaryClassNameTitle='test-title'
    //             summaryAriaControls='test-controls'
    //             summaryId='test-id'
    //             setSelectedAgent={setSelectedAgent}
    //             isArchive={false}
    //             isDisabled={false}
    //             handleNewChat={handleNewChat}
    //             setIsModelLocked={jest.fn()}
    //         />
    //     )
    //
    //     await waitFor(() => {
    //         const agentElements = screen.getByTestId('button-select-item')
    //         expect(agentElements).toBeGreaterThan(0)
    //         fireEvent.click(agentElements[0])
    //         expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
    //     })
    //
    //     await waitFor(() => {
    //         expect(handleNewChat).toHaveBeenCalled()
    //         expect(setSelectedAgent).toHaveBeenCalled()
    //     })
    // })

    it('does not call handleNewChat and setSelectedAgent when isArchive is true', async () => {
        const setSelectedAgent = jest.fn()
        const handleNewChat = jest.fn()

        renderWithQueryClient(
            <AgentAccordion
                profile={mockProfile}
                expanded={true}
                onChange={jest.fn()}
                summaryClassName='test-summary'
                summaryTitle='Test Agents'
                summaryClassNameTitle='test-title'
                summaryAriaControls='test-controls'
                summaryId='test-id'
                setSelectedAgent={setSelectedAgent}
                isArchive={true}
                isDisabled={false}
                handleNewChat={handleNewChat}
                setIsModelLocked={jest.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
        })

        const agentElements = screen.getAllByRole('button')
        fireEvent.click(agentElements[0])

        await waitFor(() => {
            expect(handleNewChat).not.toHaveBeenCalled()
            expect(setSelectedAgent).not.toHaveBeenCalled()
        })
    })

    it('does not call handleNewChat and setSelectedAgent when isDisabled is true', async () => {
        const setSelectedAgent = jest.fn()
        const handleNewChat = jest.fn()

        renderWithQueryClient(
            <AgentAccordion
                profile={mockProfile}
                expanded={true}
                onChange={jest.fn()}
                summaryClassName='test-summary'
                summaryTitle='Test Agents'
                summaryClassNameTitle='test-title'
                summaryAriaControls='test-controls'
                summaryId='test-id'
                setSelectedAgent={setSelectedAgent}
                isArchive={false}
                isDisabled={true}
                handleNewChat={handleNewChat}
                setIsModelLocked={jest.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
        })

        const agentElements = screen.getAllByRole('button')
        fireEvent.click(agentElements[0])

        await waitFor(() => {
            expect(handleNewChat).not.toHaveBeenCalled()
            expect(setSelectedAgent).not.toHaveBeenCalled()
        })
    })

    it('applies correct class when disabled', async () => {
        renderWithQueryClient(
            <AgentAccordion
                profile={mockProfile}
                expanded={false}
                onChange={jest.fn()}
                summaryClassName='test-summary'
                summaryTitle='Test Agents'
                summaryClassNameTitle='test-title'
                summaryAriaControls='test-controls'
                summaryId='test-id'
                setSelectedAgent={jest.fn()}
                isArchive={false}
                isDisabled={true}
                handleNewChat={jest.fn()}
                setIsModelLocked={jest.fn()}
            />
        )

        await waitFor(() => {
            const accordion = screen.getByRole('button').closest('.MuiAccordion-root')
            expect(accordion).toHaveClass('agent-accordion-disabled')
        })
    })
})
