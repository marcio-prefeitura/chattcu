import { render, RenderOptions, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import React, { FC, ReactElement } from 'react'

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        },
        logger: {
            log: console.log,
            warn: console.warn,
            error: () => {}
        }
    })

const customRender = (ui: ReactElement, routerHistory: Array<string>, options?: Omit<RenderOptions, 'wrapper'>) => {
    return {
        user: userEvent,
        waitFor: waitFor,
        ...render(ui, {
            wrapper: children => AllTheProviders({ initialEntriesRouter: routerHistory, children: children.children }),
            ...options
        })
    }
}

export const AllTheProviders: FC<{ initialEntriesRouter: Array<string>; children: React.ReactNode }> = ({
    initialEntriesRouter = ['/'],
    children
}) => {
    initialEntriesRouter.forEach(entry => window.history.pushState({}, 'Test page', entry))
    const testQueryClient = createTestQueryClient()
    return (
        <BrowserRouter>
            <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
        </BrowserRouter>
    )
}

export * from '@testing-library/react'
export { customRender as render }
