import React, { useState, useEffect } from 'react'

interface InputImageProps {
    images: File[]
    onImagesConverted: (base64Images: string[]) => void
}

const InputImage: React.FC<InputImageProps> = ({ images, onImagesConverted }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [base64Images, setBase64Images] = useState<string[]>([])

    useEffect(() => {
        const convertImagesToBase64 = async () => {
            const convertedImages: string[] = []

            if (images.length === 0) {
                setBase64Images([])
                onImagesConverted([])
                return
            }

            for (const image of images) {
                const base64 = await resizeImage(image, 512)
                convertedImages.push(base64)
            }

            setBase64Images(convertedImages)
            onImagesConverted(convertedImages)
        }

        convertImagesToBase64()
    }, [images, onImagesConverted])
    return null
}

const resizeImage = (blob: Blob, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onloadend = () => {
            img.src = reader.result as string
        }

        reader.onerror = () => reject('Error reading file')

        reader.readAsDataURL(blob)

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (ctx) {
                const scaleFactor = maxWidth / img.width
                const newHeight = img.height * scaleFactor
                canvas.width = maxWidth
                canvas.height = newHeight

                ctx.drawImage(img, 0, 0, maxWidth, newHeight)

                const resizedBase64 = canvas.toDataURL('image/jpeg')
                const base64Content = resizedBase64.split(',')[1]

                resolve(base64Content)
            } else {
                reject('Error resizing image')
            }
        }
    })
}

export default InputImage
