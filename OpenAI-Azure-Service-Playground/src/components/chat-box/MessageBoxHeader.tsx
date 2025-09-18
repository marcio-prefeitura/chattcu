import { Box } from '@mui/material'

interface IMessageBoxHeaderProps {
    chatTitulo: string
}

const MessageBoxHeader: React.FC<IMessageBoxHeaderProps> = ({ chatTitulo }) => {
    return <Box data-testid='message-box-header'>{chatTitulo}</Box>
}

export default MessageBoxHeader
