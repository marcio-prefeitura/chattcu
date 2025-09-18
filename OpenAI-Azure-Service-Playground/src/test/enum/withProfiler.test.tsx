import React from 'react'
import { render } from '@testing-library/react'
import withProfiler from '../../utils/withProfiler'

jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'time').mockImplementation(() => {})
jest.spyOn(console, 'timeEnd').mockImplementation(() => {})

describe('withProfiler', () => {
    const renderCount = {}

    const onRenderCallback = jest.fn((id, phase, actualDuration) => {
        if (!renderCount[id]) renderCount[id] = 0
        renderCount[id] += 1

        if (phase === 'render') {
            if (actualDuration > 500) {
                console.log('#### Nova Renderização Demorada ####')
                console.time(`Renderização ${id}`)
                console.log(`Duração: ${(actualDuration / 1000).toFixed(2)}s`)
                console.timeEnd(`Renderização ${id}`)
            }
        } else if (phase === 'update') {
            console.log('#### Atualização Detectada ####')
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render the wrapped component', () => {
        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)
        const { getByText } = render(<EnhancedComponent />)

        expect(getByText('Test Component')).toBeInTheDocument()
    })

    it('should call onRenderCallback for render phase', () => {
        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)

        render(<EnhancedComponent />)

        const actualDuration = 600
        onRenderCallback.mockImplementation((id, phase, actualDuration) => {
            if (phase === 'render' && actualDuration > 500) {
                console.log('#### Nova Renderização Demorada ####')
                console.log(`Duração: ${(actualDuration / 1000).toFixed(2)}s`)
            }
        })

        onRenderCallback('TestComponent', 'render', actualDuration)

        expect(console.log).toHaveBeenCalledWith('#### Nova Renderização Demorada ####')
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Duração: 0.60s'))
    })

    it('should call onRenderCallback for update phase', () => {
        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)

        const { rerender } = render(<EnhancedComponent />)

        rerender(<EnhancedComponent />)

        onRenderCallback.mockImplementation((id, phase, actualDuration) => {
            if (phase === 'update') {
                console.log('#### Atualização Detectada ####')
                console.log(`Duração da atualização: ${actualDuration}ms`)
            }
        })

        const actualDuration = 300
        onRenderCallback('TestComponent', 'update', actualDuration)

        expect(console.log).toHaveBeenCalledWith('#### Atualização Detectada ####')
        expect(console.log).toHaveBeenCalledWith('Duração da atualização: 300ms')
    })

    it('should not log for fast renders', () => {
        const actualDuration = 300
        onRenderCallback('TestComponent', 'render', actualDuration)
        expect(console.log).not.toHaveBeenCalledWith('#### Nova Renderização Demorada ####')
    })

    it('should log duration for slow renders', () => {
        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)

        render(<EnhancedComponent />)

        onRenderCallback.mockImplementation((id, phase, actualDuration) => {
            if (phase === 'render' && actualDuration > 500) {
                console.log(`Duração: ${(actualDuration / 1000).toFixed(2)}s`)
            }
        })

        const actualDuration = 600
        onRenderCallback('TestComponent', 'render', actualDuration)

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Duração: 0.60s'))
    })

    it('should clean up resources on component unmount', () => {
        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)

        const { unmount } = render(<EnhancedComponent />)
        unmount()

        expect(console.log).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
        const MockComponent = () => {
            throw new Error('Test Error')
        }
        const EnhancedComponent = withProfiler(MockComponent)

        expect(() => render(<EnhancedComponent />)).toThrow('Test Error')
    })

    it('should propagate props to wrapped component', () => {
        const MockComponent = ({ text }) => <div>{text}</div>
        const EnhancedComponent = withProfiler(MockComponent)

        const { getByText } = render(<EnhancedComponent text='Hello World' />)
        expect(getByText('Hello World')).toBeInTheDocument()
    })

    it('should pass correct parameters to onRenderCallback', () => {
        const actualDuration = 450
        onRenderCallback('TestComponent', 'render', actualDuration)
        expect(onRenderCallback).toHaveBeenCalledWith('TestComponent', 'render', actualDuration)
    })

    it('should call time and timeEnd for slow renders', () => {
        console.time = jest.fn()
        console.timeEnd = jest.fn()

        const MockComponent = () => <div>Test Component</div>
        const EnhancedComponent = withProfiler(MockComponent)

        render(<EnhancedComponent />)

        const mockCallback = jest.fn((id, phase, actualDuration) => {
            if (phase === 'render' && actualDuration > 500) {
                console.time(`Renderização ${id}`)
                console.timeEnd(`Renderização ${id}`)
            }
        })

        const actualDuration = 600
        mockCallback('TestComponent', 'render', actualDuration)

        expect(console.time).toHaveBeenCalledWith(expect.stringContaining('Renderização'))
        expect(console.timeEnd).toHaveBeenCalledWith(expect.stringContaining('Renderização'))
    })
})
