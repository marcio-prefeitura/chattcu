export interface IFolder {
    id: string
    nome: string
    usuario: string
    st_removido: boolean
    id_pasta_pai: string
    data_criacao: any
    st_arquivo: boolean
    tamanho: string | number
    tipo_midia: string
    nome_blob: string
    status: string
    arquivos: IFile[]
    open: boolean
    upload?: boolean
    show?: boolean
    selected: boolean
}

export interface IFile {
    id: string
    nome: string
    usuario: string
    st_removido: boolean
    id_pasta_pai: string
    data_criacao: any
    st_arquivo: boolean
    tamanho: string | number
    tipo_midia: string
    nome_blob: string
    status: string
    selected: boolean
    progress: number
    show?: boolean
    uploaded?: boolean
}
