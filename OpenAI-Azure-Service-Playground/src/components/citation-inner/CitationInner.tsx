import React, { useState } from 'react'

import { Box, Button, Collapse, Divider, IconButton, Typography } from '@mui/material'

import { downloadFile } from '../../infrastructure/api'
import { useAlert } from '../../context/AlertContext'
import { CircularProgressWithLabel } from '../circularprogress-with-label/CircularProgressWithLabel'
import MessageToast from '../message-toast/MessageToast'
import If from '../operator/if'
import CopyLink from '../../utils/CopyLink'

import './CitationInner.scss'

export interface ICitation {
    key: string | undefined
    isFile: boolean
    trecho: any | null
    disabled: boolean | undefined
    index: number
    activeIndex: Set<number>
}

export interface ICitationProps {
    citation: ICitation
    toggleActiveIndex: (index: number) => void
}

const CitationInner: React.FC<ICitationProps> = ({ citation, toggleActiveIndex }) => {
    const [showProgress, setShowProgress] = useState<boolean>(false)
    const { alert, handleAlert } = useAlert()

    const { key, isFile, trecho, disabled, index, activeIndex } = citation

    if (!trecho || disabled) return null

    const conteudoFormatado =
        trecho && trecho.pagina_arquivo !== null ? trecho?.conteudo : trecho?.conteudo.replaceAll('RESUMO', '')

    const handleDownloadFile = async () => {
        setShowProgress(true)
        /**
         * Realizar a consulta para retornar os
         * dados do arquivo para definir o type e saber
         * se o usr pode ou não realizar o download
         */
        const data = await downloadFile(trecho.id_arquivo_mongo)
        const blob = new Blob([data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.download = trecho.id_arquivo_mongo

        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        setShowProgress(false)
    }

    const handleLinkClick = () => {
        window.open(trecho.link_sistema, '_blank')
    }

    const tituloReferencia = isFile ? trecho.id_registro?.split(' - número ')[0] : trecho.id_registro?.split('_')[0]

    const handleOpen = () => {
        toggleActiveIndex(index)
    }

    return (
        <Collapse
            key={`collapse-inner-${key}`}
            in={activeIndex?.has(index)}>
            <Box
                key={`box-citation-inner-${key}`}
                className='trecho'>
                {isFile ? (
                    <Box>
                        <Box className='trecho__header'>
                            <sup>{index}</sup>
                            <Typography className='trecho__titulo'>{tituloReferencia}</Typography>
                            <IconButton
                                data-testid='button-upper-close'
                                onClick={handleOpen}>
                                <span className='icon-x' />
                            </IconButton>
                        </Box>
                        <Divider className='trecho__divider' />
                        <Box>
                            <Typography
                                className='trecho__box--text'
                                variant='body2'
                                dangerouslySetInnerHTML={{ __html: conteudoFormatado }}
                            />
                        </Box>
                        <Box className='trecho-file__box-botao'>
                            <Button
                                data-testid='cit-inner-btn-download-file'
                                variant='outlined'
                                disableElevation
                                size='medium'
                                disabled={showProgress}
                                onClick={handleDownloadFile}
                                className='trecho-file__box-botao--download'>
                                <Box className='icon-download' />
                                <Typography
                                    variant='caption'
                                    style={{ fontWeight: 'bold' }}>
                                    Download
                                </Typography>
                                <If test={showProgress}>
                                    <Box className='trecho-file__box-botao--progress'>
                                        <CircularProgressWithLabel data-testid={'progressbar'} />
                                    </Box>
                                </If>
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Box className='trecho__header'>
                            <sup>{index}</sup>
                            <Typography className='trecho__titulo'>{tituloReferencia}</Typography>
                            <IconButton
                                data-testid='button-upper-close'
                                className='trecho__header__fechar'
                                onClick={handleOpen}>
                                <span className='icon-x' />
                            </IconButton>
                        </Box>
                        <Divider className='trecho__divider' />
                        <Box>
                            <Typography
                                className='trecho__texto'
                                variant='body2'
                                dangerouslySetInnerHTML={{ __html: trecho.conteudo }}
                            />
                        </Box>
                        <Box className='trecho__linha'>
                            <Typography
                                key='trecho-link'
                                data-testid='trecho-link'
                                className='trecho__link'
                                variant='body2'
                                onClick={handleLinkClick}
                                dangerouslySetInnerHTML={{ __html: trecho.link_sistema }}
                            />
                            <CopyLink
                                url={trecho.link_sistema}
                                handleAlert={handleAlert}
                            />
                        </Box>
                    </Box>
                )}
                <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
            </Box>
        </Collapse>
    )
}

export default CitationInner
