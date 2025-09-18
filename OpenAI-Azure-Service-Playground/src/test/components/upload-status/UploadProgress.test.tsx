import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UploadProgress } from '../../../components/sidebar/upload/upload-status/upload-progress/UploadProgress'
import { LinearProgressWithLabel } from '../../../components/sidebar/upload/upload-status/upload-progress/linearprogress-with-label/LinearProgressWithLabel'

jest.mock(
    '../../../components/sidebar/upload/upload-status/upload-progress/linearprogress-with-label/LinearProgressWithLabel',
    () => ({
        LinearProgressWithLabel: jest.fn(() => <div data-testid='mock-progressbar'>Mock Progress Bar</div>)
    })
)

describe('UploadProgress Component', () => {
    const defaultProps = {
        name: 'FileName.jpg',
        size: '2MB',
        readableSize: '2 MB',
        progress: 50,
        onCancel: jest.fn()
    }

    it('should render the component with default props', () => {
        render(<UploadProgress {...defaultProps} />)

        expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
        expect(screen.getByText('FileName.jpg')).toBeInTheDocument()
        expect(LinearProgressWithLabel).toHaveBeenCalledWith(expect.objectContaining({ value: 50 }), {})
    })

    it('should add the error class when error is true', () => {
        render(
            <UploadProgress
                {...defaultProps}
                error={true}
                errorMsg='Upload failed'
            />
        )

        const container = screen.getByTestId('upload-progress')
        expect(container).toHaveClass('error')
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })

    it('should not display error message when error is false', () => {
        render(
            <UploadProgress
                {...defaultProps}
                error={false}
                errorMsg='Upload failed'
            />
        )

        const container = screen.getByTestId('upload-progress')
        expect(container).not.toHaveClass('error')
        expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
    })

    it('should handle missing optional props gracefully', () => {
        render(
            <UploadProgress
                name='FileName.jpg'
                progress={25}
                onCancel={jest.fn()}
                readableSize={'0'}
                size={'10MB'}
            />
        )

        expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
        expect(screen.getByText('FileName.jpg')).toBeInTheDocument()
    })
})
