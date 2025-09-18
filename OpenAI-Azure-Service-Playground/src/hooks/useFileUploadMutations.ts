import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { createFolder, deleteFile, deleteFolder, editFile, editFolder } from '../infrastructure/api'

interface MutationHandlers {
    onSuccess: (message: string, show?: boolean) => void
    onError: (message: string, show?: boolean) => void
}

interface ErrorResponse {
    mensagem: string
}

export const useFileUploadMutations = (handlers: MutationHandlers) => {
    const mutateCreateFolder = useMutation(async (folderName: string) => await createFolder({ nome: folderName }), {
        onSuccess: (data: any, folderName: string) => {
            handlers.onSuccess(`Pasta "${folderName}" criada!`)
        },
        onError: () => {
            handlers.onError('Erro ao criar pasta: A pasta já existe com este nome !')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateDeleteFolder = useMutation(async (folderId: string) => await deleteFolder(folderId), {
        onSuccess: () => {
            handlers.onSuccess('Pasta excluída!')
        },
        onError: () => {
            handlers.onError('Ocorreu um erro ao excluir a pasta!')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateEditFolder = useMutation(async (folder: any) => await editFolder(folder.id, folder), {
        onSuccess: () => {
            handlers.onSuccess('Pasta Renomeada!')
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as ErrorResponse).mensagem
            handlers.onError(errorMessage)
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateDeleteFile = useMutation(async (fileIds: string[]) => await deleteFile(fileIds), {
        onSuccess: () => {
            handlers.onSuccess('Arquivo excluído!')
        },
        onError: () => {
            handlers.onError('Ocorreu um erro ao excluir o arquivo!')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateDeleteFiles = useMutation(async (fileIds: string[]) => await deleteFile(fileIds), {
        onSuccess: () => {
            handlers.onSuccess('Arquivos excluídos!')
        },
        onError: () => {
            handlers.onError('Ocorreu um erro ao excluir os arquivos!')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const mutateEditFile = useMutation(async (file: any) => await editFile(file.id, file), {
        onSuccess: () => {
            handlers.onSuccess('Arquivo editado com sucesso!')
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as ErrorResponse).mensagem
            handlers.onError(errorMessage)
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    return {
        mutateCreateFolder,
        mutateDeleteFolder,
        mutateEditFolder,
        mutateDeleteFile,
        mutateDeleteFiles,
        mutateEditFile
    }
}
