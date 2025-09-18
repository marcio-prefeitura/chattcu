import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import moment from 'moment-timezone'
import PropertiesDialog from '../../../components/file-actions-menu/PropertiesDialog'

jest.mock('moment-timezone', () => ({
    utc: jest.fn().mockReturnThis(),
    tz: jest.fn().mockReturnThis(),
    format: jest.fn()
}))

describe('PropertiesDialog', () => {
    const mockFile = {
        nome: 'test-file.docx',
        usuario: 'John Doe',
        tamanho: 1048576, // 1MB
        tipo_midia: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        data_criacao: '2024-03-21 10:30:00',
        status: 'Ativo'
    }

    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(moment.utc as jest.Mock).mockImplementation(() => ({
            tz: () => ({
                format: () => '21/03/2024'
            })
        }))
    })

    test('renderiza corretamente quando o modal está aberto', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )

        expect(screen.getByText('Propriedades do Arquivo')).toBeInTheDocument()
        expect(screen.getByText('test-file.docx')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('1.00 MB')).toBeInTheDocument()
        expect(screen.getByText('DOCX')).toBeInTheDocument()
        expect(screen.getByText('21/03/2024')).toBeInTheDocument()
        expect(screen.getByText('Ativo')).toBeInTheDocument()
    })

    test('não renderiza quando o modal está fechado', () => {
        render(
            <PropertiesDialog
                open={false}
                onClose={mockOnClose}
                file={mockFile}
            />
        )
        expect(screen.queryByText('Propriedades do Arquivo')).not.toBeInTheDocument()
    })

    test('chama onClose quando o botão fechar é clicado', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )

        fireEvent.click(screen.getByText('Fechar'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    test('formata o tamanho do arquivo corretamente', () => {
        const fileWithLargeSize = {
            ...mockFile,
            tamanho: 2097152 // 2MB
        }

        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={fileWithLargeSize}
            />
        )
        expect(screen.getByText('2.00 MB')).toBeInTheDocument()
    })

    test('formata diferentes tipos de arquivo corretamente', () => {
        const testCases = [
            {
                tipo_midia: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                expected: 'XLSX'
            },
            {
                tipo_midia: 'application/pdf',
                expected: 'PDF'
            },
            {
                tipo_midia: 'text/csv',
                expected: 'CSV'
            }
        ]

        testCases.forEach(({ tipo_midia, expected }) => {
            render(
                <PropertiesDialog
                    open={true}
                    onClose={mockOnClose}
                    file={{ ...mockFile, tipo_midia }}
                />
            )
            expect(screen.getByText(expected)).toBeInTheDocument()
        })
    })

    test('lida com valores nulos ou vazios adequadamente', () => {
        const fileWithNulls = {
            nome: '',
            usuario: '',
            tamanho: 0,
            tipo_midia: '',
            data_criacao: '',
            status: ''
        }

        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={fileWithNulls}
            />
        )
        expect(screen.getByText('0.00 MB')).toBeInTheDocument()
    })

    test('exibe "Em breve" para contagem de palavras e tokens', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )
        const emBreveElements = screen.getAllByText('Em breve')
        expect(emBreveElements).toHaveLength(2)
    })

    test('verifica se todos os rótulos dos campos estão presentes', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )

        const rotulosEsperados = [
            'Nome do arquivo:',
            'Data de upload:',
            'Tamanho:',
            'Formato:',
            'Status:',
            'Usuário:',
            'Tamanho em palavras:',
            'Tamanho em tokens:'
        ]

        rotulosEsperados.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument()
        })
    })

    test('fecha o modal ao clicar no backdrop', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )

        const backdrop = document.querySelector('.MuiBackdrop-root')
        if (backdrop) {
            fireEvent.click(backdrop)
            expect(mockOnClose).toHaveBeenCalled()
        }
    })

    test('renderiza com a transição Fade', () => {
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={mockFile}
            />
        )
        expect(document.querySelector('.MuiModal-root')).toHaveAttribute('role', 'presentation')
    })

    test('preserva o tipo de mídia original quando não reconhecido', () => {
        const tipoMidiaDesconhecido = 'application/unknown-type'
        render(
            <PropertiesDialog
                open={true}
                onClose={mockOnClose}
                file={{ ...mockFile, tipo_midia: tipoMidiaDesconhecido }}
            />
        )
        expect(screen.getByText(tipoMidiaDesconhecido)).toBeInTheDocument()
    })
})
