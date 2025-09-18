import './AcessoNegado.scss'
import React from 'react'
import { Box, Button, Link, Typography } from '@mui/material'
import { Environments } from '../infrastructure/environments/Environments'
import { logOut } from '../browser-auth'

export const AcessoNegado: React.FC = () => {
    const email = Environments.email

    return (
        <Box className='fullPage'>
            <Box className='not-found'>
                <Box className='not-found__descricao'>
                    <Typography
                        variant='h1'
                        className='mat-display-3'>
                        Acesso Negado!
                    </Typography>
                    <Typography
                        variant='h2'
                        className='mat-headline'>
                        Seu usuário não tem permissão para acessar essa plataforma
                    </Typography>
                    <Typography>
                        Entre em contato com o gestor do sistema e solicite acesso:
                        <Link href={`mailto:${email}?subject=Análise Controle - Acesso negado!`}> {email}</Link>
                    </Typography>
                    <Box className='not-found__button'>
                        <Button
                            variant='contained'
                            onClick={logOut}>
                            Sair
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
