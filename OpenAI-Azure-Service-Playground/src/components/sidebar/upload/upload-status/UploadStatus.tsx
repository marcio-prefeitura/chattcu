import { Box, Typography } from '@mui/material'
import { UploadProgress } from './upload-progress/UploadProgress'
import { IUploadedFile } from '../../../document/PdfUpload'
import UploadPreparing from './upload-preparing/UploadPreparing'
import UploadError from './upload-error/UploadError'
import UploadSuccess from './upload-success/UploadSuccess'
import './UploadStatus.scss'

interface UploadStatusProps {
    filesInUpload: IUploadedFile[]
    filesInPreparing: IUploadedFile[]
    filesInError: IUploadedFile[]
    filesInSuccess: IUploadedFile[]
    removeErrorMessage: (fileName: string) => void
    removeSuccessMessage: (fileName: string) => void
}

const UploadStatus: React.FC<UploadStatusProps> = ({
    filesInUpload,
    filesInPreparing,
    filesInError,
    filesInSuccess,
    removeErrorMessage,
    removeSuccessMessage
}) => {
    const totalFiles = filesInUpload.length

    const fileSizeInMB = fileSizeInBytes => {
        return (fileSizeInBytes / (1024 * 1024)).toFixed(2)
    }

    return (
        <Box className='upload-status'>
            {totalFiles ? (
                <Typography className='upload-status__titulo'>Uploading - {totalFiles} Arquivos</Typography>
            ) : null}

            {filesInUpload.map(file => (
                <UploadProgress
                    key={`uploading-${file.temp_id}`}
                    name={file.nome}
                    size={fileSizeInMB(file.size)}
                    readableSize={'0'}
                    progress={file.progress!}
                    onCancel={() => {}}
                    error={false}
                    errorMsg=''
                />
            ))}

            {filesInPreparing.map(file => (
                <UploadPreparing
                    key={`preparing-${file.temp_id}`}
                    name={file.nome}
                    size={fileSizeInMB(file.size)}
                />
            ))}

            {filesInSuccess.map(file => (
                <UploadSuccess
                    key={`success-${file.nome}`}
                    name={file.nome}
                    removeSuccessMessage={removeSuccessMessage}
                />
            ))}

            {filesInError.map(file => (
                <UploadError
                    key={`error-${file.nome}`} // Não tem id ou temp_id aqui
                    name={file.nome}
                    msgError={file.msgError!}
                    removeErrorMessage={removeErrorMessage}
                />
            ))}
        </Box>
    )
}

export default UploadStatus
