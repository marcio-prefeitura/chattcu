import { LanguageHandler } from '../../../components/chat-box/message/message-utils'

describe('LanguageHandler', () => {
    test('Construtor com string vazia', () => {
        const handler = new LanguageHandler('')
        expect(handler.getLanguage()).toBe('')
        expect(handler.getTextContent()).toBe('')
        expect(handler.getAsObject()).toEqual({ language: '', textContent: '' })
    })

    test('Construtor com uma linha', () => {
        const handler = new LanguageHandler('English\nHello world')
        expect(handler.getLanguage()).toBe('English')
        expect(handler.getTextContent()).toBe('\nHello world')
        expect(handler.getAsObject()).toEqual({ language: 'English', textContent: '\nHello world' })
    })

    test('Construtor com várias linhas', () => {
        const handler = new LanguageHandler('French\nBonjour\nmonde')
        expect(handler.getLanguage()).toBe('French')
        expect(handler.getTextContent()).toBe('\nBonjour\nmonde')
        expect(handler.getAsObject()).toEqual({ language: 'French', textContent: '\nBonjour\nmonde' })
    })

    test('Idioma extraído é uma string vazia', () => {
        const handler = new LanguageHandler('\nHello')
        expect(handler.getLanguage()).toBe('')
        expect(handler.getTextContent()).toBe('\nHello')
        expect(handler.getAsObject()).toEqual({ language: '', textContent: '\nHello' })
    })

    test('Idioma extraído é uma única palavra', () => {
        const handler = new LanguageHandler('Spanish\nHola')
        expect(handler.getLanguage()).toBe('Spanish')
        expect(handler.getTextContent()).toBe('\nHola')
        expect(handler.getAsObject()).toEqual({ language: 'Spanish', textContent: '\nHola' })
    })

    test('Idioma extraído contém espaços em branco', () => {
        const handler = new LanguageHandler('  German \nHallo')
        expect(handler.getLanguage()).toBe('  German ')
        expect(handler.getTextContent()).toBe('\nHallo')
        expect(handler.getAsObject()).toEqual({ language: '  German ', textContent: '\nHallo' })
    })

    test('Idioma extraído contém caracteres especiais', () => {
        const handler = new LanguageHandler('$%#\nSpecial\ncharacters')
        expect(handler.getLanguage()).toBe('$%#')
        expect(handler.getTextContent()).toBe('\nSpecial\ncharacters')
        expect(handler.getAsObject()).toEqual({ language: '$%#', textContent: '\nSpecial\ncharacters' })
    })

    test('Idioma extraído contém letras maiúsculas e minúsculas', () => {
        const handler = new LanguageHandler('LANGUAGE\nText')
        expect(handler.getLanguage()).toBe('LANGUAGE')
        expect(handler.getTextContent()).toBe('\nText')
        expect(handler.getAsObject()).toEqual({ language: 'LANGUAGE', textContent: '\nText' })
    })

    test('Texto de conteúdo é uma string vazia', () => {
        const handler = new LanguageHandler('English\n')
        expect(handler.getLanguage()).toBe('English')
        expect(handler.getTextContent()).toBe('\n')
        expect(handler.getAsObject()).toEqual({ language: 'English', textContent: '\n' })
    })

    test('Texto de conteúdo contém o idioma apenas uma vez', () => {
        const handler = new LanguageHandler('Portuguese\nBom dia, mundo\nPortuguese\nOlá, todos')
        expect(handler.getLanguage()).toBe('Portuguese')
        expect(handler.getTextContent()).toBe('\nBom dia, mundo\nPortuguese\nOlá, todos')
        expect(handler.getAsObject()).toEqual({
            language: 'Portuguese',
            textContent: '\nBom dia, mundo\nPortuguese\nOlá, todos'
        })
    })

    test('Texto de conteúdo contém o idioma várias vezes', () => {
        const handler = new LanguageHandler('German\nGuten Tag\nGerman\nHallo')
        expect(handler.getLanguage()).toBe('German')
        expect(handler.getTextContent()).toBe('\nGuten Tag\nGerman\nHallo')
        expect(handler.getAsObject()).toEqual({ language: 'German', textContent: '\nGuten Tag\nGerman\nHallo' })
    })

    test('Método getLanguage() é chamado após a inicialização', () => {
        const handler = new LanguageHandler('Italian\nCiao')
        expect(handler.getLanguage()).toBe('Italian')
    })

    test('Método getTextContent() é chamado após a inicialização', () => {
        const handler = new LanguageHandler('Russian\nПривет')
        expect(handler.getTextContent()).toBe('\nПривет')
    })

    test('Método getAsObject() é chamado após a inicialização', () => {
        const handler = new LanguageHandler('Dutch\nHallo')
        expect(handler.getAsObject()).toEqual({ language: 'Dutch', textContent: '\nHallo' })
    })
})
