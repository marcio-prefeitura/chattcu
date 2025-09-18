import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { useQueryClient } from '@tanstack/react-query'
import SelectModelChat from '../../../components/select_model_chat/SelectModelChat'
import { ModelChat } from '../../../shared/interfaces/ModelChat'

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(),
    useQuery: jest.fn()
}))
jest.mock('../../../infrastructure/api', () => ({
    listAllModels: jest.fn()
}))

describe('SelectModelChat Component', () => {
    const mockQueryClient = {
        getQueryData: jest.fn(),
        setQueryData: jest.fn()
    }

    beforeEach(() => {
        const queryClient = useQueryClient as jest.Mock
        queryClient.mockReturnValue(mockQueryClient)
    })

    test('desabilita o botão quando isArchive é true', () => {
        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={true}
                selectedModel='GPT-4'
            />
        )
        const button = screen.getByTestId('button-menu-model')
        expect(button).toBeDisabled()
    })

    test('renderiza o botão e abre o menu ao clicar', () => {
        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4o'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('GPT-4o')

        fireEvent.click(button)
        const menu = screen.getByRole('menu')
        expect(menu).toBeInTheDocument()
    })

    test('renderiza a lista de modelos e permite a seleção de um modelo', async () => {
        const mockModels: ModelChat[] = [
            { name: 'GPT-4', selected: true, icon: 'icon', description: 'teste', is_beta: false, max_words: 10 },
            { name: 'GPT-3', selected: false, icon: 'icon', description: 'teste', is_beta: false, max_words: 12 }
        ]

        mockQueryClient.getQueryData.mockReturnValue(mockModels)

        mockQueryClient.setQueryData = jest.fn((key, models) => {
            console.log('setQueryData foi chamado com:', models)
        })

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        fireEvent.click(button)

        const listItem1 = await screen.findByTestId('label-button-GPT-4')
        expect(listItem1).toBeInTheDocument()
        expect(listItem1).toHaveTextContent('GPT-4')

        const listItem2 = await screen.findByTestId('label-button-GPT-3')
        expect(listItem2).toBeInTheDocument()
        expect(listItem2).toHaveTextContent('GPT-3')

        // Simula clique em GPT-3
        fireEvent.click(listItem2)

        await waitFor(() => {
            expect(mockQueryClient.setQueryData).toHaveBeenCalled()
        })
    })

    test('transforma os dados corretamente', () => {
        const expectedTransformedData = [
            { icon: 'icon-gpt', labelModel: 'GPT-4', selected: true, valueModel: 'GPT-4' },
            { icon: 'icon-gpt', labelModel: 'GPT-3', selected: false, valueModel: 'GPT-3' }
        ]

        mockQueryClient.getQueryData.mockReturnValue(expectedTransformedData)

        mockQueryClient.setQueryData.mockClear()

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )
        fireEvent.click(screen.getByTestId('button-menu-model'))

        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
            ['modelChats'],
            expect.arrayContaining([
                expect.objectContaining({
                    icon: 'icon-gpt',
                    labelModel: 'GPT-4',
                    selected: false,
                    valueModel: 'GPT-4'
                }),
                expect.objectContaining({ icon: 'icon-gpt', labelModel: 'GPT-3', selected: false, valueModel: 'GPT-3' })
            ])
        )
    })

    test('atualiza o cache e o estado local ao selecionar um modelo', async () => {
        const mockModels: ModelChat[] = [
            { name: 'GPT-4', selected: true, icon: 'icon', description: 'teste', is_beta: false, max_words: 60000 },
            { name: 'GPT-3', selected: false, icon: 'icon', description: 'teste', is_beta: false, max_words: 60000 }
        ]

        mockQueryClient.getQueryData.mockReturnValue(mockModels)

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        fireEvent.click(button)

        const listItem2 = await screen.findByTestId('label-button-GPT-3')
        fireEvent.click(listItem2)

        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
            ['modelChats'],
            expect.arrayContaining([
                expect.objectContaining({
                    description: 'teste',
                    icon: 'icon',
                    is_beta: false,
                    max_words: 60000,
                    name: 'GPT-4',
                    selected: true
                }),
                expect.objectContaining({
                    description: 'teste',
                    icon: 'icon',
                    is_beta: false,
                    max_words: 60000,
                    name: 'GPT-3',
                    selected: false
                })
            ])
        )

        expect(button).toHaveTextContent('GPT-4')
    })

    test('desabilita o botão quando isArchive é true', () => {
        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={true}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        expect(button).toBeDisabled()
    })
    test('transforma os dados corretamente quando data.modelos está vazio', () => {
        const mockEmptyData: ModelChat[] = []

        mockQueryClient.getQueryData.mockReturnValue(mockEmptyData)

        mockQueryClient.setQueryData.mockClear()

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )
        fireEvent.click(screen.getByTestId('button-menu-model'))

        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['modelChats'], [])
    })

    test('não transforma dados quando data.modelos é null ou indefinido', () => {
        mockQueryClient.getQueryData.mockReturnValue(undefined)

        mockQueryClient.setQueryData.mockClear()

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
    })

    test('atualiza o modelo selecionado quando selectedModel é alterado', async () => {
        const mockModels: ModelChat[] = [
            { name: 'GPT-4', selected: true, icon: 'icon', description: 'teste', is_beta: false, max_words: 10 },
            { name: 'GPT-3', selected: false, icon: 'icon', description: 'teste', is_beta: false, max_words: 12 }
        ]

        mockQueryClient.getQueryData.mockReturnValue(mockModels)

        const { rerender } = render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        expect(screen.getByTestId('button-menu-model')).toHaveTextContent('GPT-4')

        rerender(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-3'
            />
        )

        expect(screen.getByTestId('button-menu-model')).toHaveTextContent('GPT-3')
    })
    test('renderiza corretamente quando não há modelos no cache', () => {
        mockQueryClient.getQueryData.mockReturnValue(undefined)

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        expect(button).toHaveTextContent('GPT-4o') // valor padrão
    })

    test('deve renderizar corretamente o badge beta quando is_beta é true', () => {
        const mockModels: ModelChat[] = [
            {
                name: 'Beta Model',
                selected: false,
                icon: 'icon',
                description: 'teste',
                is_beta: true,
                max_words: 60000
            }
        ]
        mockQueryClient.getQueryData.mockReturnValue(mockModels)

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        fireEvent.click(button)

        const betaBadge = screen.getByText('beta')
        expect(betaBadge).toBeInTheDocument()
    })

    test('testa se o ícone do modelo é atualizado corretamente', async () => {
        const mockModels: ModelChat[] = [
            {
                name: 'Custom Model',
                selected: false,
                icon: 'custom-icon',
                description: 'teste',
                is_beta: false,
                max_words: 60000
            }
        ]
        mockQueryClient.getQueryData.mockReturnValue(mockModels)

        render(
            <SelectModelChat
                setSelectedAgent={() => {}}
                setIsModelLocked={() => {}}
                isArchive={false}
                selectedModel='GPT-4'
            />
        )

        const button = screen.getByTestId('button-menu-model')
        fireEvent.click(button)

        const listItem = await screen.findByTestId('label-button-Custom Model')
        fireEvent.click(listItem)

        const icon = document.querySelector('.custom-icon')
        expect(icon).toBeInTheDocument()
    })
})
