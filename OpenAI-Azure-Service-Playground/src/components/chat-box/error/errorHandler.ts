export const setError = (response: Response): { status: number; statusText: string } => {
    if (response.status === 401) {
        return {
            status: 401,
            statusText: 'Usuário não autenticado. Redirecionando para tela de login...'
        }
    }

    if (response.status === 403) {
        return {
            status: 403,
            statusText: 'Usuário Sem permissão para realizar operação'
        }
    }

    return {
        status: 500,
        statusText: 'Ocorreu um erro na sua solicitação, tente novamente'
    }
}
