import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LinearProgressWithLabel } from '../../../components/linearprogress-with-label/LinearProgressWithLabel'

describe('LinearProgressWithLabel', () => {
    it('deve renderizar o componente corretamente com o valor fornecido', () => {
        render(
            <LinearProgressWithLabel
                value={50}
                data-testid='progress-test'
            />
        )

        const container = screen.getByTestId('progress-test')
        const progressBar = container.querySelector('.linear-progress-with-label-container-progress')
        const label = container.querySelector('.linear-progress-with-label-container-label')

        expect(container).toBeInTheDocument()

        expect(progressBar).toBeInTheDocument()

        expect(label).toHaveTextContent('50%')
    })

    it('deve renderizar o progresso com valores limites (0%)', () => {
        render(
            <LinearProgressWithLabel
                value={0}
                data-testid='progress-zero'
            />
        )

        const container = screen.getByTestId('progress-zero')
        const label = container.querySelector('.linear-progress-with-label-container-label')

        expect(label).toHaveTextContent('0%')
    })

    it('deve renderizar o progresso com valores limites (100%)', () => {
        render(
            <LinearProgressWithLabel
                value={100}
                data-testid='progress-full'
            />
        )

        const container = screen.getByTestId('progress-full')
        const label = container.querySelector('.linear-progress-with-label-container-label')

        expect(label).toHaveTextContent('100%')
    })

    it('deve arredondar corretamente valores decimais', () => {
        render(
            <LinearProgressWithLabel
                value={45.67}
                data-testid='progress-rounded'
            />
        )

        const container = screen.getByTestId('progress-rounded')
        const label = container.querySelector('.linear-progress-with-label-container-label')

        expect(label).toHaveTextContent('46%')
    })

    it('deve aplicar corretamente o data-testid', () => {
        render(
            <LinearProgressWithLabel
                value={20}
                data-testid='progress-custom-test-id'
            />
        )

        const container = screen.getByTestId('progress-custom-test-id')

        expect(container).toBeInTheDocument()
    })
})
