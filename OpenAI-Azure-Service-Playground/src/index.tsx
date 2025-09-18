import React, { useContext } from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import reportWebVitals from './reportWebVitals'
import './print.scss'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './browser-auth'
import { InTeamsContext } from './context/AppContext'
import { AlertProvider } from './context/AlertContext'

function AppBoundary() {
    const inTeams = useContext(InTeamsContext)
    if (inTeams) {
        return <App />
    }
    return (
        <MsalProvider instance={msalInstance}>
            <App />
        </MsalProvider>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <div className='teste'>
            <AlertProvider>
                <AppBoundary />
            </AlertProvider>
        </div>
    </React.StrictMode>
)
reportWebVitals()
