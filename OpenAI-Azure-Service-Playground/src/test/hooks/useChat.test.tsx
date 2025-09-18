import { renderHook } from '@testing-library/react'
import useChat from '../../hooks/useChat'
import { IChat, IMessageHistory } from '../../infrastructure/utils/types'

describe('useChat', () => {
    test('Deve inicializar com chat vazio', () => {
        const { result } = renderHook(() => useChat())

        expect(result.current.isValidChat()).toBe(false)
    })

    test('Deve configurar e obter o chat corretamente', () => {
        const { result } = renderHook(() => useChat())

        const chat = {
            id: '123',
            titulo: 'Test Chat',
            usuario: 'Angeline',
            mensagens: [],
            isLoading: false
        }
        result.current.set(chat)

        expect(result.current.isValidChat()).toBe(true)
        expect(result.current.get()).toEqual(chat)
    })

    test('Deve definir as propriedades do chat corretamente', () => {
        const { result } = renderHook(() => useChat())

        const chat = {
            id: '123',
            titulo: 'Test Chat',
            usuario: 'Angeline',
            mensagens: [],
            isLoading: false
        }
        result.current.set(chat)

        result.current.setId('456')
        result.current.setTitulo('New Title')

        expect(result.current.get().id).toBe('456')
        expect(result.current.get().titulo).toBe('New Title')
    })

    test('Deve definir corretamente o ID do chat ao usar o método setId', () => {
        const id = '123'
        const { setId, get } = renderHook(() => useChat()).result.current
        setId(id)
        expect(get().id).toEqual(id)
    })

    test('Deve definir corretamente o ID temporário do chat ao usar o método setTempChatId', () => {
        const tempChatId = 'temp123'
        const { setTempChatId, get } = renderHook(() => useChat()).result.current
        setTempChatId(tempChatId)
        expect(get().temp_chat_id).toEqual(tempChatId)
    })
    test('Deve definir corretamente o título do chat ao usar o método setTitulo', () => {
        const titulo = 'Novo Título'
        const { setTitulo, get } = renderHook(() => useChat()).result.current
        setTitulo(titulo)
        expect(get().titulo).toEqual(titulo)
    })
    test('Deve definir corretamente o estado de carregamento do chat ao usar o método setLoading', () => {
        const isLoading = true
        const { setLoading, get } = renderHook(() => useChat()).result.current
        setLoading(isLoading)
        expect(get().isLoading).toEqual(isLoading)
    })
    test('Deve definir corretamente se o chat está em streaming', () => {
        const { isStreaming } = renderHook(() => useChat()).result.current
        expect(isStreaming()).toBe(false)
    })
    test('Deve definir corretamente se o chat está carregando', () => {
        const { isLoading } = renderHook(() => useChat()).result.current
        expect(isLoading()).toBe(false)
    })

    test('Deve adicionar corretamente múltiplas mensagens ao chat ao usar o método setLastMessageToChat', () => {
        const messages = [
            { id: '1', conteudo: 'Primeira mensagem', papel: 'USER' },
            { id: '2', conteudo: 'Segunda mensagem', papel: 'ASSISTANT' },
            { id: '3', conteudo: 'Terceira mensagem', papel: 'USER' }
        ]
        const { setLastMessageToChat, get } = renderHook(() => useChat()).result.current
        messages.forEach(message => setLastMessageToChat(message as IMessageHistory))
        expect(get().mensagens).toEqual(messages)
    })

    test('Deve lidar corretamente com uma grande quantidade de mensagens no chat', () => {
        const largeNumberOfMessages = Array.from(
            { length: 100 },
            (_, index) =>
                ({
                    id: `${index}`,
                    conteudo: `Mensagem ${index}`,
                    papel: index % 2 === 0 ? 'USER' : 'ASSISTANT'
                } as IMessageHistory)
        )
        const { setLastMessageToChat, get } = renderHook(() => useChat()).result.current
        largeNumberOfMessages.forEach(message => setLastMessageToChat(message))
        expect(get().mensagens.length).toBe(100) // Verifica se todas as mensagens foram adicionadas
    })
    test('Deve definir corretamente o código do prompt na mensagem anterior', () => {
        const messages: IMessageHistory[] = [
            {
                conteudo: 'Mensagem 1',
                papel: 'USER'
            },
            {
                conteudo: 'Mensagem 2',
                papel: 'ASSISTANT'
            }
        ]
        const chat: IChat = { id: '1', isLoading: false, mensagens: messages }
        const { set, setCodigoPrompt, get } = renderHook(() => useChat()).result.current
        set(chat)

        setCodigoPrompt('novo código')
        expect(get().mensagens[0].codigo_prompt).toEqual('novo código')
    })

    test('Deve calcular corretamente o número de tokens com base nas mensagens', () => {
        const messages: IMessageHistory[] = [
            {
                conteudo: 'Mensagem 1',
                papel: 'USER'
            },
            {
                conteudo: 'Mensagem 2',
                papel: 'ASSISTANT'
            }
        ]
        const chat: IChat = { id: '1', isLoading: false, mensagens: messages }
        const { set, getTokens } = renderHook(() => useChat()).result.current
        set(chat)

        expect(getTokens()).toEqual(4) // Primeira mensagem: 2 palavras, Segunda mensagem: 2 palavras
    })

    test('Deve verificar corretamente se o chat é pelo ID', () => {
        const chat: IChat = { id: '123', mensagens: [], isLoading: false }
        const chat2: IChat = { id: '123', mensagens: [], isLoading: false }
        const { set, isChatById } = renderHook(() => useChat()).result.current
        set(chat)
        set(chat2)

        expect(isChatById(chat)).toBe(true)
        expect(isChatById(chat2)).toBe(true)
    })

    test('Deve verificar corretamente se o chat é pelo ID temporário', () => {
        const chat: IChat = { id: '123', mensagens: [], isLoading: false, temp_chat_id: 'temp123' }
        const chat2: IChat = { id: '123', mensagens: [], isLoading: false, temp_chat_id: 'temp456' }
        const { set, isChatByTempChatId } = renderHook(() => useChat()).result.current
        set(chat)
        set(chat2)

        expect(isChatByTempChatId(chat)).toBe(false)
        expect(isChatByTempChatId(chat2)).toBe(true)
    })
})
