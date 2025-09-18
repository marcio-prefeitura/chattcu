import { AxiosError } from 'axios'
import React, { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Box, IconButton, InputAdornment, TextField } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'

import { IFolder } from '../../../../shared/interfaces/Folder'
import { useFolder } from '../../../../hooks/useFolder'
import { IUserInfo } from '../../../../hooks/useUserInfo'
import { uploadFileToAnalysis } from '../../../../infrastructure/api'
import { IUploadedFile } from '../../../document/PdfUpload'
import FolderField from '../../../folder-field/FolderField'
import If from '../../../operator/if'
import SelectDir from '../../../select_dir/SelectDir'
import { UploadDropZone } from '../upload-drop-zone/UploadDropZone'
import UploadStatus from '../upload-status/UploadStatus'

import './FileUpload.scss'

const MAX_FILE_SIZE = 50 * 1024 * 1024

interface IUploadDropDownProps {
    uploadedFiles: any[]
    setUploadedFiles: any
    opcaoSelecionada: string
    setOpcaoSelecionada: React.Dispatch<React.SetStateAction<string>>
    updateChips: (updatedFolders: IFolder[]) => void
    handleMessageSuccess: (message: string, show?: boolean) => void
    handleMessageErro: (message: string, show?: boolean) => void
    onSelectFolder: (folders: any[]) => void
    saveNewFolder: (newFolder: any) => void
    profile?: IUserInfo
    trasitionFolderField: boolean
    setTrasitionFolderField: React.Dispatch<React.SetStateAction<boolean>>
}

interface ErrorResponse {
    mensagem?: string
    status?: number
    arquivo?: any
}

interface UploadResult {
    success: boolean
    file: IUploadedFile | null
}

const UploadDropDown: React.FC<IUploadDropDownProps> = ({
    uploadedFiles,
    setUploadedFiles,
    opcaoSelecionada,
    setOpcaoSelecionada,
    updateChips,
    handleMessageSuccess,
    handleMessageErro,
    onSelectFolder,
    saveNewFolder,
    profile,
    setTrasitionFolderField,
    trasitionFolderField
}) => {
    const [filesInUpload, setFilesInUpload] = useState<IUploadedFile[]>([])
    const [filesInPreparing, setFilesInPreparing] = useState<IUploadedFile[]>([])
    const [filesInError, setFilesInError] = useState<any[]>([])
    const [filesInSuccess, setFilesInSuccess] = useState<IUploadedFile[]>([])
    const [youtubeLink, setYoutubeLink] = useState<string>('')
    const [isInvalidLink, setIsInvalidLink] = useState<boolean>(false)
    const [desabledUpload, setDesabledUpload] = useState<boolean>(false)

    const isYoutubeUrl = (url: string): boolean => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
        return youtubeRegex.test(url)
    }

    const { organizeFolders } = useFolder()

    const sortedFiles = useCallback(files => {
        return files.sort((a, b) => {
            if (a.nome < b.nome) return -1
            if (a.nome > b.nome) return 1
            return 0
        })
    }, [])
    const createFileToUpload = (file: File): IUploadedFile => ({
        file,
        id: file.name,
        nome: file.name,
        size: file.size,
        selected: false,
        uploaded: false,
        error: false,
        progress: 0,
        temp_id: uuidv4()
    })

    const createTempFile = (fileName: string) => ({
        arquivos: null,
        data_criacao: null,
        id: null,
        id_pasta_pai: null,
        nome: fileName,
        nome_blob: null,
        progress: 0,
        selected: true,
        st_arquivo: null,
        st_removido: null,
        status: null,
        tamanho: null,
        tipo_midia: null,
        uploaded: false,
        usuario: null,
        show: true
    })

    const setUploadInProgress = (folderId: string, status: boolean) => {
        if (!status) {
            const foldersUpdated = uploadedFiles.map(folder => ({
                ...folder,
                upload: folder.id === folderId ? status : folder.upload
            }))
            onSelectFolder(foldersUpdated)
        }
    }

    const handleUploadSuccess = (response: any, fileTemp: any, folderUpdated: any) => {
        const { arquivo } = response.data
        setFilesInPreparing(prev => prev.filter(file => file.nome !== arquivo.nome))

        Object.assign(fileTemp, {
            id: arquivo.id,
            data_criacao: arquivo.data_criacao,
            id_pasta_pai: arquivo.id_pasta_pai,
            nome: arquivo.nome,
            nome_blob: arquivo.nome_blob,
            progress: 100,
            selected: true,
            st_arquivo: arquivo.st_arquivo,
            st_removido: arquivo.st_removido,
            status: arquivo.status,
            tamanho: arquivo.tamanho,
            tipo_midia: arquivo.tipo_midia,
            uploaded: true,
            usuario: arquivo.usuario
        })

        const updatedFolders = uploadedFiles.map(folder =>
            folder.id === folderUpdated.id
                ? { ...folderUpdated, upload: false, open: true, selected: true }
                : { ...folder, open: false }
        )

        updateChips(updatedFolders)
        setUploadedFiles(organizeFolders(updatedFolders))
        setUploadInProgress(folderUpdated.id, false)
        return arquivo
    }

    const handleUploadError = (error: AxiosError<ErrorResponse>, fileName: string): any => {
        let erroredFile: any = null

        setFilesInPreparing(prev => {
            erroredFile = prev.find(file => file.nome === fileName)
            return prev.filter(file => file.nome !== fileName)
        })

        if (erroredFile) {
            erroredFile.msgError = error.response?.data?.mensagem?.includes('já existe no destino com o nome')
                ? 'Arquivo já existe na pasta com o mesmo nome'
                : 'Erro ao realizar upload!'
        }

        return erroredFile
    }

    const processUpload = async (fileToUpload: IUploadedFile): Promise<any> => {
        const data = new FormData()
        data.append('arquivo', fileToUpload.file)
        return uploadFileToAnalysis(opcaoSelecionada, fileToUpload.temp_id!, data, updateFile)
    }

    const handleSingleUpload = async (file: File, folderUpdated: any): Promise<UploadResult> => {
        const fileName = removeParenteses(file.name)
        const updatedFile = new File([file], fileName, { type: file.type })
        const fileToUpload = createFileToUpload(updatedFile)
        const fileTemp = createTempFile(updatedFile.name)

        setFilesInUpload(prev => [...prev, fileToUpload])
        folderUpdated.arquivos.push(fileTemp)
        folderUpdated.arquivos = sortedFiles(folderUpdated.arquivos)

        try {
            const response = await processUpload(fileToUpload)
            if (response.data?.status === 1) {
                handleUploadSuccess(response, fileTemp, folderUpdated)
                return { success: true, file: fileToUpload }
            }
        } catch (error) {
            folderUpdated.arquivos = folderUpdated.arquivos.filter(file => file !== fileTemp)
            if (error instanceof AxiosError) {
                const errorFile = handleUploadError(error, file.name)
                if (errorFile) return { success: false, file: errorFile }
            }
        }
        return { success: false, file: null }
    }

    function removeParenteses(text: string) {
        let result = ''
        let openParens = 0

        for (const char of text) {
            if (char === '(') {
                openParens++
            } else if (char === ')') {
                if (openParens > 0) {
                    openParens--
                }
            } else if (openParens === 0) {
                result += char
            }
        }
        return result.trim()
    }

    const getUploadMessage = (count: number, folderName: string, isError = false): string => {
        if (isError) {
            return 'Erro no upload: arquivo não foi carregado'
        }

        return count === 1
            ? `Upload bem sucedido: arquivo foi carregado na pasta ${folderName}`
            : `Upload bem sucedido: ${count} arquivos foram carregados na pasta ${folderName}`
    }

    const updateUploadStates = (successFiles: IUploadedFile[], errorFiles: any[], folderName: string): void => {
        if (successFiles.length) {
            setFilesInSuccess(prev => [...prev, ...successFiles])
            handleMessageSuccess(getUploadMessage(successFiles.length, folderName), true)
            setTimeout(() => handleMessageSuccess('', false), 6000)
        }

        if (errorFiles.length) {
            setFilesInError(prev => [...prev, ...errorFiles])
            handleMessageErro(getUploadMessage(errorFiles.length, folderName, true), true)
        }
    }

    const uploadFile = async (files: File[]): Promise<void> => {
        const folderUpdated = uploadedFiles.find(folder => `${folder.id}` === opcaoSelecionada)
        if (!folderUpdated) return

        setUploadInProgress(opcaoSelecionada, true)
        const results = await Promise.all(files.map(file => handleSingleUpload(file, folderUpdated)))

        const successFiles = results
            .filter(r => r.success)
            .map(r => r.file!)
            .filter(Boolean)
        const errorFiles = results.filter(r => !r.success && r.file).map(r => r.file!)

        updateUploadStates(successFiles, errorFiles, folderUpdated.nome)
    }

    const updateFile = (id: string, data: any): void => {
        setFilesInUpload(prev => {
            const updatedFiles = prev.map(file => (file.temp_id === id ? { ...file, ...data } : file))
            const completedFiles = updatedFiles.filter(file => file.progress === 100)

            setFilesInPreparing(prev => {
                const newFiles = completedFiles.filter(file => !prev.some(p => p.temp_id === file.temp_id))
                return [...prev, ...newFiles]
            })

            return updatedFiles.filter(file => file.progress !== 100)
        })
    }

    const errorFiles = (messageError: { error: string; filesName: string[] }): void => {
        setFilesInError(prev => [
            ...prev,
            ...messageError.filesName
                .filter(fileName => !prev.some(p => p.nome === fileName))
                .map(fileName => ({ nome: fileName, msgError: messageError.error }))
        ])
    }

    const handleFolderField = () => {
        setTrasitionFolderField(true)
        setDesabledUpload(true)
    }

    const handleLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value
        setYoutubeLink(newValue)

        if (newValue.trim()) {
            setIsInvalidLink(!isYoutubeUrl(newValue))
        } else {
            setIsInvalidLink(false)
        }
    }

    const handleLinkSubmit = () => {
        if (youtubeLink.trim() && isYoutubeUrl(youtubeLink)) {
            // Processa o link do YouTube
            //console.log('Processing YouTube link:', youtubeLink)
            setYoutubeLink('')
            setIsInvalidLink(false)
        }
    }

    const handleClearLink = () => {
        setYoutubeLink('')
        setIsInvalidLink(false)
    }

    return (
        <Box
            className='new-file-upload__box-dropzone'
            data-testid='upload-dropdown'>
            <Box className='new-file-upload__box-input-drop'>
                <Box className='new-file-upload__box-title'>
                    <If test={profile?.perfilDev}>
                        <If test={trasitionFolderField}>
                            <FolderField
                                onSaveFolder={folderName => saveNewFolder(folderName)}
                                setSelectedFolder={setOpcaoSelecionada}
                                setTrasitionFolderField={setTrasitionFolderField}
                                setDesabledUpload={setDesabledUpload}
                            />
                        </If>
                        <If test={!trasitionFolderField}>
                            <SelectDir
                                folders={uploadedFiles}
                                opcaoSelecionada={opcaoSelecionada}
                                setOpcaoSelecionada={setOpcaoSelecionada}
                                profile={profile}
                                handleFolderField={handleFolderField}
                            />
                            {/* <Tooltip
                                title='Nova pasta'
                                arrow>
                                <IconButton
                                    aria-label='Nova pasta'
                                    data-testid='save-folder'
                                    onClick={handleFolderField}>
                                    <span className='icon-folder-plus' />
                                </IconButton>
                            </Tooltip> */}
                        </If>
                    </If>
                </Box>

                <UploadDropZone
                    maxSize={MAX_FILE_SIZE}
                    onUpload={uploadFile}
                    handleMessageErro={errorFiles}
                    profile={profile}
                    desabledUpload={desabledUpload}
                />
            </Box>

            <If test={profile?.perfilDev}>
                <Box
                    className='link-upload'
                    data-testid='link-upload-imput'>
                    <Tooltip
                        title='Link suportado: Youtube'
                        placement='right'
                        arrow>
                        <TextField
                            fullWidth
                            id='outlined-basic'
                            placeholder='Link para transcrição (YouTube)'
                            variant='outlined'
                            size='small'
                            value={youtubeLink}
                            onChange={handleLinkChange}
                            error={isInvalidLink}
                            helperText={isInvalidLink ? 'Apenas links do YouTube são permitidos' : ''}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        {isInvalidLink ? (
                                            <IconButton
                                                data-testid='clear-button'
                                                onClick={handleClearLink}>
                                                <span className='icon-x' />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                className='folder-field__button-save'
                                                data-testid='submit-button'
                                                onClick={handleLinkSubmit}
                                                disabled={!youtubeLink.trim()}>
                                                <span className='icon-arrow-right-circle' />
                                            </IconButton>
                                        )}
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Tooltip>
                </Box>
            </If>

            <UploadStatus
                filesInUpload={filesInUpload}
                filesInPreparing={filesInPreparing}
                filesInError={filesInError}
                filesInSuccess={filesInSuccess}
                removeErrorMessage={(fileName: string) =>
                    setFilesInError(prev => prev.filter(f => f.nome !== fileName))
                }
                removeSuccessMessage={(fileName: string) =>
                    setFilesInSuccess(prev => prev.filter(f => f.nome !== fileName))
                }
            />
        </Box>
    )
}

export default UploadDropDown
