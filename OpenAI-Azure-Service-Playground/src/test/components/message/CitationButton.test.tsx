import React, { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import CitationButton from '../../../components/chat-box/message/CitationButton'
import { IMessageHistory } from '../../../infrastructure/utils/types'

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()

const messageMock: IMessageHistory = {
    chat_id: '1',
    codigo: 'ABC',
    conteudo: 'Teste',
    feedback: {
        chat_id: '1',
        cod_mensagem: '123',
        conteudo: 'teste',
        inveridico: true,
        reacao: 'LIKED',
        nao_ajudou: false,
        ofensivo: false
    },
    papel: 'ASSISTANT',
    trechos: [
        { id_registro: 1, pagina_arquivo: 1 },
        { id_registro: 2, pagina_arquivo: 2 },
        { id_registro: 3, pagina_arquivo: 3 }
    ],
    arquivos_selecionados: [],
    arquivos_selecionados_prontos: []
}

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation
}))

jest.mock('react-markdown', () => props => {
    return <>{props.children}</>
})

jest.mock('remark-gfm', () => props => {
    return <>{props.children}</>
})
jest.mock('uuid')

afterEach(() => {
    jest.clearAllMocks()
})
describe('CitationButton', () => {
    const parte = 'This is a [citation] example'

    const openModalTooltip = jest.fn()
    const getCitations = jest.fn(() => [])
    const setCitations = jest.fn()

    it('renders the citation button', () => {
        const { queryByText } = render(
            <CitationButton
                message={messageMock}
                parte={parte}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )
        expect(queryByText('[citation]')).toBeInTheDocument
    })

    it('should not render a citation button for an invalid citation (non-numeric)', () => {
        const parteWithInvalidCitation = 'This is an invalid citation: [invalid].'

        render(
            <CitationButton
                message={messageMock}
                parte={parteWithInvalidCitation}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )

        const citationButton = screen.queryByText('[invalid]')
        expect(citationButton).not.toBeInTheDocument()
    })

    it('should correctly handle an invalid citation with "^" (non-numeric)', () => {
        const parteWithInvalidCitationCaret = 'This is an invalid citation: [^invalid].'

        render(
            <CitationButton
                message={messageMock}
                parte={parteWithInvalidCitationCaret}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )

        const citationButton = screen.queryByText('[^invalid]')
        expect(citationButton).not.toBeInTheDocument()
    })

    it('calls openModalTooltip when the citation button is clicked', () => {
        const { queryByText } = render(
            <CitationButton
                message={messageMock}
                parte={parte}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )
        expect(queryByText('[citation]')).toBeInTheDocument
        expect(openModalTooltip).toHaveBeenCalledTimes(0)
    })

    it('calls getCitations when the citation button is clicked', () => {
        const { queryByText } = render(
            <CitationButton
                message={messageMock}
                parte={parte}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={() => []}
                setCitations={setCitations}
            />
        )
        expect(queryByText('[citation]')).toBeInTheDocument
        expect(getCitations).toHaveBeenCalledTimes(0)
    })

    it('displays the correct citation index when a new citation is added', () => {
        const { queryByText } = render(
            <CitationButton
                message={messageMock}
                parte={parte}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )
        expect(queryByText('[citation]')).toBeInTheDocument
    })
    it('does not render citation if citation format is invalid', () => {
        const parteWithInvalidCitation = 'This is a [invalid-citation-format] example'

        render(
            <CitationButton
                message={messageMock}
                parte={parteWithInvalidCitation}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )

        const citationButton = screen.queryByText('[invalid-citation-format]')
        expect(citationButton).not.toBeInTheDocument()
    })

    it('displays the original text if the user is not an assistant', () => {
        const messageMock: IMessageHistory = {
            chat_id: '1',
            codigo: 'ABC',
            conteudo: 'Teste',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [
                { id_registro: 1, pagina_arquivo: 1 },
                { id_registro: 2, pagina_arquivo: 2 },
                { id_registro: 3, pagina_arquivo: 3 }
            ],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container } = render(
            <CitationButton
                message={messageMock}
                parte={parte}
                i={0}
                openModalTooltip={openModalTooltip}
                getCitations={getCitations}
                setCitations={setCitations}
            />
        )

        const citationButton = screen.queryByText('[citation]')
        expect(citationButton).not.toBeInTheDocument()

        expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe('This is a[citation]example')
    })

    it('should add an index to activeIndex when toggled for the first time', () => {
        const TestComponent = () => {
            const [activeIndex, setActiveIndexState] = useState<Set<number>>(new Set())

            const toggleActiveIndex = (index: number) => {
                setActiveIndexState(prevSet => {
                    const newSet = new Set(prevSet)
                    newSet.has(index) ? newSet.delete(index) : newSet.add(index)
                    return newSet
                })
            }

            return (
                <div>
                    <button onClick={() => toggleActiveIndex(1)}>Toggle 1</button>
                    <button onClick={() => toggleActiveIndex(2)}>Toggle 2</button>
                    <div data-testid='activeIndex'>{Array.from(activeIndex).join(', ')}</div>
                </div>
            )
        }

        render(<TestComponent />)

        expect(screen.getByTestId('activeIndex').textContent).toBe('')

        fireEvent.click(screen.getByText('Toggle 1'))

        expect(screen.getByTestId('activeIndex').textContent).toBe('1')

        fireEvent.click(screen.getByText('Toggle 2'))

        expect(screen.getByTestId('activeIndex').textContent).toBe('1, 2')
    })

    it('should remove an index from activeIndex when toggled again', () => {
        const TestComponent = () => {
            const [activeIndex, setActiveIndexState] = useState<Set<number>>(new Set([1]))

            const toggleActiveIndex = (index: number) => {
                setActiveIndexState(prevSet => {
                    const newSet = new Set(prevSet)
                    newSet.has(index) ? newSet.delete(index) : newSet.add(index)
                    return newSet
                })
            }
            return (
                <div>
                    <button onClick={() => toggleActiveIndex(1)}>Toggle 1</button>
                    <div data-testid='activeIndex'>{Array.from(activeIndex).join(', ')}</div>
                </div>
            )
        }

        render(<TestComponent />)
        expect(screen.getByTestId('activeIndex').textContent).toBe('1')
        fireEvent.click(screen.getByText('Toggle 1'))
        expect(screen.getByTestId('activeIndex').textContent).toBe('')
    })
})
