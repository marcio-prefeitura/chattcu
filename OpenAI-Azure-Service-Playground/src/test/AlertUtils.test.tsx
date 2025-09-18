import { act, renderHook } from '@testing-library/react'
import useAlert, { transformArrayStringToArray } from '../utils/AlertUtils'
import { isNullOrUndefined } from 'node:util'

test('handleAlert atualiza o estado corretamente', () => {
    const { result } = renderHook(() => useAlert())

    act(() => {
        result.current.handleAlert('success', 'Esta é uma mensagem de sucesso')
    })

    const updatedState = result.current

    expect(updatedState.alert?.msg).toBe('Esta é uma mensagem de sucesso')
    expect(updatedState.alert?.severity).toBe('success')
    expect(updatedState.alert?.show).toBe(true)
})

test('handleAlert deve limpar o timeout anterior', () => {
    jest.useFakeTimers() // To control the timer

    const { result } = renderHook(() => useAlert())

    act(() => {
        result.current.handleAlert('error', 'Primeira mensagem', 2000)
    })

    act(() => {
        result.current.handleAlert('warning', 'Segunda mensagem', 1000)
    })

    act(() => {
        jest.advanceTimersByTime(1500)
    })

    expect(result.current.alert?.msg).toBe('Segunda mensagem')

    jest.useRealTimers()
})

test('isNullOrUndefined retorna false para valores válidos', () => {
    expect(isNullOrUndefined('Hello')).toBe(false)
    expect(isNullOrUndefined(123)).toBe(false)
    expect(isNullOrUndefined([1, 2, 3])).toBe(false)
})

test('transformArrayStringToArray converte string para array de números', () => {
    const result = transformArrayStringToArray('1,2,3')
    expect(result).toEqual([1, 2, 3])
})

test('transformArrayStringToArray retorna null para valor nulo ou indefinido', () => {
    expect(transformArrayStringToArray(null)).toBeNull()
    expect(transformArrayStringToArray(undefined)).toBeNull()
    expect(transformArrayStringToArray('')).toBeNull()
})

test('transformArrayStringToArray retorna um array quando é um valor não string', () => {
    expect(transformArrayStringToArray([1, 2, 3])).toEqual([[1, 2, 3]])
})
