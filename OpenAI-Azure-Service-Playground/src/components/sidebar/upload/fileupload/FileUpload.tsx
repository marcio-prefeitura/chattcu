import React, { useContext, useEffect, useState } from 'react'

import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import { IFile, IFolder } from '../../../../shared/interfaces/Folder'
import { ISelectedFiles } from '../../../../shared/interfaces/SelectedFiles'
import { InTeamsContext } from '../../../../context/AppContext'
import { useFile } from '../../../../hooks/useFile'
import { useFileUploadMutations } from '../../../../hooks/useFileUploadMutations'
import { useFolder } from '../../../../hooks/useFolder'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { listFilesByIds } from '../../../../infrastructure/api'
import FilterField from '../../../filter-field/FilterField'
import FolderField from '../../../folder-field/FolderField'
import ListFoldersCustom from '../../list-folders-custom/ListFoldersCustom'
import UploadDropDown from './UploadDropDown'

import './FileUpload.scss'
import { useFileDeletion } from '../../../../hooks/useFileDeletion'
import { useFileDownload } from '../../../../hooks/useFileDownload'
import { useFileSelection } from '../../../../hooks/useFileSelection'
import { useFolderSelection } from '../../../../hooks/useFolderSelection'
import { useCopyFileToFolder } from '../../../../hooks/useCopyFileToFolder'
import { useFileMoved } from '../../../../hooks/useFileMoved'
import { useFileMoveBulk } from '../../../../hooks/useFileMoveBulk'
import { useFileCopy } from '../../../../hooks/useFileCopy'
import { useUpdateChips } from '../../../../hooks/useUpdateChips'
import If from '../../../operator/if'

interface FileUploadProps {
    folderUnselectedId: string
    onSelectFolder: (folders: any[]) => void
    onMoveFolder: (selectedFiles: ISelectedFiles[]) => void
    onSelectFile: (selectedFiles: ISelectedFiles[]) => void
    handleMessageSuccess: (message: string, show?: boolean) => void
    handleMessageErro: (message: string, show?: boolean) => void
    filesSelected: ISelectedFiles[]
    updatedFoldersFromChipsActions: any[]
    onUploadedFilesChange: (folders: IFolder[]) => void
    uploadedFiles: any[]
    setUploadedFiles: any
    profile?: IUserInfo
}

export interface IFolderUpload {
    id?: string
    nome: string
    usuario?: string
    st_removido?: boolean
    id_pasta_pai?: number
    data_criacao?: string
    st_arquivo?: boolean
    tamanho?: string
    tipo_midia?: string
    nome_blob?: string
    status?: boolean
    selected?: boolean
}

export interface IFileUpload {
    id?: string
    nome: string
    usuario?: string
    st_removido?: boolean
    id_pasta_pai?: number
    data_criacao?: string
    st_arquivo?: boolean
    tamanho?: string
    tipo_midia?: string
    nome_blob?: string
    status?: boolean
    selected?: boolean
}

const arquivos_gerais = '-1'
const FileUpload: React.FC<FileUploadProps> = ({
    onSelectFolder,
    onMoveFolder,
    onSelectFile,
    folderUnselectedId,
    handleMessageErro,
    handleMessageSuccess,
    filesSelected,
    updatedFoldersFromChipsActions,
    onUploadedFilesChange,
    uploadedFiles,
    setUploadedFiles,
    profile
}) => {
    const inTeams = useContext(InTeamsContext)
    const [idsFilesNotOK, setIdsFilesNotOK] = useState<string[]>([])
    const [opcaoSelecionada, setOpcaoSelecionada] = useState(arquivos_gerais)
    const [query, setQuery] = useState<string>('')
    const { downloadSingleFile, downloadFolderAsZip } = useFileDownload()
    const [trasitionFolderField, setTrasitionFolderField] = useState<boolean>(false)

    const { updateFolderFiles, unselectAllFiles, isAllFilesSelected } = useFile()
    const {
        getFolder,
        getSelectedFiles,
        unSelectFolder,
        filterFoldersAndFiles,
        addFolder,
        updateFolders,
        selectFiles,
        organizeFolders
    } = useFolder()

    const {
        mutateCreateFolder,
        mutateDeleteFolder,
        mutateEditFolder,
        mutateDeleteFile,
        mutateDeleteFiles,
        mutateEditFile
    } = useFileUploadMutations({ onSuccess: handleMessageSuccess, onError: handleMessageErro })

    const { handleSelectFile } = useFileSelection({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        onSelectFile,
        isAllFilesSelected,
        getSelectedFiles
    })

    const { handleFolderSelected } = useFolderSelection({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        onSelectFile,
        getSelectedFiles
    })

    const { copyFileToFolder } = useCopyFileToFolder()

    const { handleMovedFile } = useFileMoved({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        handleMessageSuccess
    })

    const { handleMovedFileBulk } = useFileMoveBulk({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        handleMessageSuccess
    })

    const { updateChips } = useUpdateChips({
        getSelectedFiles,
        onMoveFolder
    })

    const { handleCopiedFile } = useFileCopy({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        handleMessageSuccess,
        copyFileToFolder,
        unselectAllFiles,
        updateChips
    })

    const { handleDeleteFiles, handleDeleteFile } = useFileDeletion({
        uploadedFiles,
        setUploadedFiles,
        onUploadedFilesChange,
        mutateDeleteFiles,
        updateChips,
        mutateDeleteFile
    })

    useEffect(() => {
        if (uploadedFiles) {
            //zera o valor
            setIdsFilesNotOK(() => [])

            uploadedFiles.forEach(folder => {
                folder.arquivos.forEach(arquivo => {
                    if (arquivo.status !== 'PRONTO') setIdsFilesNotOK([...idsFilesNotOK, arquivo.id])
                })
            })

            onUploadedFilesChange(uploadedFiles)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onUploadedFilesChange, uploadedFiles])

    useEffect(() => {
        const updatedFolders = selectFiles(uploadedFiles, filesSelected)
        setUploadedFiles(updatedFolders)
        onUploadedFilesChange(updatedFolders)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filesSelected])

    useEffect(() => {
        const updatedFolders = unSelectFolder(folderUnselectedId, uploadedFiles)
        setUploadedFiles(updatedFolders)
        onUploadedFilesChange(updatedFolders)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderUnselectedId])

    useEffect(() => {
        if (updatedFoldersFromChipsActions && updatedFoldersFromChipsActions.length > 0) {
            setUploadedFiles(updatedFoldersFromChipsActions)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updatedFoldersFromChipsActions])

    useQuery(['polling-check-file-status'], () => listFilesByIds(idsFilesNotOK), {
        onSuccess: data => {
            if (data?.arquivos) {
                data.arquivos.forEach(arq => {
                    if (arq.status === 'PRONTO') {
                        setUploadedFiles(
                            uploadedFiles.map(item => {
                                item.arquivos.forEach(iarq => {
                                    if (iarq.id === arq.id) iarq.status = arq.status
                                })
                                return item
                            })
                        )
                        setIdsFilesNotOK(prev => prev.filter(p => p !== arq.id))
                    }
                })
            }
        },
        enabled: idsFilesNotOK && idsFilesNotOK.length > 0,
        refetchInterval: 1000 * 60 // 1 min
    })

    const onFilterChange = (text: string) => {
        setQuery(text)
    }

    const saveNewFolder = async (folderName: string) => {
        const response = await mutateCreateFolder.mutateAsync(folderName)

        const updatedFolders = addFolder(uploadedFiles, response.data.pasta)

        if (response.data.status) {
            setUploadedFiles(organizeFolders(updatedFolders))
            onUploadedFilesChange(updatedFolders)

            setOpcaoSelecionada(response.data.pasta.id) // Aqui selecionamos a nova pasta após salvar
        }
    }

    const handleDeleteFolder = async (folderId: string) => {
        const response = await mutateDeleteFolder.mutateAsync(folderId)

        if (response.status) {
            const updatedFolders = uploadedFiles.filter(folder => folder.id !== folderId)
            setUploadedFiles(updatedFolders)
            onUploadedFilesChange(updatedFolders)
            if (opcaoSelecionada === folderId) {
                setOpcaoSelecionada(arquivos_gerais)
            }
        }
    }

    const handleEditFolder = async (folder: IFolder) => {
        try {
            await mutateEditFolder.mutateAsync(folder)
            const updatedFolders = updateFolders(uploadedFiles, folder)
            setUploadedFiles(organizeFolders(updatedFolders))
            onUploadedFilesChange(updatedFolders)
            return true
        } catch (error: any) {
            console.error('Erro completo:', error.response?.data)
            return false
        }
    }

    const handleEditFile = async (file: IFile) => {
        try {
            await mutateEditFile.mutateAsync(file)
            const folder = getFolder(uploadedFiles, file.id_pasta_pai)
            const updatedFolder = updateFolderFiles(folder, file)
            const updatedFolders = updateFolders(uploadedFiles, updatedFolder)

            setUploadedFiles(organizeFolders(updatedFolders))
            onUploadedFilesChange(updatedFolders)
            return true
        } catch (error: any) {
            console.error('Erro completo:', error.response?.data)
            return false
        }
    }

    const handleDownloadFile = async (file: any) => {
        try {
            await downloadSingleFile({
                id: file.id,
                nome: file.nome
            })
        } catch (error) {
            handleMessageErro('Erro ao baixar o arquivo')
        }
    }

    const handleDownloadFolder = async (folder: any) => {
        try {
            await downloadFolderAsZip({
                id: folder.id,
                nome: folder.nome
            })
        } catch (error) {
            handleMessageErro('Erro ao baixar a pasta')
        }
    }

    const filteredUploadedFiles = query !== '' ? filterFoldersAndFiles(uploadedFiles, query) : uploadedFiles

    return (
        <div className='new-file-upload'>
            <If test={!profile?.perfilDev}>
                <Box>
                    <FolderField
                        onSaveFolder={folderName => saveNewFolder(folderName)}
                        setSelectedFolder={setOpcaoSelecionada}
                        setTrasitionFolderField={setTrasitionFolderField}
                        setDesabledUpload={setUploadedFiles}
                    />
                </Box>
            </If>
            <div className={`new-file-upload__scroll ${inTeams ? 'new-file-upload__scroll__teams' : ''}`}>
                <UploadDropDown
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    opcaoSelecionada={opcaoSelecionada}
                    setOpcaoSelecionada={setOpcaoSelecionada}
                    updateChips={updateChips}
                    handleMessageSuccess={handleMessageSuccess}
                    handleMessageErro={handleMessageErro}
                    onSelectFolder={onSelectFolder}
                    saveNewFolder={saveNewFolder}
                    profile={profile}
                    setTrasitionFolderField={setTrasitionFolderField}
                    trasitionFolderField={trasitionFolderField}
                />

                <Box className='new-file-upload__box-arquivos'>
                    <Box className='new-file-upload__pasta'>
                        <Box
                            role='tabpanel'
                            className='new-file-upload__box1'>
                            <FilterField
                                query=''
                                title='Arquivos e pastas'
                                placeholder='Buscar arquivos ou pastas'
                                icon_position='end'
                                onFilterChange={onFilterChange}
                                showTooltip={true}
                                tooltipText='Buscar arquivos ou pastas'
                            />
                        </Box>
                    </Box>

                    {query !== '' && filteredUploadedFiles.length === 0 ? (
                        <div className='new-file-upload__nenhum-arquivo'>
                            <div className='icon-alert-triangle' />
                            <p className=''>Nenhum Resultado Encontrado</p>
                        </div>
                    ) : (
                        ''
                    )}
                    <Box>
                        <ListFoldersCustom
                            filteredFolder={filteredUploadedFiles}
                            onSelectFolder={handleFolderSelected}
                            handleDeleteFolder={handleDeleteFolder}
                            handleEditFolder={handleEditFolder}
                            handleDownloadFolder={handleDownloadFolder}
                            handleDeleteFiles={handleDeleteFiles}
                            handleCopiedFile={handleCopiedFile}
                            handleMovedFileBulk={handleMovedFileBulk}
                            onSelectFile={handleSelectFile}
                            handleEditFile={handleEditFile}
                            handleDeleteFile={handleDeleteFile}
                            handleDownloadFile={handleDownloadFile}
                            handleMovedFile={handleMovedFile}
                            profile={profile}
                        />
                    </Box>
                </Box>
            </div>
        </div>
    )
}

export default FileUpload
