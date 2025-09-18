import { renderHook } from '@testing-library/react'
import useQueryParams from '../../hooks/useQueryParams'

describe('useQueryParams', () => {
    test('get deve retornar undefined se o parâmetro de consulta não existir', () => {
        const { result } = renderHook(() => useQueryParams())

        // Simulamos a ausência de parâmetros de consulta na URL
        window.history.pushState({}, '', '')

        expect(result.current.get('nonExistentParam')).toBeUndefined()
    })

    // test('get deve retornar o valor do parâmetro de consulta quando existir', () => {
    //     const { result } = renderHook(() => useQueryParams())

    //     // Chamamos diretamente o método setQueryParams para definir os parâmetros de consulta
    //     act(() => {
    //         result.current.setQueryParams({ param: 'test' })
    //     })

    //     // Verificamos se o estado interno foi atualizado corretamente
    //     expect(result.current.get('param')).toBe('test')
    // })
})
