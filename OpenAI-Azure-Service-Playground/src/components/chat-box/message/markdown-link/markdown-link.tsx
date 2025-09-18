import { Link } from '@mui/material'
import React from 'react'
import ReactMarkdown from 'react-markdown'

interface MarkdownLinkProps {
    conteudo: string
}

// Moved completely outside and independent of MarkdownLink
export const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    a: ({ href, children, ...props }: any) => (
        <Link
            style={{ cursor: 'pointer' }}
            href={href}
            target='_blank'
            rel='noopener'>
            {children}
        </Link>
    )
}

const MarkdownLink: React.FC<MarkdownLinkProps> = ({ conteudo }) => {
    return <ReactMarkdown components={markdownComponents}>{conteudo}</ReactMarkdown>
}

export default MarkdownLink
