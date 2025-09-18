/* eslint-disable @typescript-eslint/no-unused-vars */
import './AcessoNegado.scss'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Link, Typography } from '@mui/material'
import { Environments } from '../infrastructure/environments/Environments'

const NotFound: React.FC = () => {
    const email = Environments.email

    const navigate = useNavigate()

    return (
        <Box className='fullPage'>
            <Box className='not-found'>
                <Box className='not-found__descricao'>
                    <Typography
                        variant='h1'
                        className='mat-display-3'>
                        404
                    </Typography>
                    <Typography
                        variant='h2'
                        className='mat-headline'>
                        Página não encontrada!
                    </Typography>
                    <Typography>
                        Caso o erro persista, entre em contato com o gestor do sistema:
                        <Link href={`mailto:${email}?subject=Análise Controle - Página não encontrada.`}> {email}</Link>
                    </Typography>
                    <Box className='not-found__button'>
                        <Button
                            variant='contained'
                            onClick={() => navigate('/')}>
                            Voltar a página inicial
                        </Button>
                    </Box>
                </Box>
                <Box className='bot-found__imagem'>
                    {/* <Lottie
                        options={defaultOptions}
                        width='400px'
                    /> */}
                </Box>
            </Box>
        </Box>
    )
}

export default NotFound
