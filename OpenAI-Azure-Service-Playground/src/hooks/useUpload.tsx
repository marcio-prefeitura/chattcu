import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listFolders } from '../infrastructure/api'
import { useFolder } from './useFolder'
import { IFolder } from '../shared/interfaces/Folder'
import { useCallback, useEffect, useState } from 'react'

interface IUseUpload {
    uploadedFiles: IFolder[]
    setUploadedFiles: (files: IFolder[]) => void
}

export const useUpload = (): IUseUpload => {
    const [uploadedFiles, setUploadedFiles] = useState<IFolder[]>([])
    const queryClient = useQueryClient()

    const { organizeFolders } = useFolder()

    const updateCache = useCallback(
        (files: IFolder[]) => {
            queryClient.setQueryData(['listFolders'], files)
        },
        [queryClient]
    )

    const { data } = useQuery(['listFolders'], listFolders, {
        // select: data => setUploadedFiles(organizeFolders(data)),
        //onSuccess: data => setUploadedFiles(organizeFolders(data)),
        //onError: () => handleAlert('error', 'Ocorreu um erro ao listar o chat'),
        cacheTime: Infinity,
        staleTime: Infinity
    })

    useEffect(() => {
        if (data && data.length > 0) {
            setUploadedFiles(organizeFolders(data))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const handleSetUploadedFiles = (files: IFolder[]) => {
        if (files && files.length > 0) {
            updateCache(files)
            setUploadedFiles(files)
        }
    }

    return {
        uploadedFiles,
        setUploadedFiles: handleSetUploadedFiles
    }
}
