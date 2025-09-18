import { renderHook } from '@testing-library/react'
import React from 'react'
import * as api from '../../infrastructure/api'
import { useFileDownload } from '../../hooks/useFileDownload'

jest.mock('../../infrastructure/api', () => ({
    downloadFile: jest.fn(),
    downloadFolder: jest.fn()
}))

// Precisamos de um container real para o renderHook no React 18
document.body.innerHTML = '<div id="root"></div>'

describe('useFileDownload', () => {
    const mockAnchor = {
        href: '',
        target: '',
        rel: '',
        download: '',
        click: jest.fn(),
        setAttribute: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()

        global.URL.createObjectURL = jest.fn(() => 'mock-url')
        global.URL.revokeObjectURL = jest.fn()
        document.createElement = jest.fn().mockReturnValue(mockAnchor)
        document.body.appendChild = jest.fn()
        document.body.removeChild = jest.fn()
    })

    test('deve fazer download de arquivo PDF com sucesso', async () => {
        const mockDownloadFile = api.downloadFile as jest.Mock
        const fileData = new ArrayBuffer(8)
        mockDownloadFile.mockResolvedValueOnce(fileData)

        const { result } = renderHook(() => useFileDownload(), {
            container: document.getElementById('root') as HTMLElement
        })
        const file = { id: 'file-1', nome: 'documento.pdf' }

        await result.current.downloadSingleFile(file)

        expect(mockDownloadFile).toHaveBeenCalledWith('file-1')
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(result.current.isDownloading).toBe(false)
    })

    test('deve fazer download de outro tipo de arquivo com sucesso', async () => {
        const mockDownloadFile = api.downloadFile as jest.Mock
        const fileData = new ArrayBuffer(8)
        mockDownloadFile.mockResolvedValueOnce(fileData)

        const { result } = renderHook(() => useFileDownload(), {
            container: document.getElementById('root') as HTMLElement
        })
        const file = { id: 'file-2', nome: 'planilha.xlsx' }

        await result.current.downloadSingleFile(file)

        expect(mockDownloadFile).toHaveBeenCalledWith('file-2')
        expect(mockAnchor.click).toHaveBeenCalled()
    })

    test('deve lidar com erro no download de arquivo', async () => {
        const mockDownloadFile = api.downloadFile as jest.Mock
        mockDownloadFile.mockRejectedValueOnce(new Error('Download failed'))

        const { result } = renderHook(() => useFileDownload(), {
            container: document.getElementById('root') as HTMLElement
        })
        const file = { id: 'file-3', nome: 'doc.pdf' }

        await expect(result.current.downloadSingleFile(file)).rejects.toThrow('Falha ao baixar o arquivo')

        expect(result.current.isDownloading).toBe(false)
    })

    test('deve fazer download de pasta como ZIP com sucesso', async () => {
        const mockDownloadFolder = api.downloadFolder as jest.Mock
        const folderData = new ArrayBuffer(8)
        mockDownloadFolder.mockResolvedValueOnce(folderData)

        const { result } = renderHook(() => useFileDownload(), {
            container: document.getElementById('root') as HTMLElement
        })
        const folder = { id: 'folder-1', nome: 'Documents' }

        await result.current.downloadFolderAsZip(folder)

        expect(mockDownloadFolder).toHaveBeenCalledWith('folder-1')
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(result.current.isDownloading).toBe(false)
    })

    test('deve lidar com erro no download de pasta', async () => {
        const mockDownloadFolder = api.downloadFolder as jest.Mock
        mockDownloadFolder.mockRejectedValueOnce(new Error('Download failed'))

        const { result } = renderHook(() => useFileDownload(), {
            container: document.getElementById('root') as HTMLElement
        })
        const folder = { id: 'folder-2', nome: 'Documents' }

        await expect(result.current.downloadFolderAsZip(folder)).rejects.toThrow('Falha ao baixar a pasta')

        expect(result.current.isDownloading).toBe(false)
    })
})
