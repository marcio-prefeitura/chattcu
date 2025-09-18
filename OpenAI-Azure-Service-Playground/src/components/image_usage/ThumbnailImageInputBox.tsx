import React from 'react'
import { Box, IconButton } from '@mui/material'
import './ThumbnailImage.scss'

interface ThumbnailImageInputBoxProps {
    images: string[]
    onRemoveImage: (index: number) => void
}

const ThumbnailImageInputBox: React.FC<ThumbnailImageInputBoxProps> = ({ images, onRemoveImage }) => {
    return (
        <Box className='thumbnail-image'>
            {images.map((image, index) => (
                <Box
                    className='thumbnail-image__container'
                    key={index}>
                    <img
                        className='thumbnail-image__image'
                        src={`data:image/jpeg;base64,${image}`}
                        alt={`Thumbnail ${index}`}
                    />
                    <IconButton
                        size='small'
                        className='thumbnail-image__button-close'
                        onClick={() => onRemoveImage(index)}>
                        <span className='icon-x' />
                    </IconButton>
                </Box>
            ))}
        </Box>
    )
}

export default ThumbnailImageInputBox
