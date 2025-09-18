import { apagarChat, fixarChat, renameChat } from '../../infrastructure/api'
import { IChat, IMessageHistory } from '../../infrastructure/utils/types'

class Chat implements IChat {
    id: string
    titulo?: string
    usuario?: string
    mensagens: IMessageHistory[]
    apagado?: boolean
    fixado?: boolean
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

    constructor(data: IChat) {
        this.id = data.id
        this.mensagens = data.mensagens
        this.isLoading = data.isLoading
        this.titulo = data.titulo
        this.usuario = data.usuario
        this.apagado = data.apagado
        this.fixado = data.fixado
        this.deleting = data.deleting
        this.editing = data.editing
        this.data_criacao = data.data_criacao
        this.data_ultima_iteracao = data.data_ultima_iteracao
        this.temp_chat_id = data.temp_chat_id
        this.isStreamActive = data.isStreamActive
        this.numWords = data.numWords
        this.trechos = data.trechos
        this.arquivos_busca = data.arquivos_busca
    }

    async fixar() {
        this.fixado = !this.fixado
        await fixarChat(this)
    }

    async excluir() {
        await apagarChat(this.id)
    }

    async renomear(titulo: string) {
        this.titulo = titulo
        this.editing = false

        await renameChat({ chat_id: this.id, novo_nome: titulo })
    }
}

export default Chat
