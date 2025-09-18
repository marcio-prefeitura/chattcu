import React from 'react'
import { render, screen } from '@testing-library/react'
import DotsLoader from '../../../components/dots-loader/DotsLoader'
import '@testing-library/jest-dom/extend-expect'

describe('<DotsLoader />', () => {
    it('renders the loader correctly', () => {
        render(<DotsLoader />)
        const loader = screen.getByTestId('bouncing-loader')
        expect(loader).toBeInTheDocument()

        const divs = loader.querySelectorAll('div')
        expect(divs).toHaveLength(3)

        const avatar = document.querySelector('.MuiAvatar-root')
        expect(avatar).toBeInTheDocument()

        const svg = avatar?.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
