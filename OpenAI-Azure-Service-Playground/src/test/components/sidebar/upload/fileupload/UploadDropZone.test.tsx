import React from 'react'
import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { UploadDropZone } from '../../../../../components/sidebar/upload/upload-drop-zone/UploadDropZone'

const mockUseDropzone = jest.fn()
jest.mock('react-dropzone', () => ({
    useDropzone: (options: any) => mockUseDropzone(options)
}))

describe('UploadDropZone', () => {
    const mockHandleMessageErro = jest.fn()
    const mockOnUpload = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseDropzone.mockImplementation(options => {
            const onDrop = options?.onDrop
            return {
                getRootProps: () => ({}),
                getInputProps: () => ({}),
                isDragActive: false,
                isDragAccept: false,
                isDragReject: false,
                onDrop
            }
        })
    })

    describe('quando arquivos são rejeitados', () => {
        it('deve chamar handleMessageErro com a mensagem correta', async () => {
            const fileRejections = [
                {
                    file: { name: 'test.txt' },
                    errors: [{ code: 'file-invalid-type' }]
                }
            ]

            render(
                <UploadDropZone
                    onUpload={mockOnUpload}
                    handleMessageErro={mockHandleMessageErro}
                />
            )

            const onDrop = mockUseDropzone.mock.calls[0][0].onDrop
            await act(async () => {
                onDrop([], fileRejections, {})
            })

            expect(mockHandleMessageErro).toHaveBeenCalledWith({
                error: 'Tipo de arquivo não permitido(PDF, XLSX, DOCX, CSV)',
                filesName: ['test.txt']
            })
        })
    })

    describe('quando arquivos são aceitos', () => {
        it('deve chamar onUpload com os arquivos', async () => {
            const acceptedFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })]

            render(
                <UploadDropZone
                    onUpload={mockOnUpload}
                    handleMessageErro={mockHandleMessageErro}
                />
            )

            const onDrop = mockUseDropzone.mock.calls[0][0].onDrop
            await act(async () => {
                onDrop(acceptedFiles, [], {})
            })

            expect(mockOnUpload).toHaveBeenCalledWith(acceptedFiles, [], {})
        })
    })

    describe('classes CSS baseadas no estado do drag', () => {
        it('deve aplicar dragActive quando arquivo é aceito', () => {
            mockUseDropzone.mockImplementation(() => ({
                getRootProps: () => ({}),
                getInputProps: () => ({}),
                isDragActive: false,
                isDragAccept: true,
                isDragReject: false
            }))

            render(
                <UploadDropZone
                    onUpload={mockOnUpload}
                    handleMessageErro={mockHandleMessageErro}
                />
            )

            expect(screen.getByTestId('dropzone-box')).toHaveClass('dropzone dragActive')
        })

        it('deve aplicar dragReject quando arquivo é rejeitado', () => {
            mockUseDropzone.mockImplementation(() => ({
                getRootProps: () => ({}),
                getInputProps: () => ({}),
                isDragActive: false,
                isDragAccept: false,
                isDragReject: true
            }))

            render(
                <UploadDropZone
                    onUpload={mockOnUpload}
                    handleMessageErro={mockHandleMessageErro}
                />
            )

            expect(screen.getByTestId('dropzone-box')).toHaveClass('dropzone dragReject')
        })

        it('não deve aplicar classes adicionais quando não há drag', () => {
            render(
                <UploadDropZone
                    onUpload={mockOnUpload}
                    handleMessageErro={mockHandleMessageErro}
                />
            )

            const dropzoneElement = screen.getByTestId('dropzone-box')
            expect(dropzoneElement).toHaveClass('dropzone')
            expect(dropzoneElement).not.toHaveClass('dragActive')
            expect(dropzoneElement).not.toHaveClass('dragReject')
        })
    })
})
