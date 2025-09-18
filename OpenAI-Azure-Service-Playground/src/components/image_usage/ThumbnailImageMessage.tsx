import React, { useState } from 'react'

import { Box, IconButton, Modal } from '@mui/material'

import './ThumbnailImage.scss'

interface ThumbnailImageMessageProps {
    images: string[]
}

const ThumbnailImageMessage: React.FC<ThumbnailImageMessageProps> = ({ images }) => {
    const [open, setOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const handleOpen = (index: number) => {
        setSelectedIndex(index)
        setSelectedImage(images[index])
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        setSelectedIndex(null)
        setSelectedImage(null)
    }

    const handleNext = () => {
        if (selectedIndex !== null && selectedIndex < images.length - 1) {
            const newIndex = selectedIndex + 1
            setSelectedIndex(newIndex)
            setSelectedImage(images[newIndex])
        }
    }

    const handlePrev = () => {
        if (selectedIndex !== null && selectedIndex > 0) {
            const newIndex = selectedIndex - 1
            setSelectedIndex(newIndex)
            setSelectedImage(images[newIndex])
        }
    }

    return (
        <Box className='thumbnail-image-question'>
            {images.map((image, index) => (
                <Box
                    className='thumbnail-image__container'
                    key={index}>
                    <button
                        className='thumbnail-image__button'
                        onClick={() => handleOpen(index)}
                        aria-label={`View image ${index + 1}`}>
                        <img
                            className='thumbnail-image__image'
                            src={`data:image/jpeg;base64,${image}`}
                            alt={`Thumbnail ${index}`}
                        />
                    </button>
                </Box>
            ))}
            <Modal
                open={open}
                onClose={handleClose}>
                <Box className='thumbnail-image__modal'>
                    {selectedImage && (
                        <>
                            <IconButton
                                onClick={handlePrev}
                                disabled={selectedIndex === 0}>
                                <span className='icon-arrow-left' />
                            </IconButton>
                            <img
                                src={`data:image/jpeg;base64,${selectedImage}`}
                                alt='Full size'
                            />
                            <IconButton
                                onClick={handleNext}
                                disabled={selectedIndex === images.length - 1}>
                                <span className='icon-arrow-right' />
                            </IconButton>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    )
}

export default ThumbnailImageMessage
