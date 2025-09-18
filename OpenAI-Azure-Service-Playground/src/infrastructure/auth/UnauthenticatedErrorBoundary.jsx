import Snackbar from '@mui/material/Snackbar'
import React from 'react'
import { linkLogin } from '../../infrastructure/api'
import { InTeamsContext } from '../../context/AppContext'

class UnauthenticatedErrorBoundary extends React.Component {
    static contextType = InTeamsContext

    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error: error?.response?.status }
    }

    componentDidCatch(error, errorInfo) {
        console.error(error)
        console.error(errorInfo)
    }

    gerarLinkLogin() {
        linkLogin(window.location.origin, encodeURIComponent(window.location.pathname)).then(
            linkLogin => (window.location.href = linkLogin)
        )
    }

    render() {
        const { inTeams } = this.context

        if (inTeams === true) {
            // For Teams, we just reload the page without showing any messages
            window.location.reload()
            return null
        } else {
            if (this.state.error === 401) {
                this.gerarLinkLogin()
                return (
                    <Snackbar
                        open={true}
                        message='Usuário não autenticado. Redirecionando para tela de login...'
                    />
                )
            } else if (this.state.error === 403) {
                return (
                    <Snackbar
                        open={true}
                        message='Usuário Sem permissão para realizar operação'
                    />
                )
            } else {
                return this.props.children
            }
        }
    }
}

export default UnauthenticatedErrorBoundary
