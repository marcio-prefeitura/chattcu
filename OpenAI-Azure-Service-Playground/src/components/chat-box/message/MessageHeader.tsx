import { Box, Chip } from '@mui/material'

import If from '../../operator/if'

interface IMessageHeader {
    arrayFileSeach: string[] | undefined
    codigo: string | undefined
    modelo_utilizado: string | undefined
}

const MessageHeader: React.FC<IMessageHeader> = ({ arrayFileSeach, codigo, modelo_utilizado }) => {
    return (
        <Box className='message__historico'>
            {/* <div className='message__text'>Base de informações:</div> */}
            <Box>
                {arrayFileSeach?.map(filename => (
                    <Chip
                        key={`chip-chat-msg-${codigo}-${filename}`}
                        className='message__base'
                        label={filename}
                        size='small'
                    />
                ))}
                <If test={modelo_utilizado}>
                    <Chip
                        key={`modelo-utilizado-${codigo}-${modelo_utilizado}`}
                        className='message__base'
                        label={modelo_utilizado}
                        size='small'
                    />
                </If>
            </Box>
        </Box>
    )
}

export default MessageHeader
