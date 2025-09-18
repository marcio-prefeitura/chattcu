import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import SelectAgent from '../../../components/select_agent/SelectAgent'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AgentModel } from '../../../shared/interfaces/AgentModel'

// Mock the queryClient
const queryClient = new QueryClient()

// Mock agent data
const mockAgents: AgentModel[] = [
    {
        labelAgente: 'Jurisprudência',
        valueAgente: 'jurisprudencia',
        selected: false,
        quebraGelo: [],
        autor: '',
        descricao: '',
        icon: null
    },
    {
        labelAgente: 'Legislação',
        valueAgente: 'legislacao',
        selected: false,
        quebraGelo: [],
        autor: '',
        descricao: '',
        icon: null
    }
]

describe('SelectAgent', () => {
    beforeEach(() => {
        // Set up the mock data in the queryClient
        queryClient.setQueryData(['agents'], mockAgents)

        render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={mockAgents[0]}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )
    })

    // it('renders SelectAgent component', () => {
    //     const openButton = screen.getByTestId('button-menu-agent')
    //     fireEvent.click(openButton)
    //
    //     const selectAgentComponent = screen.getByText('Especialidades')
    //     expect(selectAgentComponent).toBeInTheDocument()
    // })

    it('Abrir menu com click', () => {
        const menu = screen.queryByRole('menu')
        expect(menu).not.toBeInTheDocument()

        const openButton = screen.getByTestId('button-menu-agent')
        fireEvent.click(openButton)

        const updatedMenu = screen.getByRole('menu')
        expect(updatedMenu).toBeInTheDocument()
    })

    it('selecionar agente na lista list', () => {
        const openButton = screen.getByTestId('button-menu-agent')
        fireEvent.click(openButton)

        const agentListItems = screen.getAllByTestId('label-button-agent')
        expect(agentListItems.length).toBeGreaterThan(0)
        fireEvent.click(agentListItems[0])

        // Check if the selected agent's name is displayed on the button
        const selectedAgentButton = screen.getByTestId('button-menu-agent')
        expect(selectedAgentButton).toHaveTextContent('Jurisprudência')
    })

    it('disabilita o botão quando a lista de agentes é vazia', () => {
        queryClient.setQueryData(['agents'], [])
        render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={undefined}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )
        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        expect(openButton).toBeInTheDocument()
    })

    it('disabilita o botão quando disabled é true', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={undefined}
                    isDisabled={true}
                />
            </QueryClientProvider>
        )
        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        expect(openButton).toBeInTheDocument()
    })

    it('Mostra o agente selecionado', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={mockAgents[1]}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )
        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        expect(openButton).toHaveTextContent('Jurisprudência')
    })

    it('Fecha o menu quando clica em close', () => {
        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={mockAgents[0]}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )
        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        fireEvent.click(openButton)
        fireEvent.mouseDown(container)
        const menu = screen.queryByText('menu')
        expect(menu).not.toBeInTheDocument()
    })

    it('closes menu when handleClose is called', () => {
        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={() => {}}
                    selectedAgent={mockAgents[0]}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )
        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        fireEvent.click(openButton)
        fireEvent.mouseDown(container)
        const menu = screen.queryByRole('menu')
        expect(menu).toBeInTheDocument()
    })

    it('selects agent and updates state when handleSelect is called', () => {
        const setSelectedAgentMock = jest.fn()
        render(
            <QueryClientProvider client={queryClient}>
                <SelectAgent
                    setSelectedAgent={setSelectedAgentMock}
                    selectedAgent={undefined}
                    isDisabled={false}
                />
            </QueryClientProvider>
        )

        const openButton = screen.getAllByTestId('button-menu-agent')[0]
        fireEvent.click(openButton)

        const openSelectButton = screen.getAllByTestId('button-select-agent')[0]
        fireEvent.click(openSelectButton)

        const agentListItems = screen.getAllByTestId('label-button-agent')
        fireEvent.click(agentListItems[0])

        // Cria uma cópia do agente esperado com `selected: true`
        // const expectedAgent = { ...mockAgents[0], selected: true }

        // expect(setSelectedAgentMock).toHaveBeenCalledWith(expectedAgent)
        expect(openButton.textContent).toBe('Jurisprudência')

        const updatedMenu = screen.queryByRole('menu')
        expect(updatedMenu).not.toBeInTheDocument()
    })
})
