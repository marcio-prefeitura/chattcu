import './PdfUpload.scss'

import { Box } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { filesize } from 'filesize'
import React, { useState } from 'react'

import { deleteFile } from '../../infrastructure/api'
import { AlertDialog } from '../alert-dialog/AlertDialog'
import { FileUploadView } from '../file-upload-view/FileUploadView'
import FilterField from '../filter-field/FilterField'
import MessageToast from '../message-toast/MessageToast'
import If from '../operator/if'
import { UploadDropZone } from '../sidebar/upload/upload-drop-zone/UploadDropZone'
import { IUserInfo } from '../../hooks/useUserInfo'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export interface IUploadedFile {
    id: string
    file: Blob
    nome: string
    key?: string
    url?: string
    size: number
    progress?: number
    uploaded: boolean
    error: boolean
    msgError?: string
    selected: boolean
    temp_id?: string
}

interface IPdfUploadProps {
    setUploadedFiles: React.Dispatch<React.SetStateAction<IUploadedFile[]>>
    onSelectFile: (fileName: string) => void
    uploadedFiles: IUploadedFile[] | undefined
    profile?: IUserInfo
}

export const PdfUpload: React.FC<IPdfUploadProps> = ({ setUploadedFiles, onSelectFile, uploadedFiles, profile }) => {
    const [isError, setIsError] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [query, setQuery] = useState<string>('')
    const [fileName, setFileName] = useState<string>('')
    const [isOpenModalDeleteFile, setIsOpenModalDeleteFile] = useState<boolean>(false)
    const [filtredUploadedFiles, setFiltredUploadedFiles] = useState<IUploadedFile[] | undefined>(uploadedFiles || [])

    const mutate = useMutation(async (arquivos: string[]) => await deleteFile(arquivos), {
        onError: () => {
            setIsError(true)
            setError('Ocorreu um erro na sua solicitação, tente novamente')
        },
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const openModalDeleteFile = () => {
        setIsOpenModalDeleteFile(true)
    }

    const handleDeleteFile = async () => {
        setIsOpenModalDeleteFile(false)
        setUploadedFiles(prevUploadedFiles => prevUploadedFiles.filter(file => file.nome !== fileName))
        setFiltredUploadedFiles(prevUploadedFiles => prevUploadedFiles?.filter(file => file.nome !== fileName))
        const fileToDelete = filtredUploadedFiles?.find(file => file.nome === fileName)
        if (fileToDelete) {
            await mutate.mutateAsync([fileToDelete.nome])
            if (!mutate.status) {
                alert('Erro ao Deletar o arquivo!  Atualize a pagina')
            }
        }
    }

    const handleFilterChange = (newQuery: string) => {
        setQuery(newQuery)
    }

    const getContent = (): React.JSX.Element => {
        let content = (
            <Box>
                <UploadDropZone
                    maxSize={MAX_FILE_SIZE}
                    onUpload={() => {}}
                    handleMessageErro={() => {}}
                    profile={profile}
                />
            </Box>
        )
        if (uploadedFiles?.length) {
            content = (
                <>
                    <AlertDialog
                        openModalDeleteFile={isOpenModalDeleteFile}
                        handleOpenModal={setIsOpenModalDeleteFile}
                        onConfirmation={() => handleDeleteFile()}
                    />
                    {content}
                    <Box data-testid='uploaded-files-list'>
                        <Box className='sidebar__filtro'>
                            <FilterField
                                query={query}
                                title='Teste'
                                onFilterChange={handleFilterChange}
                                placeholder='Filtrar...'
                                icon_position='start'
                            />
                        </Box>

                        <Box className='container__document-list'>
                            {filtredUploadedFiles?.map((file: IUploadedFile) => {
                                return (
                                    file && (
                                        <FileUploadView
                                            key={`file-upload-view-${file.id}`}
                                            onCancel={() => {}}
                                            onSelectFile={onSelectFile}
                                            fileUpload={file}
                                            readableSize={`${
                                                typeof file?.size === 'number' ? String(filesize(file?.size)) : '0B'
                                            }`}
                                            handleDeleteFile={setFileName}
                                            handleOpenModal={openModalDeleteFile}
                                        />
                                    )
                                )
                            })}
                        </Box>
                    </Box>
                </>
            )
        }
        return content
    }

    return (
        <>
            {getContent()}
            <If test={isError && error}>
                <MessageToast
                    show
                    msg={error ?? ''}
                    datatestid={'msgErro'}
                />
            </If>
        </>
    )
}
