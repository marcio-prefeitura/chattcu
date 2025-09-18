// utils/filterUtils.ts
import { IChat, ISharedChat } from '../infrastructure/utils/types'
import { IFolder } from '../shared/interfaces/Folder'

//Busca chats - History
export const filterChats = (chatsHistory: IChat[] | undefined, query: string): IChat[] => {
    if (!chatsHistory) return []
    if (query === '') return chatsHistory

    const lowerQuery = query.toLowerCase()

    return chatsHistory.filter((c: IChat) => c.titulo && c.titulo.toLowerCase().includes(lowerQuery))
}

// Busca tab files
export const filterUploadedFiles = (folders: IFolder[], text: string): IFolder[] => {
    const lowerQuery = text.toLowerCase()

    const filteredFolders = folders.map(folder => {
        const filteredArquivos = folder.arquivos.filter(arquivo => {
            return arquivo.nome.toLowerCase().includes(lowerQuery)
        })

        const isOpen = filteredArquivos.length > 0

        return {
            ...folder,
            arquivos: filteredArquivos,
            open: isOpen
        }
    })

    const removedFolders = filteredFolders.filter(f => {
        return f.nome.toLowerCase().includes(lowerQuery) || f.arquivos.length > 0
    })

    return removedFolders
}

// Ordena chats compartilhados por data_compartilhamento
const sortSharedChatsByDate = (sharedChats: ISharedChat[]): ISharedChat[] => {
    return sharedChats.slice().sort((a, b) => {
        const dateA = new Date(a.data_compartilhamento).getTime()
        const dateB = new Date(b.data_compartilhamento).getTime()
        return dateB - dateA // Ordena da data mais recente para a mais antiga
    })
}

// Busca chats compartilhados
export const filterSharedChats = (sharedChats: ISharedChat[] | undefined, query: string): ISharedChat[] => {
    if (!sharedChats) return []
    if (query === '') return sortSharedChatsByDate(sharedChats)

    const lowerQuery = query.toLowerCase()

    const filteredChats = sharedChats.filter(
        (c: ISharedChat) => c.chat.titulo && c.chat.titulo.toLowerCase().includes(lowerQuery)
    )

    return sortSharedChatsByDate(filteredChats)
}

//Busca chats Arquivados
export const filterArchiveChats = (archiveChats: IChat[] | undefined, query: string): IChat[] => {
    if (!archiveChats) {
        return []
    }

    if (query === '') return archiveChats

    const lowerQuery = query.toLowerCase()

    const historico = archiveChats.filter(
        (c: IChat) => c.titulo && c.titulo.toLowerCase().includes(lowerQuery) && c.arquivado === true
    )
    return sortChatsByArquivado(historico)
}

const sortChatsByArquivado = (chats: IChat[]): IChat[] => {
    const sortedChats = [...chats]
    sortedChats.sort((a, b) => (a.arquivado ? 1 : 0) - (b.arquivado ? 1 : 0))

    return sortedChats
}
