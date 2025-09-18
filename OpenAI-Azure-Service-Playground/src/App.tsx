/* eslint-disable @typescript-eslint/no-explicit-any */
import './App.scss'

import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useContext, useEffect, useRef, useState } from 'react'
import { InTeamsContext } from './context/AppContext'

import { MsalAuthenticationTemplate } from '@azure/msal-react'
import CustomRoutes from './infrastructure/routes/CustomRoutes'
import { darkTheme, theme } from './themes'
import './print.scss'
import { InteractionType } from '@azure/msal-browser'

const MAXIMUM_RETRIES = 3

interface Props {
    darkMode: boolean
    toggleDarkMode: any
}

const AuthenticatedBoundary = ({ darkMode, toggleDarkMode }: Props) => {
    const inTeams = useContext(InTeamsContext)
    if (!inTeams) {
        const authRequest = {
            scopes: process.env.REACT_APP_BROWSER_OAUTH_SCOPES?.split(', ')
        }
        return (
            <MsalAuthenticationTemplate
                interactionType={InteractionType.Redirect}
                authenticationRequest={authRequest}>
                <CustomRoutes
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
            </MsalAuthenticationTemplate>
        )
    }
    return (
        <CustomRoutes
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
        />
    )
}

const App = () => {
    const [darkMode, setDarkMode] = useState<boolean>(false)

    const toggleDarkMode = () => {
        if (localStorage) {
            localStorage.setItem('theme', !darkMode ? 'dark' : 'clear')
        }

        setDarkMode(prev => !prev)
    }

    useEffect(() => {
        function checkThemeData() {
            const item = localStorage.getItem('theme')

            if (item) {
                setDarkMode(item === 'dark' ? true : false)
            }
        }

        checkThemeData()
    }, [])

    useEffect(() => {
        const el = document.querySelector('body')

        if (el && darkMode) {
            el.classList.add('App-dark')
        } else if (el && !darkMode) {
            el.classList.remove('App-dark')
        }
    }, [darkMode])

    const shouldRetry = (failureCount: number, error: any) => {
        const httpResponse = error?.response?.status || 500
        const serverError = httpResponse >= 500 && httpResponse <= 599
        return failureCount < MAXIMUM_RETRIES && serverError
    }

    const queryContextRef = useRef<QueryClient>(
        new QueryClient({
            defaultOptions: {
                queries: {
                    retry: shouldRetry,
                    cacheTime: 1000 * 60 * 60 * 1,
                    staleTime: 1000 * 60 * 60 * 1,
                    refetchOnWindowFocus: false,
                    useErrorBoundary: (error: any) => error.response?.status === 401 || error.response?.status === 403
                }
            }
        })
    )

    return (
        <ThemeProvider theme={darkMode ? darkTheme : theme}>
            <div className={`App ${darkMode ? 'App-dark' : ''}`}>
                <QueryClientProvider client={queryContextRef.current}>
                    <AuthenticatedBoundary
                        darkMode={darkMode}
                        toggleDarkMode={toggleDarkMode}
                    />
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </div>
        </ThemeProvider>
    )
}

export default App
