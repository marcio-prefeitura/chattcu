import './Upload.scss'

import { useRef, useState } from 'react'
import FileUpload from './fileupload/FileUpload'
import { ISelectedFiles } from '../../../shared/interfaces/SelectedFiles'
import { IFolder } from '../../../shared/interfaces/Folder'

import MensagemErro from '../../message-toast/MessageToastError'
import MensagemSucesso from '../../message-toast/MessageToastSuccess'
import { IUserInfo } from '../../../hooks/useUserInfo'
import { useUpload } from '../../../hooks/useUpload'
import { AgentModel } from '../../../shared/interfaces/AgentModel'
import { atualizaAgenteSelecionadoNoCache, getAgentByValue } from '../history/AgentAccordion'
import { useQueryClient } from '@tanstack/react-query'

interface IUploadProps {
    profile: IUserInfo
    updatedFoldersFromChipsActions: IFolder[]
    filesSelected: ISelectedFiles[]
    setFilesSelected: React.Dispatch<React.SetStateAction<ISelectedFiles[]>>
    setSelectedAgent: any
    selectedAgent: AgentModel | null | undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Upload: React.FC<IUploadProps> = ({
    updatedFoldersFromChipsActions,
    filesSelected,
    setFilesSelected,
    profile,
    setSelectedAgent,
    selectedAgent
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [foldersSelected, setFoldersSelected] = useState<IFolder[]>([])
    const [folderUnselected] = useState<any>()
    const [showError, setShowError] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<any[]>([])
    const [showSucess, setShowSucess] = useState<boolean>(false)
    const [sucessMessage, setSucessMessage] = useState<any[]>([])
    const queryClient = useQueryClient()

    const foldersRef = useRef<IFolder[]>(foldersSelected)

    const { uploadedFiles, setUploadedFiles } = useUpload()

    const handleFileSelection = (selectedFiles: ISelectedFiles[]) => {
        setFilesSelected(selectedFiles)
        if (selectedAgent?.valueAgente) {
            setSelectedAgent(getAgentByValue(queryClient, null))
            atualizaAgenteSelecionadoNoCache(queryClient, getAgentByValue(queryClient, null))
        }
    }

    const handleMessageSucess = (message: string, show = true) => {
        setShowSucess(show)
        const mensagemSucesso = {
            message: message,
            item: {}
        }
        setSucessMessage([mensagemSucesso])
    }

    const handleMessageErro = (message: string, show = true) => {
        setShowError(show)
        const mensagemErro = {
            erro: message,
            item: {}
        }
        setErrorMessage(prev => [...prev, mensagemErro])
    }

    const handleMoveFolder = (selectedFiles: ISelectedFiles[]) => {
        setFilesSelected(selectedFiles)
    }

    const handleFolderSelection = folders => {
        setFoldersSelected(folders)
    }

    const updateFolders = (folders: IFolder[]) => {
        foldersRef.current = folders
    }

    return (
        <>
            <FileUpload
                filesSelected={filesSelected}
                onSelectFolder={handleFolderSelection}
                onMoveFolder={handleMoveFolder}
                onSelectFile={handleFileSelection}
                folderUnselectedId={folderUnselected}
                handleMessageSuccess={handleMessageSucess}
                handleMessageErro={handleMessageErro}
                onUploadedFilesChange={updateFolders}
                updatedFoldersFromChipsActions={updatedFoldersFromChipsActions}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                profile={profile}
            />
            {showSucess && (
                <MensagemSucesso
                    severity='success'
                    show={showSucess}
                    initialMsg={sucessMessage}
                    onClose={() => {
                        setShowSucess(false)
                        setSucessMessage([])
                    }}
                />
            )}
            {showError && (
                <MensagemErro
                    severity='error'
                    show={showError}
                    initialMsg={errorMessage}
                    onClose={() => {
                        setShowError(false)
                        setErrorMessage([])
                    }}
                />
            )}
        </>
    )
}

export default Upload
