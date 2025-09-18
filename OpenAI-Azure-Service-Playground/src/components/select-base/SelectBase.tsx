import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { FormControl, Select } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'

import './SelectBase.scss'

type SelectBaseProps = {
    bases: any[]
    opcaoSelecionada: string
    setOpcaoSelecionada: React.Dispatch<React.SetStateAction<string>>
    selectError
}

const SelectBase: React.FC<SelectBaseProps> = ({ bases, opcaoSelecionada, setOpcaoSelecionada, selectError }) => {
    const handleSelecaoChange = event => {
        setOpcaoSelecionada(event.target.value)
    }

    return (
        <div>
            <FormControl fullWidth>
                <Select
                    className='select-base'
                    value={opcaoSelecionada}
                    onChange={handleSelecaoChange}
                    displayEmpty
                    size='small'
                    inputProps={{ 'aria-label': 'Without label' }}
                    style={{ fontSize: '12px' }}>
                    <MenuItem
                        value=''
                        disabled
                        className='select-base-item-default'>
                        Escolher base
                    </MenuItem>

                    {bases?.map(base => (
                        <MenuItem
                            className='select-base-item'
                            key={`select-${uuidv4()}`}
                            value={base?.id}
                            style={{
                                fontSize: '12px',
                                textAlign: 'left'
                            }}>
                            {base?.nome}
                        </MenuItem>
                    ))}
                </Select>
                {selectError && (
                    <span
                        style={{
                            color: '#d32f2f',
                            fontSize: '12px',
                            marginTop: '4px',
                            alignItems: 'flex-start'
                        }}>
                        Por favor, selecione uma base.
                    </span>
                )}
            </FormControl>
        </div>
    )
}

export default SelectBase
