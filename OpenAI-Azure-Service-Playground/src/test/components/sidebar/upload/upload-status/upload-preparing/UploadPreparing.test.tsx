import { render } from '@testing-library/react'
import UploadPreparing from '../../../../../../components/sidebar/upload/upload-status/upload-preparing/UploadPreparing'

describe('UploadPreparing', () => {
    it('should render the upload preparing component with correct props', () => {
        const mockName = 'Test File'
        const mockSize = '10'

        const { getByText, getByTestId } = render(
            <UploadPreparing
                name={mockName}
                size={mockSize}
            />
        )

        const uploadPreparingElement = getByTestId('upload-preparing')
        expect(uploadPreparingElement).toBeInTheDocument()

        expect(getByText(mockName)).toBeInTheDocument()

        expect(getByText(`${mockSize}MB`)).toBeInTheDocument()

        expect(getByText('Preparando arquivo para uso...')).toBeInTheDocument()
    })
})
