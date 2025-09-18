import './FileUploadView.css'
import React from 'react'
import { Box, Checkbox, IconButton, Typography } from '@mui/material'
import { CircularProgressWithLabel } from '../circularprogress-with-label/CircularProgressWithLabel'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import If from '../operator/if'
import { IUploadedFile } from '../document/PdfUpload'
// import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import 'font-awesome/css/font-awesome.css'

interface IFileUploadViewProps {
    fileUpload: IUploadedFile
    readableSize: string
    onCancel: () => void
    onSelectFile: (fileName: string) => void
    handleDeleteFile: (fileName: string) => void
    handleOpenModal: () => void
}

export const FileUploadView: React.FC<IFileUploadViewProps> = ({
    fileUpload,
    onCancel,
    onSelectFile,
    handleDeleteFile,
    handleOpenModal
}) => {
    const setFileOpenModal = (file: string) => {
        handleOpenModal()
        handleDeleteFile(file)
    }
    return (
        <Box
            data-testid='file-upload-view-container'
            className={`file-upload-view-container ${fileUpload.error ? 'error' : ''}`}>
            <ListItemButton>
                <Box className='texto-progress'>
                    <If test={fileUpload.uploaded}>
                        <Box>
                            <Checkbox
                                data-testid='file-upload-checkbox'
                                checked={fileUpload.selected}
                                onChange={() => onSelectFile(fileUpload.id)}
                                size='small'
                            />
                        </Box>
                    </If>
                    <If test={!fileUpload.uploaded}>
                        <Box className='box-circular-progress'>
                            <CircularProgressWithLabel
                                data-testid={'progressbar'}
                                value={fileUpload.progress || 0}
                            />
                        </Box>
                    </If>
                    <Box>
                        <ListItemText
                            data-testid='file-upload-filename'
                            className='text-pdf'
                            primary={fileUpload.id}
                        />
                        <Box className='box-erro'>
                            <If test={fileUpload.error && fileUpload.msgError}>
                                <Typography
                                    className='error'
                                    data-testid='file-upload-msg-error'>
                                    {fileUpload.msgError}
                                </Typography>
                            </If>
                        </Box>
                    </Box>
                </Box>
                <IconButton
                    onClick={() => setFileOpenModal(fileUpload.id)}
                    data-testid='file-upload-trash-btn'>
                    <i
                        className='fa fa-trash-o lixeira'
                        aria-hidden='true'
                    />
                </IconButton>
            </ListItemButton>
            <Box>
                <IconButton
                    data-testid='cancel-button'
                    onClick={onCancel}
                />
            </Box>
        </Box>
    )
}
