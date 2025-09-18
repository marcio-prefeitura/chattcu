import React from 'react'
import { render, screen } from '@testing-library/react'
import CustomRoutes from '../../../../src/infrastructure/routes/CustomRoutes'

const toggleDarkMode = jest.fn()
const darkMode = false

jest.mock('react-markdown', () => {
    return jest.fn(() => <div>Mocked Markdown</div>)
})
jest.mock('remark-gfm', () => {
    return {}
})

describe('CustomRoutes Component', () => {
    test('should render NotFound page for unknown route', () => {
        window.history.pushState({}, 'Unknown Page', '/unknown-route')
        render(
            <CustomRoutes
                toggleDarkMode={toggleDarkMode}
                darkMode={darkMode}
            />
        )
        expect(screen.getByText(/404/i)).toBeInTheDocument()
    })
})
