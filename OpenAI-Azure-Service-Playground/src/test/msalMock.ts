// jest.mock('@azure/msal-browser')

const mockInitialize = jest.fn(() => Promise.resolve())
const mockHandleRedirectPromise = jest.fn(() => Promise.resolve())

export const mockMsalInstance = jest.fn().mockImplementation(() => {
    return {
        initialize: mockInitialize,
        handleRedirectPromise: mockHandleRedirectPromise
    }
})

// const mockInitialize = jest.fn(() => Promise.resolve())
// const mockHandleRedirectPromise = jest.fn(() => Promise.resolve())
//
// const mockMsalInstance = {
//     initialize: mockInitialize,
//     handleRedirectPromise: mockHandleRedirectPromise
// }
//
// export const PublicClientApplication = jest.fn(() => mockMsalInstance)
