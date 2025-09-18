import React from 'react'
import { render, screen } from '@testing-library/react'

import '@testing-library/jest-dom/extend-expect'
import Progress from '../../../components/progress/Progress'

describe('Progress Component', () => {
    it('renders the Progress component with the correct structure', () => {
        render(<Progress />)

        const backgroundBox = screen.getByTestId('background-progress')
        expect(backgroundBox).toBeInTheDocument()

        const modalBox = screen.getByTestId('modal-progress')
        expect(modalBox).toBeInTheDocument()

        const circularProgress = screen.getByRole('progressbar')
        expect(circularProgress).toBeInTheDocument()
    })
})
