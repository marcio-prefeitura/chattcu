import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FilesNotOk from '../../../components/chat-box/message/panel-files-not-ok/FilesNotOk'
import { listFilesByIds } from '../../../infrastructure/api'

jest.mock('../../../infrastructure/api', () => ({
    listFilesByIds: jest.fn() as jest.MockedFunction<typeof listFilesByIds>
}))

const queryClient = new QueryClient()

describe('FilesNotOk Component', () => {
    it('renders correctly when files are present', async () => {
        const mockData = {
            arquivos: [
                { id: 1, nome: 'File 1' },
                { id: 2, nome: 'File 2' }
            ]
        }
        const mockListFilesByIds = listFilesByIds as jest.Mock
        mockListFilesByIds.mockResolvedValue(mockData)

        render(
            <QueryClientProvider client={queryClient}>
                <FilesNotOk
                    message={{
                        codigo: '123',
                        conteudo: 'Some content',
                        papel: 'USER'
                    }}
                    ids_arquivos_ignorados={[1, 2]}
                />
            </QueryClientProvider>
        )

        await waitFor(() => expect(screen.getByText('Arquivos que não estavam prontos')).toBeInTheDocument())

        expect(screen.getByText('File 1')).toBeInTheDocument()
        expect(screen.getByText('File 2')).toBeInTheDocument()
    })

    it('renders the accordion header when files are returned', async () => {
        const mockListFilesByIds = listFilesByIds as jest.Mock
        mockListFilesByIds.mockResolvedValue({
            arquivos: [
                { id: 1, nome: 'File 1' },
                { id: 2, nome: 'File 2' }
            ]
        })

        render(
            <QueryClientProvider client={queryClient}>
                <FilesNotOk
                    message={{
                        codigo: '123',
                        conteudo: 'Some content',
                        papel: 'USER'
                    }}
                    ids_arquivos_ignorados={[1, 2]}
                />
            </QueryClientProvider>
        )
        await waitFor(() => {
            expect(screen.getByText('Arquivos que não estavam prontos')).toBeInTheDocument()
        })
    })
})
