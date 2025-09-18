import { render, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import CitationInner, { ICitation, ICitationProps } from '../../../components/citation-inner/CitationInner'
import { AlertProvider } from '../../../context/AlertContext' // Adjust this import based on your project structure

import { act } from 'react-dom/test-utils'

import { downloadFile } from '../../../infrastructure/api'

jest.mock('../../../infrastructure/api')

const citationDefaultMock: ICitation = {
    activeIndex: new Set([1]),
    index: 1,
    isFile: true,
    trecho: { conteudo: 'A reposta sobre tudo é 42.', link_sistema: 'http://chat.test' },
    key: 'cit-ABCD-1',
    disabled: false
}

const defaultCitationPropsMock: ICitationProps = {
    citation: citationDefaultMock,
    toggleActiveIndex: jest.fn()
}

describe('Unit Test CitationInner', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const renderWithProvider = (component: React.ReactNode) => {
        return render(<AlertProvider>{component}</AlertProvider>)
    }

    test('should not renderize when trecho is null', () => {
        const citation = { ...defaultCitationPropsMock.citation, trecho: null }
        const { queryByTestId } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )
        expect(queryByTestId(`collapse-inner-${citation.key}`)).toBeNull()
    })

    test('should not renderize when disabled is true', () => {
        const citation = { ...defaultCitationPropsMock.citation, disabled: true }
        const { queryByTestId } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )
        expect(queryByTestId(`collapse-inner-${citation.key}`)).toBeNull()
    })

    test('should renderize button Download when isFile is passed true', () => {
        const citation = { ...defaultCitationPropsMock.citation, isFile: true }
        const { queryByTestId } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )
        expect(queryByTestId('cit-inner-btn-download-file')).toBeInTheDocument()
    })

    test('should a Content given by props renderized in a Component', () => {
        const citation = { ...defaultCitationPropsMock.citation, trecho: { conteudo: 'As jurisprudências x' } }
        const { getByText } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )
        expect(getByText('As jurisprudências x')).toBeInTheDocument()
    })

    test('should a link be present when props given is not File', () => {
        const citation = { ...defaultCitationPropsMock.citation, isFile: false }
        const { queryByTestId } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )

        expect(queryByTestId('trecho-link')).toBeInTheDocument()
    })

    test('should call a function toggleActiveIndex on click at button close when is File', () => {
        const { queryByTestId } = renderWithProvider(<CitationInner {...defaultCitationPropsMock} />)
        const buttonClose = queryByTestId('button-upper-close')

        if (buttonClose) {
            fireEvent.click(buttonClose)
        }

        expect(defaultCitationPropsMock.toggleActiveIndex).toHaveBeenCalledWith(defaultCitationPropsMock.citation.index)
    })

    test('should call a function toggleActiveIndex on click at button close when not is File', () => {
        const citation = { ...defaultCitationPropsMock.citation, isFile: false }
        const { queryByTestId } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )
        const buttonClose = queryByTestId('button-upper-close')

        if (buttonClose) fireEvent.click(buttonClose)

        expect(defaultCitationPropsMock.toggleActiveIndex).toHaveBeenCalledWith(defaultCitationPropsMock.citation.index)
    })

    test('should copy a link to the clipboard', async () => {
        const writeTextMock = jest.fn().mockResolvedValue(undefined)
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

        const citation = {
            ...defaultCitationPropsMock.citation,
            isFile: false,
            trecho: { link_sistema: 'http://chat.test' }
        }

        const { getByLabelText } = render(
            <AlertProvider>
                {' '}
                <CitationInner
                    citation={citation}
                    toggleActiveIndex={jest.fn()}
                />
            </AlertProvider>
        )

        fireEvent.click(getByLabelText('Copiar link'))
        await waitFor(() => {
            expect(writeTextMock).toHaveBeenCalledWith('http://chat.test')
        })
    })

    test('should open link in a new tab when link is clicked', () => {
        const citation = { ...defaultCitationPropsMock.citation, isFile: false }
        const { getByText } = renderWithProvider(
            <CitationInner
                {...defaultCitationPropsMock}
                citation={citation}
            />
        )

        const openMock = jest.spyOn(window, 'open').mockImplementation(() => null)
        fireEvent.click(getByText('http://chat.test')) // Assumindo que o link é exibido como texto
        expect(openMock).toHaveBeenCalledWith('http://chat.test', '_blank')
        openMock.mockRestore()
    })

    test('should download a file when download button is clicked', async () => {
        const mockCreateObjectURL = jest.fn(() => 'http://chat.test/file_of_mongo')
        const mockRevokeObjectURL = jest.fn()

        // simula o download da api da infra
        const downFileFromMongo = downloadFile as jest.Mock
        downFileFromMongo.mockResolvedValueOnce(new Uint8Array([1, 2, 3]))

        window.URL.createObjectURL = mockCreateObjectURL
        window.URL.revokeObjectURL = mockRevokeObjectURL

        const citation = {
            ...defaultCitationPropsMock.citation,
            isFile: true,
            trecho: { id_arquivo_mongo: 'mongoid_xyzw' }
        }

        const { getByTestId } = renderWithProvider(
            <CitationInner
                citation={citation}
                toggleActiveIndex={jest.fn()}
            />
        )

        await act(async () => {
            fireEvent.click(getByTestId('cit-inner-btn-download-file'))
        })

        expect(downloadFile).toHaveBeenCalledWith('mongoid_xyzw')

        // verificar se o createObjectURL foi chamado para criar a URL do arquivo
        expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))

        // verificar se o revokeObjectURL foi chamado após o clique no link
        await waitFor(() => expect(mockRevokeObjectURL).toHaveBeenCalledWith('http://chat.test/file_of_mongo'))
    })
})
