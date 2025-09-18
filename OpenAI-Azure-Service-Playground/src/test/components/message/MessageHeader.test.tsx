import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageHeader from '../../../../src/components/chat-box/message/MessageHeader'

describe('MessageHeader', () => {
    it('renders chips for each filename in arrayFileSeach', () => {
        const files = ['file1.txt', 'file2.txt', 'file3.txt']
        render(
            <MessageHeader
                arrayFileSeach={files}
                codigo='123'
                modelo_utilizado={undefined}
            />
        )

        // Check that each file is rendered as a Chip component
        files.forEach(filename => {
            expect(screen.getByText(filename)).toBeInTheDocument()
        })
    })

    it('does not render chips when arrayFileSeach is undefined or empty', () => {
        render(
            <MessageHeader
                arrayFileSeach={undefined}
                codigo='123'
                modelo_utilizado={undefined}
            />
        )
        expect(screen.queryByText('file1.txt')).not.toBeInTheDocument()
        expect(screen.queryByText('file2.txt')).not.toBeInTheDocument()

        render(
            <MessageHeader
                arrayFileSeach={[]}
                codigo='123'
                modelo_utilizado={undefined}
            />
        )
        expect(screen.queryByText('file1.txt')).not.toBeInTheDocument()
    })

    it('renders a chip for modelo_utilizado if provided', () => {
        const modelo = 'Modelo A'
        render(
            <MessageHeader
                arrayFileSeach={['file1.txt']}
                codigo='123'
                modelo_utilizado={modelo}
            />
        )

        // Check that the modelo chip is rendered
        expect(screen.getByText(modelo)).toBeInTheDocument()
    })

    it('does not render the modelo chip if modelo_utilizado is undefined', () => {
        render(
            <MessageHeader
                arrayFileSeach={['file1.txt']}
                codigo='123'
                modelo_utilizado={undefined}
            />
        )

        // Check that modelo chip is not rendered
        expect(screen.queryByText('Modelo A')).not.toBeInTheDocument()
    })

    it('renders chips with the correct key and className', () => {
        const files = ['file1.txt', 'file2.txt']
        render(
            <MessageHeader
                arrayFileSeach={files}
                codigo='123'
                modelo_utilizado='Modelo A'
            />
        )

        // Check if each Chip has the correct key and className
        files.forEach(filename => {
            expect(screen.getByText(filename).closest('div')).toHaveAttribute(
                'class',
                'MuiChip-root MuiChip-filled MuiChip-sizeSmall MuiChip-colorDefault MuiChip-filledDefault message__base css-13htn8f-MuiChip-root'
            )
        })
        expect(screen.getByText('Modelo A').closest('div')).toHaveAttribute(
            'class',
            'MuiChip-root MuiChip-filled MuiChip-sizeSmall MuiChip-colorDefault MuiChip-filledDefault message__base css-13htn8f-MuiChip-root'
        )
    })
})
