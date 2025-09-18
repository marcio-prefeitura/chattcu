import { apagarChat, fixarChat, renameChat } from '../../infrastructure/api'
import Chat from '../../shared/models/Chat'

jest.mock('../../infrastructure/api', () => ({
    apagarChat: jest.fn(),
    fixarChat: jest.fn(),
    renameChat: jest.fn()
}))

describe('Chat Class', () => {
    let chat: Chat

    beforeEach(() => {
        chat = new Chat({
            id: '1',
            mensagens: [],
            isLoading: false,
            titulo: 'Chat de Exemplo',
            usuario: 'usuario1',
            apagado: false,
            fixado: false,
            deleting: false,
            editing: false,
            data_criacao: new Date('2024-12-11T17:22:28.043Z'),
            data_ultima_iteracao: new Date('2024-12-11T17:22:28.043Z'),
            temp_chat_id: 'temp1',
            isStreamActive: false,
            numWords: 0,
            trechos: [],
            arquivos_busca: ''
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('deve fixar o chat', async () => {
        const mockFixar = fixarChat as jest.Mock
        mockFixar.mockResolvedValueOnce('sucess')

        await chat.fixar()

        expect(chat.fixado).toBe(true)
        expect(fixarChat).toHaveBeenCalledWith(chat)
    })

    test('deve excluir o chat', async () => {
        const mockApagar = apagarChat as jest.Mock
        mockApagar.mockResolvedValueOnce('success')

        await chat.excluir()

        expect(apagarChat).toHaveBeenCalledWith(chat.id)
    })

    test('deve renomear o chat', async () => {
        const novoTitulo = 'Novo Título'
        const mockRename = renameChat as jest.Mock
        mockRename.mockResolvedValueOnce('success')

        await chat.renomear(novoTitulo)

        expect(chat.titulo).toBe(novoTitulo)
        expect(chat.editing).toBe(false)
        expect(renameChat).toHaveBeenCalledWith({
            chat_id: chat.id,
            novo_nome: novoTitulo
        })
    })

    test('deve alternar o estado de fixação corretamente', async () => {
        chat.fixado = false
        const mockFixar = fixarChat as jest.Mock
        mockFixar.mockResolvedValueOnce(chat)

        await chat.fixar()

        expect(chat.fixado).toBe(true)
    })

    test('deve chamar fixarChat após fixar', async () => {
        const mockFixar = fixarChat as jest.Mock
        mockFixar.mockResolvedValueOnce(chat)

        await chat.fixar()

        expect(fixarChat).toHaveBeenCalledWith(chat)
    })

    test('deve chamar apagarChat após excluir', async () => {
        const mockApagar = apagarChat as jest.Mock
        mockApagar.mockResolvedValueOnce('success')

        await chat.excluir()

        expect(apagarChat).toHaveBeenCalledWith(chat.id)
    })

    test('deve chamar renameChat após renomear', async () => {
        const novoTitulo = 'Chat Renomeado'

        const mockRename = renameChat as jest.Mock
        mockRename.mockResolvedValueOnce('success')

        await chat.renomear(novoTitulo)

        expect(renameChat).toHaveBeenCalledWith({
            chat_id: chat.id,
            novo_nome: novoTitulo
        })
    })
})
