import './UploadDropZone.scss'
import React, { useCallback } from 'react'
import { DropEvent, FileRejection, useDropzone } from 'react-dropzone'
import { Box } from '@mui/material'
import { DragMessage } from './DragMessage'
import { IUserInfo } from '../../../../hooks/useUserInfo'

interface IUploadDropZoneProps {
    maxSize?: number
    onUpload?: <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[], event: DropEvent) => void
    handleMessageErro: (errorMessage: { error: string; filesName: string[] }) => void
    profile?: IUserInfo
    desabledUpload?: boolean
}

export const UploadDropZone: React.FC<IUploadDropZoneProps> = ({
    onUpload,
    handleMessageErro,
    profile,
    desabledUpload
}) => {
    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
            const invalidFiles = fileRejections.filter(
                rejection => rejection.errors.length > 0 && rejection.errors[0].code === 'file-invalid-type'
            )

            if (invalidFiles.length > 0) {
                const rejectedFileNames = invalidFiles
                    .map(rejection => rejection.file.name)
                    .join('\n ')
                    .split('\n')
                const errorMessage = {
                    error: 'Tipo de arquivo não permitido(PDF, XLSX, DOCX, CSV)',
                    filesName: rejectedFileNames
                }
                handleMessageErro(errorMessage)
            }

            if (onUpload) {
                onUpload(acceptedFiles, fileRejections, event)
            }
        },
        [onUpload, handleMessageErro]
    )

    const { getRootProps, getInputProps, isDragActive, isDragReject, isDragAccept } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf', '.PDF'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx', '.DOCX'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.XLSX'],
            'text/csv': ['.csv', '.CSV'],
            'audio/mpeg': ['.mp3', '.MP3'],
            'video/mp4': ['.mp4', '.MP4']
        },
        // maxSize: maxSize
        disabled: desabledUpload
    })

    const whatClassName = () => {
        if (isDragAccept) return 'dragActive'

        if (isDragReject) return 'dragReject'

        return ''
    }

    return (
        <Box
            data-testid='dropzone-box'
            className={`dropzone ${whatClassName()}`}
            {...getRootProps()}>
            <input
                data-testid='dropzone'
                {...getInputProps()}
            />
            <DragMessage
                isDragAccept={isDragAccept}
                isDragActive={isDragActive}
                isDragReject={isDragReject}
                profile={profile}
                desabledUpload={desabledUpload}
            />
        </Box>
    )
}
