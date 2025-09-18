import { errorHandler } from '../../../shared/utils/Error'

describe('errorHandler function', () => {
    it('should return true for status 400', () => {
        const result = errorHandler(400)
        expect(result).toBe(true)
    })

    it('should return true for status 401', () => {
        const result = errorHandler(401)
        expect(result).toBe(true)
    })

    it('should return false for status 200', () => {
        const result = errorHandler(200)
        expect(result).toBe(false)
    })

    it('should return false for status 500', () => {
        const result = errorHandler(500)
        expect(result).toBe(false)
    })

    it('should return false when no status is provided', () => {
        const result = errorHandler()
        expect(result).toBe(false)
    })

    it('should return false for null status', () => {
        const result = errorHandler(null as unknown as number)
        expect(result).toBe(false)
    })
})
