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
import './CopyFileModal.scss'
import { useFileModal } from '../../hooks/useFileModal'

interface CopyFileModalProps {
    openModalCopyFile: boolean
    hiddenFolder: string
    file: any | null
    filteredFolder: any[]
    handleOpenModal: (isOpen: boolean) => void
    onCopyFile: (data: any | false, oldFolderUpdated: any) => Promise<void> | null
}

const CopyFileModal: React.FC<CopyFileModalProps> = ({
    openModalCopyFile,
    hiddenFolder,
    file,
    filteredFolder,
    handleOpenModal,
    onCopyFile
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
        operation: 'copy',
        file,
        filteredFolder,
        onCopyFile,
        onMoveFile: () => {}
    })

    if (!file) return null

    return (
        <div>
            <Modal
                open={openModalCopyFile}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}>
                <Fade in={openModalCopyFile}>
                    <Box className='copy-file-modal'>
                        <Box className='copy-file-modal__box-icone-texto'>
                            <div className='copy-file-modal__icone-close'>
                                <span className='icon-copy' />
                                <div className='copy-file-modal__texto'>
                                    <Typography className='copy-file-modal__titulo'>
                                        {isFolder
                                            ? `Copiar todos os documentos de "${file.nome}"`
                                            : `Copiar documento "${file.nome}"`}
                                    </Typography>
                                    <Typography className='copy-file-modal__subtitulo'>
                                        {isFolder
                                            ? 'Selecione a pasta para onde os documentos devem ser copiados.'
                                            : 'Selecione a pasta para onde o documento deve ser copiado.'}
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
                                    data-testid={`folder-select-${file.id}`}
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

                            <div className='copy-file-modal__botao'>
                                <Button
                                    variant='outlined'
                                    size='medium'
                                    disableElevation
                                    onClick={handleClose}
                                    className='copy-file-modal__botao--cancelar'>
                                    Cancelar
                                </Button>
                                <Button
                                    variant='contained'
                                    size='medium'
                                    disableElevation
                                    disabled={showProgress}
                                    color='primary'
                                    onClick={handleConfirm}
                                    className='copy-file-modal__botao--confirmar'>
                                    Confirmar
                                    <If test={showProgress}>
                                        <Box className='box-circular-progress'>
                                            <CircularProgressWithLabel data-testid={'progressbar'} />
                                        </Box>
                                    </If>
                                </Button>
                            </div>
                        </Box>
                    </Box>
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

export default CopyFileModal
