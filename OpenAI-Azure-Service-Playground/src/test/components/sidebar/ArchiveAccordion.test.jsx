import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import ArchiveAccordion from '../../../components/sidebar/archive/ArchiveAccordion'
import moment from 'moment-timezone'

jest.mock('../../../components/archive-actions-menu/ArchiveActionsMenu', () => () => (
    <div data-testid='archive-actions-menu' />
))

const profile = { perfilDevOrPreview: true }
const chats = [
    { id: '1', titulo: 'Chat 1', data_ultima_iteracao: new Date('2024-03-18T19:04:48Z') },
    { id: '2', titulo: 'Chat 2', data_ultima_iteracao: new Date('2024-03-19T18:05:48Z') }
]

const mockHandlers = {
    onChatClick: jest.fn(),
    onClickAllUnArchive: jest.fn(),
    onUnArchive: jest.fn(),
    onRefresh: jest.fn(),
    handleDeleteChat: jest.fn().mockResolvedValue(undefined)
}

describe('ArchiveAccordion', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders correctly with given props', () => {
        render(
            <ArchiveAccordion
                profile={profile}
                title='Archived Chats'
                chats={chats}
                isLoading={false}
                isError={false}
                {...mockHandlers}
            />
        )

        expect(screen.getByText('Archived Chats')).toBeInTheDocument()
        // expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Chat 1')).toBeInTheDocument()
        expect(screen.getByText('Chat 2')).toBeInTheDocument()

        const formattedDate1 = moment
            .utc(chats[0].data_ultima_iteracao, 'YYYY-MM-DD HH:mm:ss')
            .tz('America/Sao_Paulo')
            .format('DD/MM/YYYY - HH[h]mm')
        const formattedDate2 = moment
            .utc(chats[1].data_ultima_iteracao, 'YYYY-MM-DD HH:mm:ss')
            .tz('America/Sao_Paulo')
            .format('DD/MM/YYYY - HH[h]mm')

        expect(screen.getAllByText(formattedDate1).length).toBe(1)
        expect(screen.getAllByText(formattedDate2).length).toBe(1)

        expect(screen.getByText(formattedDate1)).toBeInTheDocument()
        expect(screen.getByText(formattedDate2)).toBeInTheDocument()
    })

    test('should render CircularProgress when isLoading is true', () => {
        render(
            <ArchiveAccordion
                profile={{}} // Provide the necessary props for the test
                title='Archived Chats'
                chats={[]}
                isLoading={true} // Set isLoading to true to trigger loading indicator
                isError={false}
                {...mockHandlers} // Include any necessary mock handlers
            />
        )

        // Check if CircularProgress is rendered when isLoading is true
        const loadingSpinner = screen.getByRole('progressbar') // CircularProgress has role 'progressbar'
        expect(loadingSpinner).toBeInTheDocument() // Ensure the loading spinner is present
    })

    test('should not render CircularProgress when isLoading is false', () => {
        render(
            <ArchiveAccordion
                profile={{}}
                title='Archived Chats'
                chats={[]}
                isLoading={false} // Set isLoading to false, so loading indicator shouldn't be displayed
                isError={false}
                {...mockHandlers}
            />
        )

        // Check if CircularProgress is NOT rendered when isLoading is false
        const loadingSpinner = screen.queryByRole('progressbar') // queryByRole to check absence
        expect(loadingSpinner).not.toBeInTheDocument() // Ensure the loading spinner is not present
    })

    test('calls onChatClick when a chat is clicked', () => {
        render(
            <ArchiveAccordion
                profile={profile}
                title='Archived Chats'
                chats={chats}
                isLoading={false}
                isError={false}
                {...mockHandlers}
            />
        )

        fireEvent.click(screen.getByText('Chat 1'))

        expect(mockHandlers.onChatClick).toHaveBeenCalledWith(chats[0])
    })

    test('displays no chats available message when there are no chats', () => {
        render(
            <ArchiveAccordion
                profile={profile}
                title='Archived Chats'
                chats={[]}
                isLoading={false}
                isError={false}
                {...mockHandlers}
            />
        )

        expect(screen.getByText('Nenhum Resultado Encontrado')).toBeInTheDocument()
    })

    // New tests

    test('toggles accordion expansion when header is clicked', () => {
        render(
            <ArchiveAccordion
                profile={profile}
                title='Archived Chats'
                chats={chats}
                isLoading={false}
                isError={false}
                {...mockHandlers}
            />
        )

        const header = screen.getByText('Archived Chats').closest('.MuiAccordionSummary-root')
        expect(header).toBeInTheDocument()

        fireEvent.click(header)
        expect(header?.parentElement).not.toHaveClass('Mui-expanded')
    })
})
