import { useState } from 'react'
import { downloadFile, downloadFolder } from '../infrastructure/api'

interface FileInfo {
    id: string
    nome: string
}

interface FolderInfo {
    id: string
    nome: string
}

interface UseFileDownloadReturn {
    isDownloading: boolean
    downloadSingleFile: (file: FileInfo) => Promise<void>
    downloadFolderAsZip: (folder: FolderInfo) => Promise<void>
}

export const useFileDownload = (): UseFileDownloadReturn => {
    const [isDownloading, setIsDownloading] = useState(false)

    const createAndTriggerDownload = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')

        try {
            link.href = url
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            link.download = filename

            document.body.appendChild(link)
            link.click()
        } finally {
            // Limpeza
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
    }

    /**
     * Download de arquivo individual
     * Trata o retorno específico da API downloadFile
     */
    const downloadSingleFile = async (file: FileInfo) => {
        try {
            setIsDownloading(true)
            // A API downloadFile retorna o buffer do arquivo diretamente
            const fileBuffer = await downloadFile(file.id)

            // Para arquivos PDF
            if (file.nome.toLowerCase().endsWith('.pdf')) {
                const blob = new Blob([fileBuffer], { type: 'application/pdf' })
                createAndTriggerDownload(blob, file.nome)
                return
            }

            // Para outros tipos de arquivo, tentar detectar o tipo
            const blob = new Blob([fileBuffer], { type: 'application/octet-stream' })
            createAndTriggerDownload(blob, file.nome)
        } catch (error) {
            console.error('Error downloading file:', error)
            throw new Error('Falha ao baixar o arquivo')
        } finally {
            setIsDownloading(false)
        }
    }

    /**
     * Download de pasta como ZIP
     * Trata o retorno específico da API downloadFolder
     */
    const downloadFolderAsZip = async (folder: FolderInfo) => {
        try {
            setIsDownloading(true)
            // A API downloadFolder retorna um arquivo ZIP
            const folderData = await downloadFolder(folder.id)

            // Cria o blob a partir dos dados retornados
            const blob = new Blob([folderData], { type: 'application/zip' })
            createAndTriggerDownload(blob, `${folder.nome}.zip`)
        } catch (error) {
            console.error('Error downloading folder:', error)
            throw new Error('Falha ao baixar a pasta')
        } finally {
            setIsDownloading(false)
        }
    }

    return {
        isDownloading,
        downloadSingleFile,
        downloadFolderAsZip
    }
}
