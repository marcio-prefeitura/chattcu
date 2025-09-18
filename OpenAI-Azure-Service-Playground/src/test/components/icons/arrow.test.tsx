import React from 'react'
import { render } from '@testing-library/react'
import IconArrowDownCircle from '../../../components/icons/arrow'

describe('IconArrowDownCircle', () => {
    test('deve renderizar corretamente', () => {
        const { container } = render(<IconArrowDownCircle />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('deve aceitar e aplicar props adicionais', () => {
        const { container } = render(
            <IconArrowDownCircle
                className='custom-class'
                data-testid='icon'
            />
        )
        const svgElement = container.querySelector('svg')
        expect(svgElement).toHaveClass('custom-class')
        expect(svgElement).toHaveAttribute('data-testid', 'icon')
    })

    test('deve ter os atributos corretos no SVG', () => {
        const { container } = render(<IconArrowDownCircle />)
        const svgElement = container.querySelector('svg')
        expect(svgElement).toHaveAttribute('fill', 'none')
        expect(svgElement).toHaveAttribute('viewBox', '0 0 15 15')
        expect(svgElement).toHaveAttribute('height', '1em')
        expect(svgElement).toHaveAttribute('width', '1em')
    })

    test('deve ter o caminho correto no <path>', () => {
        const { container } = render(<IconArrowDownCircle />)
        const pathElement = container.querySelector('path')
        expect(pathElement).toBeInTheDocument()
        expect(pathElement).toHaveAttribute('fill', 'currentColor')
        expect(pathElement).toHaveAttribute(
            'd',
            expect.stringContaining(
                'M5.854 8.146L5.5 7.793l-.707.707.353.354.708-.708zM7.5 10.5l-.354.354.354.353.354-.353L7.5 10.5zm2.354-1.646l.353-.354-.707-.707-.354.353.708.708zM.5 7.5H0h.5zm7-7V0v.5zm0 14V14v.5zm7-7H14h.5zM5.146 8.854l2 2 .708-.708-2-2-.708.708zm2.708 2l2-2-.708-.708-2 2 .708.708zM8 10.5V4H7v6.5h1zm-7-3A6.5 6.5 0 017.5 1V0A7.5 7.5 0 000 7.5h1zM7.5 14A6.5 6.5 0 011 7.5H0A7.5 7.5 0 007.5 15v-1zM14 7.5A6.5 6.5 0 017.5 14v1A7.5 7.5 0 0015 7.5h-1zm1 0A7.5 7.5 0 007.5 0v1A6.5 6.5 0 0114 7.5h1z'
            )
        )
    })
})
