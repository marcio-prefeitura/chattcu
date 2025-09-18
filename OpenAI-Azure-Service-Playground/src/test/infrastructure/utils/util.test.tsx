import { getSidebarTabClassName, isLocalhost } from '../../../infrastructure/utils/util'

describe('getSidebarTabClassName', () => {
    it('should return "sidebar-mobile relative" when isMobile is true', () => {
        const result = getSidebarTabClassName(true, true)
        expect(result).toBe(' sidebar-mobile relative')
    })

    it('should return "new-sidebar" when isMobile is false and isShow is true', () => {
        const result = getSidebarTabClassName(false, true)
        expect(result).toBe('new-sidebar')
    })

    it('should return "sidebar-hide" when isShow is false', () => {
        const result = getSidebarTabClassName(true, false)
        expect(result).toBe(' sidebar-mobile relative sidebar-hide')
    })

    it('should return "new-sidebar sidebar-hide" when isMobile is false and isShow is false', () => {
        const result = getSidebarTabClassName(false, false)
        expect(result).toBe('new-sidebar sidebar-hide')
    })
})

describe('isLocalhost', () => {
    it('should return true when REACT_APP_BACK_ENDPOINT contains "localhost"', () => {
        process.env.REACT_APP_BACK_ENDPOINT = 'http://localhost:3000'
        const result = isLocalhost()
        expect(result).toBe(true)
    })

    it('should return false when REACT_APP_BACK_ENDPOINT does not contain "localhost"', () => {
        process.env.REACT_APP_BACK_ENDPOINT = 'http://example.com'
        const result = isLocalhost()
        expect(result).toBe(false)
    })

    it('should return false when REACT_APP_BACK_ENDPOINT is empty', () => {
        process.env.REACT_APP_BACK_ENDPOINT = ''
        const result = isLocalhost()
        expect(result).toBe(false)
    })
})
