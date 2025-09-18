import './FilesNotOk.scss'

import { useQuery } from '@tanstack/react-query'

import { Accordion, AccordionDetails, AccordionSummary, Chip } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import If from '../../../operator/if'
import { IMessageHistory } from '../../../../infrastructure/utils/types'
import { listFilesByIds } from '../../../../infrastructure/api'

interface FilesNotOk {
    message: IMessageHistory
    ids_arquivos_ignorados: any
}

const FilesNotOk: React.FC<FilesNotOk> = ({ message, ids_arquivos_ignorados }) => {
    const query = useQuery([`files-notok-msg-${message.codigo}`], () => listFilesByIds(ids_arquivos_ignorados), {
        cacheTime: Infinity,
        staleTime: Infinity,
        enabled: !!ids_arquivos_ignorados
    })

    return (
        <If test={query.data && query.data.arquivos && query.data.arquivos.length > 0}>
            <Accordion className='arquivos-ignorados'>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls='arquivos-ignorados-content'
                    className='arquivos-ignorados__header'>
                    <h5 className='arquivos-ignorados__titulo'>Arquivos que não estavam prontos</h5>
                </AccordionSummary>
                <AccordionDetails>
                    {query.data?.arquivos?.map(file => (
                        <Chip
                            key={file.id}
                            className='arquivos-ignorados__chip'
                            label={file.nome}
                            size='small'
                            variant='outlined'
                        />
                    ))}
                </AccordionDetails>
            </Accordion>
        </If>
    )
}

export default FilesNotOk
