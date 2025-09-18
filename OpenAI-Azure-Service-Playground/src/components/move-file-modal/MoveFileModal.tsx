import {
    Modal,
    Backdrop,
    Box,
    Button,
    Fade,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material'
import React from 'react'
import { AlertModal } from '../alert-modal/AlertModal'
import { CircularProgressWithLabel } from '../circularprogress-with-label/CircularProgressWithLabel'
import If from '../operator/if'
import './MoveFileModal.scss'
import { useFileModal } from '../../hooks/useFileModal'

interface MoveFileModalProps {
    openModalMoveFile: boolean
    hiddenFolder: string
    file: any | null
    filteredFolder: any[]
    handleOpenModal: (isOpen: boolean) => void
    onMoveFile: (data: any | false, oldFile: any, oldFolderUpdated: any) => void | null
}

const MoveFileModal: React.FC<MoveFileModalProps> = ({
    openModalMoveFile,
    hiddenFolder,
    file,
    filteredFolder,
    handleOpenModal,
    onMoveFile
}) => {
    const {
        selectedFolder,
        openModalFileExists,
        titleMessageExists,
        messageExistsFile,
        showCancelButton,
        showProgress,
        isFolder,
        handleClose,
        handleConfirm,
        handleFolderChange,
        setOpenModalFileExists
    } = useFileModal({
        handleOpenModal,
        operation: 'move',
        file,
        filteredFolder,
        onCopyFile: () => null,
        onMoveFile
    })

    if (!file) return null

    return (
        <div>
            <Modal
                open={openModalMoveFile}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}>
                <Fade in={openModalMoveFile}>
                    <div className='move-file-modal'>
                        <Box className='move-file-modal__box-icone-texto'>
                            <div className='move-file-modal__icone-close'>
                                <Box>
                                    <span className='icon-move' />
                                </Box>
                                <div className='move-file-modal__texto'>
                                    <Typography className='move-file-modal__titulo'>
                                        {isFolder
                                            ? `Mover todos os documentos de "${file.nome}"`
                                            : `Mover documento "${file.nome}"`}
                                    </Typography>
                                    <Typography className='move-file-modal__subtitulo'>
                                        {isFolder
                                            ? 'Selecione a pasta para onde os documentos devem ser movidos.'
                                            : 'Selecione a pasta para onde o documento deve ser movido.'}
                                    </Typography>
                                </div>
                                <IconButton
                                    aria-label=''
                                    onClick={handleClose}>
                                    <span className='icon-x' />
                                </IconButton>
                            </div>

                            <FormControl fullWidth>
                                <InputLabel id='folder-select-label'>Selecione a pasta</InputLabel>
                                <Select
                                    labelId='folder-select-label'
                                    id='folder-select'
                                    value={selectedFolder}
                                    onChange={handleFolderChange}
                                    label='Selecione a pasta'>
                                    {filteredFolder
                                        .filter(folder => folder.id.toString() !== hiddenFolder.toString())
                                        .map(folder => (
                                            <MenuItem
                                                className='list-select'
                                                key={`list-select-${folder.id}`}
                                                value={folder.id}>
                                                {folder.nome}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <div className='move-file-modal__botao'>
                                <Button
                                    variant='outlined'
                                    size='medium'
                                    disableElevation
                                    onClick={handleClose}
                                    className='move-file-modal__botao--cancelar'>
                                    Cancelar
                                </Button>
                                <Button
                                    variant='contained'
                                    size='medium'
                                    disableElevation
                                    disabled={showProgress}
                                    color='primary'
                                    onClick={handleConfirm}
                                    className='move-file-modal__botao--confirmar'>
                                    Confirmar
                                    <If test={showProgress}>
                                        <Box className='box-circular-progress'>
                                            <CircularProgressWithLabel data-testid={'progressbar'} />
                                        </Box>
                                    </If>
                                </Button>
                            </div>
                        </Box>
                    </div>
                </Fade>
            </Modal>
            <AlertModal
                message={messageExistsFile}
                messageOk='Ok'
                title={titleMessageExists}
                openModal={openModalFileExists}
                showCancelButton={showCancelButton}
                onConfirmation={() => setOpenModalFileExists(false)}
            />
        </div>
    )
}

export default MoveFileModal
