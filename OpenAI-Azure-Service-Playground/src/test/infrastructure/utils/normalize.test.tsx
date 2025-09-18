import { normalize } from '../../../infrastructure/utils/normalize'

describe('normalize function', () => {
    it('should convert text to lowercase', () => {
        const result = normalize('Hello World')
        expect(result).toBe('hello world')
    })

    it('should remove accents from characters', () => {
        const result = normalize('áéíóú ÁÉÍÓÚ âêîôû')
        expect(result).toBe('aeiou aeiou aeiou')
    })

    it('should normalize characters to their base form', () => {
        const result = normalize('café')
        expect(result).toBe('cafe')
    })

    it('should handle text without accents correctly', () => {
        const result = normalize('hello world')
        expect(result).toBe('hello world')
    })

    it('should handle empty string correctly', () => {
        const result = normalize('')
        expect(result).toBe('')
    })

    it('should handle mixed case and accents', () => {
        const result = normalize('Café Éxample')
        expect(result).toBe('cafe example')
    })

    it('should remove accents from characters with multiple diacritics', () => {
        const result = normalize('Héllo Wórld')
        expect(result).toBe('hello world')
    })
})
