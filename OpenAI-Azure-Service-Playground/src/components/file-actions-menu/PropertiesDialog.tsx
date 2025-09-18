import { Backdrop, Box, Button, Fade, Modal } from '@mui/material'
import moment from 'moment-timezone'

import './PropertiesDialog.scss'

interface IPropertiesDialogProps {
    open: boolean
    onClose: () => void
    file: {
        nome: string
        usuario: string
        tamanho: number
        tipo_midia: string
        data_criacao: string
        status: string
    }
}

const PropertiesDialog: React.FC<IPropertiesDialogProps> = ({ open, onClose, file }) => {
    // Função para formatar bytes para MB
    const formatBytes = (bytes: number): string => {
        const mb = (bytes / (1024 * 1024)).toFixed(2)
        return `${mb} MB`
    }

    const formatDate = (dateString: string): string => {
        const date = moment.utc(dateString, 'YYYY-MM-DD HH:mm:ss').tz('America/Sao_Paulo')
        return date.format('DD/MM/YYYY')
    }

    const formatFileType = (mimeType: string): string => {
        // Para documentos do Office
        if (mimeType.includes('officedocument.wordprocessingml.document')) {
            return 'DOCX'
        }
        if (mimeType.includes('officedocument.spreadsheetml.sheet')) {
            return 'XLSX'
        }

        // Para PDFs
        if (mimeType.includes('pdf')) {
            return 'PDF'
        }

        // Para CSV
        if (mimeType.includes('csv')) {
            return 'CSV'
        }

        // Se não encontrar nenhum formato específico, retorna o MIME type original
        return mimeType
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500
            }}>
            <Fade in={open}>
                <Box className='properties-dialog'>
                    <h2 className='properties-dialog__titulo'>Propriedades do Arquivo</h2>

                    <Box className='properties-dialog__container'>
                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Nome do arquivo:</Box>
                            <Box className='properties-dialog__value'>{file.nome}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Data de upload:</Box>
                            <Box className='properties-dialog__value'>{formatDate(file.data_criacao)}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Tamanho:</Box>
                            <Box className='properties-dialog__value'>{formatBytes(file.tamanho)}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Formato:</Box>
                            <Box className='properties-dialog__value'>{formatFileType(file.tipo_midia)}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Status:</Box>
                            <Box className='properties-dialog__value'>{file.status}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Usuário:</Box>
                            <Box className='properties-dialog__value'>{file.usuario}</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Tamanho em palavras:</Box>
                            <Box className='properties-dialog__value'>Em breve</Box>
                        </Box>

                        <Box className='properties-dialog__item'>
                            <Box className='properties-dialog__label'>Tamanho em tokens:</Box>
                            <Box className='properties-dialog__value'>Em breve</Box>
                        </Box>
                    </Box>

                    <Box className='properties-dialog__button'>
                        <Button
                            variant='contained'
                            size='medium'
                            disableElevation
                            color='primary'
                            onClick={onClose}>
                            Fechar
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    )
}

export default PropertiesDialog
