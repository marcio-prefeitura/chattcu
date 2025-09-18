import React from 'react'

import { Box, Tooltip } from '@mui/material'

import './DragMessage.scss'
import If from '../../../operator/if'
import { IUserInfo } from '../../../../hooks/useUserInfo'

interface IDragMessageProps {
    isDragAccept: boolean
    isDragReject: boolean
    isDragActive?: boolean
    profile?: IUserInfo
    desabledUpload?: boolean
}
export const DragMessage: React.FC<IDragMessageProps> = ({ isDragAccept, isDragReject, profile, desabledUpload }) => {
    const whatClassName = () => {
        if (isDragAccept) return 'success'

        if (isDragReject) return 'error'

        return ''
    }
    return (
        // <Tooltip
        //     title=' Selecione ou arraste um ou mais documentos para serem utilizados no chat.'
        //     arrow>
        //     <Box className='drag-message'>
        //         <Box className='icon-upload-cloud' />
        //         <div className={whatClassName()}>
        //             <div className='drag-message__texto'>
        //                 <div className='drag-message__texto--titulo'>Clique para fazer upload ou arraste</div>
        //                 <small className='drag-message__texto--informacao'>
        //                     Arquivo suportado : DOCX, PDF, XLSX E CSV
        //                 </small>
        //                 <small className='drag-message__texto--informacao'>Tamanho máximo : (50MB)</small>
        //             </div>
        //         </div>
        //     </Box>
        // </Tooltip>

        <Tooltip
            title={
                <React.Fragment>
                    Arquivo suportado: DOCX, PDF, XLSX E CSV
                    <br />
                    Tamanho máximo: (50MB)
                </React.Fragment>
            }
            arrow
            disableInteractive={desabledUpload}>
            <Box className={`drag-message ${desabledUpload ? 'disabled' : ''}`}>
                <If test={!profile?.perfilDev}>
                    <Box className='icon-layers' />
                </If>
                <div className={whatClassName()}>
                    <div className='drag-message__texto'>
                        <div className='drag-message__texto--titulo'>Arrastar e soltar para carregar ou</div>
                    </div>
                </div>
                <div className='drag-message__button'>Procurar no computador</div>
            </Box>
        </Tooltip>
    )
}
