import { act, renderHook } from '@testing-library/react'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

describe('useCopyToClipboard', () => {
    it('deve copiar o texto para a área de transferência e definir hasCopied como verdadeiro', async () => {
        const mockWriteText = jest.fn()

        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: mockWriteText
            },
            writable: true
        })

        const { result } = renderHook(() => useCopyToClipboard())

        const textoParaCopiar = 'Olá, mundo!'
        await act(async () => {
            result.current.copyToClipboard(textoParaCopiar)
        })

        expect(mockWriteText).toHaveBeenCalledWith(textoParaCopiar)

        expect(result.current.hasCopied).toBe(true)
    })

    it('deve definir hasCopied como falso após a duração de redefinição', async () => {
        const mockWriteText = jest.fn()

        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: mockWriteText
            },
            writable: true
        })

        const duracaoRedefinicao = 2000

        const { result } = renderHook(() => useCopyToClipboard(duracaoRedefinicao))

        const textoParaCopiar = 'Olá, mundo!'
        await act(async () => {
            result.current.copyToClipboard(textoParaCopiar)
        })

        expect(result.current.hasCopied).toBe(true)

        await new Promise(resolve => setTimeout(resolve, duracaoRedefinicao + 100))
    })
})
