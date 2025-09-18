import './FilterField.scss'

import { FormControl, IconButton, InputAdornment, OutlinedInput, Tooltip } from '@mui/material'
import React, { ChangeEvent } from 'react'
import { Box } from '@mui/system'

type FilterFieldProps = {
    query?: string
    title: string
    placeholder: string
    icon_position: 'end' | 'start'
    onFilterChange: (filter: string) => void
    showTooltip?: boolean
    tooltipText?: string
}

const FilterField: React.FC<FilterFieldProps> = ({
    icon_position,
    onFilterChange,
    placeholder,
    showTooltip = false,
    tooltipText = 'Buscar arquivos ou pastas'
}) => {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        onFilterChange(value)
    }

    const searchIcon = (
        <IconButton>
            <span className='icon-search' />
        </IconButton>
    )

    return (
        <div>
            <Box className='box-title'>
                <FormControl
                    variant='outlined'
                    className='box-filtrar'>
                    <OutlinedInput
                        id='outlined-adornment-search'
                        type='search'
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        endAdornment={
                            <InputAdornment position={icon_position}>
                                {showTooltip ? (
                                    <Tooltip
                                        title={tooltipText}
                                        arrow>
                                        {searchIcon}
                                    </Tooltip>
                                ) : (
                                    searchIcon
                                )}
                            </InputAdornment>
                        }
                    />
                </FormControl>
            </Box>
        </div>
    )
}

export default FilterField
