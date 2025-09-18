import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { IChat } from '../../../infrastructure/utils/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Archive from '../../../../src/components/sidebar/archive/Archive'
import { InTeamsContext } from '../../../context/AppContext'
import { useArchiveFunctions } from '../../../components/sidebar/archive/ArchiveFunctions'
import { AlertProvider } from '../../../../src/context/AlertContext' // Import AlertProvider and useAlert
jest.mock('../../../../src/infrastructure/api')

jest.mock('../../../components/sidebar/archive/ArchiveFunctions')

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ chat_id: 'test-chat-id' })
}))

const mockProfile = {
    login: 'UserLogin',
    name: 'User001',
    initialLetters: 'User',
    perfilDev: true,
    perfilPreview: true,
    perfilDevOrPreview: true
}
const mockChats: IChat[] = [
    {
        id: '1',
        titulo: 'Chat 1',
        usuario: 'Usuário 1',
        mensagens: [],
        apagado: false,
        fixado: false,
        arquivado: true,
        deleting: false,
        editing: false,
        data_criacao: new Date('2024-11-01T08:00:00Z'),
        data_ultima_iteracao: new Date('2024-11-01T09:00:00Z'),
        temp_chat_id: 'temp-1',
        isLoading: false,
        isStreamActive: false,
        numWords: 100,
        trechos: [],
        arquivos_busca: '',
        especialista_utilizado: null,
        modelo_selecionado: null,
        shared: false
    },
    {
        id: '2',
        titulo: 'Chat 2',
        usuario: 'Usuário 2',
        mensagens: [],
        apagado: false,
        fixado: false,
        arquivado: true,
        deleting: false,
        editing: false,
        data_criacao: new Date('2024-10-01T08:00:00Z'),
        data_ultima_iteracao: new Date('2024-10-01T09:00:00Z'),
        temp_chat_id: 'temp-2',
        isLoading: false,
        isStreamActive: false,
        numWords: 50,
        trechos: [],
        arquivos_busca: '',
        especialista_utilizado: null,
        modelo_selecionado: null,
        shared: false
    }
]

const mockUseAquiveFunctions = {
    archiveChats: mockChats,
    handleScroll: jest.fn(),
    isLoadingNextPage: false,
    deleteChat: jest.fn(),
    unarchiveAllArchives: jest.fn(),
    totalArquivedChats: 2
}
const queryClient = new QueryClient()

const mockArquive = {
    profile: mockProfile,
    isShow: true,
    isMobile: false,
    onChatClick: jest.fn(),
    onUnArchiveChat: jest.fn(),
    handleNewChat: jest.fn()
}

// Wrapper to include AlertProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <InTeamsContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
            <AlertProvider>{children}</AlertProvider>
        </QueryClientProvider>
    </InTeamsContext.Provider>
)

describe('ArchiveContent Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(useArchiveFunctions as jest.Mock).mockReturnValue(mockUseAquiveFunctions)
    })

    it('deve renderizar o componente dos chats arquivados corretamente', () => {
        render(<Archive {...mockArquive} />, { wrapper: Wrapper })

        expect(screen.getByText('Chats arquivados')).toBeInTheDocument()
    })

    it('deve chamar a função de rolagem quando o usuário rola até o fim', () => {
        render(<Archive {...mockArquive} />, { wrapper: Wrapper })

        const chatContainer = screen.getByTestId('archive-content')

        fireEvent.scroll(chatContainer, {
            target: { scrollTop: chatContainer.scrollHeight - chatContainer.clientHeight }
        })

        expect(mockUseAquiveFunctions.handleScroll).toHaveBeenCalled()
    })
})
