import { IFile } from '../../shared/interfaces/Folder'
import { AgentModel } from '../../shared/interfaces/AgentModel'

export interface IChat {
    id: string
    titulo?: string
    usuario?: string
    mensagens: IMessageHistory[]
    apagado?: boolean
    fixado?: boolean
    arquivado?: boolean
    deleting?: boolean
    editing?: boolean
    data_criacao?: Date
    data_ultima_iteracao?: Date
    temp_chat_id?: string
    isLoading: boolean
    isStreamActive?: boolean
    numWords?: number
    trechos?: any[]
    arquivos_busca?: string
    especialista_utilizado?: any
    modelo_selecionado?: any
    shared?: boolean
    correlacaoChamadaId?: string
    config?: AgentModel
}

export interface IDestinatario {
    codigo: string
    nome: string
}

export interface ISharedChat {
    id: string
    usuario: string
    st_removido: boolean
    arquivos: IFile[]
    chat: IChat
    data_compartilhamento: Date
    destinatarios: IDestinatario[]
    message?: string
    timestamp?: Date
}
export interface IMessageHistory {
    chat_id?: string
    codigo?: string
    conteudo: string
    imagens?: string[]
    favoritado?: boolean
    feedback?: IFeedback
    papel: 'USER' | 'ASSISTANT'
    data_envio?: Date
    prompt?: string
    response?: string
    temp_chat_id?: string
    codigo_prompt?: string
    trechos?: any[]
    arquivos_busca?: string
    isStreamActive?: boolean
    arquivos_selecionados?: string[]
    arquivos_selecionados_prontos?: string[]
    tool_selecionada?: string
    modelo_selecionado?: string
    pausedText?: string
    isTyping?: boolean
    especialista_utilizado?: any
    parametro_modelo_llm?: string
    correlacao_chamada_id?: string
    config?: AgentModel
}

export interface IFeedback {
    chat_id: string
    cod_mensagem: string
    conteudo: string
    inveridico: boolean
    nao_ajudou: boolean
    ofensivo: boolean

    reacao: 'LIKED' | 'DISLIKED' | undefined
}

export interface IChatUpdate {
    chat_id: string
    novo_nome?: string
}

export interface IStreamResponse {
    temp_chat_id: string
    chat_id: string
    chat_titulo: string
    codigo_prompt: string
    response: string
    codigo_response: string
    arquivos_busca?: string
    trechos?: any[]
}

export interface IStreamResponseError {
    status: number
    message: string
}

export interface Filterchats {
    per_page: number
    page: number
    fixados?: boolean
    searchText?: string
    arquivados?: boolean
}

export interface FilterEspecialistas {
    per_page: number
    page: number
    categoria?: string
}
