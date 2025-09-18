// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { webcrypto } from 'crypto'

Object.defineProperty(global, 'crypto', {
    value: {
        subtle: webcrypto.subtle,
        getRandomValues: (arr: Uint8Array) => {
            if (arr === null) {
                throw new TypeError("The provided value is not of type '(ArrayBufferView or null)'")
            }
            return webcrypto.getRandomValues(arr)
        }
    },
    configurable: true
})
