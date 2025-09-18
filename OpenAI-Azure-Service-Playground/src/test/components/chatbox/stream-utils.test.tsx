import { parseStreamData, clearPartialData } from '../../../components/chat-box/stream-utils'
import { IChat } from '../../../infrastructure/utils/types'

describe('Stream Utils', () => {
    let updatedChat: IChat

    beforeEach(() => {
        updatedChat = {
            id: 'chat123',
            mensagens: [],
            isLoading: false
        }
    })

    afterEach(() => {
        clearPartialData()
    })

    it('should return an empty array if no data is passed', () => {
        const result = parseStreamData('', updatedChat)
        expect(result).toEqual([])
    })

    it('should parse valid JSON stream data correctly', () => {
        const data = '{"message": "Hello, World!"}\n\n{"message": "Another message"}'

        const result = parseStreamData(data, updatedChat)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ message: 'Hello, World!' })
        expect(result[1]).toEqual({ message: 'Another message' })
    })

    it('should handle incomplete data and continue accumulating until complete', () => {
        const dataPart1 = '{"message": "Hello,'
        const dataPart2 = ' World!"}'

        parseStreamData(dataPart1, updatedChat)
        const result = parseStreamData(dataPart2, updatedChat)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ message: 'Hello, World!' })
    })

    it('should handle invalid JSON gracefully', () => {
        const invalidData = '{"message": "Valid part"}\n\n{invalid json}'

        const result = parseStreamData(invalidData, updatedChat)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({ message: 'Valid part' })
    })
})
