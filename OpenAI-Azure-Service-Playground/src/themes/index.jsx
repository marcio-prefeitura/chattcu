import { createTheme } from '@mui/material'

const Roboto = 'Roboto'

export const theme = createTheme({
    palette: {
        primary: { main: '#3A71C7', light: '#5F98FF', dark: '#2A4070' },
        secondary: { main: '#2D2D2E', light: '#545454', dark: '#060608' },
        error: { main: '#FDEDED', light: '#FFE4E4', dark: '#AB1111' },
        warning: { main: '#FFF4E5', light: '#F9ED7F', dark: '#814D04' },
        info: { main: '#E5F6FD', light: '#D9AFFF', dark: '#890080' },
        success: { main: '#EDF7ED', light: '#CDFFF0', dark: '#005F5B' },
        // grey: {
        //     50: '#fafafa',
        //     100: '#f5f5f5',
        //     200: '#eeeeee',
        //     300: '#e0e0e0',
        //     400: '#bdbdbd',
        //     500: '#9e9e9e',
        //     600: '#757575',
        //     700: '#616161',
        //     800: '#424242',
        //     900: '#212121',
        //     A100: '#f5f5f5',
        //     A200: '#eeeeee',
        //     A400: '#bdbdbd',
        //     A700: '#616161'
        // },
        tonalOffset: 0.2,
        text: { primary: 'rgba(0, 0, 0, 0.87)', secondary: 'rgba(0, 0, 0, 0.6)', disabled: 'rgba(0, 0, 0, 0.38)' },
        common: { black: '#000', white: '#FFF' },
        contrastThreshold: 3,
        divider: 'rgba(0,0,0,0.12)',
        background: { paper: '#fff', default: '#fff' },
        action: {
            active: 'rgba(0, 0, 0, 0.54)',
            hover: ' rgba(0, 0, 0, 0.04)',
            hoverOpacity: 0.04,
            selected: 'rgba(0, 0, 0,0.08)',
            selectedOpacity: 0.08,
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
            disabledOpacity: 0.38,
            focus: 'rgba(0, 0, 0, 0.12)',
            focusOpacity: 0.12,
            activatedOpacity: 0.12
        }
    },
    shape: { borderRadius: 6 },
    shadows: [
        'none',
        '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px0px rgba(0, 0, 0, 0.12)',
        '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)',
        '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)',
        '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
        '0px 3px 5px -1pxrgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12)',
        '0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)',
        '0px 4px 5px -2px rgba(0, 0, 0, 0.2), 0px 7px 10px 1px rgba(0, 0, 0, 0.14), 0px 2px 16px 1px rgba(0, 0, 0, 0.12)',
        '0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
        '0px 5px 6px -3px rgba(0, 0, 0, 0.2), 0px 9px 12px 1px rgba(0, 0, 0, 0.14), 0px 3px 16px 2px rgba(0, 0, 0, 0.12)',
        '0px 6px 6px -3px rgba(0, 0, 0, 0.2), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12)',
        '0px 6px 7px -4px rgba(0, 0, 0, 0.2), 0px 11px 15px 1px rgba(0, 0, 0, 0.14), 0px 4px 20px 3px rgba(0, 0, 0, 0.12)',
        '0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12)',
        '0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 13px 19px 2px rgba(0, 0, 0, 0.14), 0px 5px 24px 4px rgba(0, 0, 0, 0.12)',
        '0px 7px 9px -4px rgba(0, 0, 0, 0.2), 0px 14px 21px 2px rgba(0, 0, 0, 0.14), 0px 5px 26px 4px rgba(0, 0, 0, 0.12)',
        '0px 8px 9px -5px rgba(0, 0, 0, 0.2), 0px 15px 22px 2px rgba(0, 0, 0, 0.14), 0px 6px 28px 5px rgba(0, 0, 0, 0.12)',
        '0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)',
        '0px 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12)',
        '0px 9px 11px -5px rgba(0, 0, 0, 0.2), 0px 18px 28px 2px rgba(0, 0, 0, 0.14), 0px 7px 34px 6px rgba(0, 0, 0, 0.12)',
        '0px 9px 12px -6px rgba(0, 0, 0, 0.2), 0px 19px 29px 2px rgba(0, 0, 0, 0.14), 0px 7px 36px 6px rgba(0, 0, 0, 0.12)',
        '0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12)',
        '0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 21px 33px 3px rgba(0, 0, 0, 0.14), 0px 8px 40px 7px rgba(0, 0, 0, 0.12)',
        '0px 10px 14px -6px rgba(0, 0, 0, 0.2), 0px 22px 35px 3px rgba(0, 0, 0, 0.14), 0px 8px 42px 7px rgba(0, 0, 0, 0.12)',
        '0px 11px 14px -7px rgba(0, 0, 0, 0.2), 0px 23px 36px 3px rgba(0, 0, 0, 0.14), 0px 9px 44px 8px rgba(0, 0, 0, 0.12)',
        '0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)'
    ],
    typography: {
        htmlFontSize: 16,
        fontFamily: `"${Roboto}", sans-serif`,
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 300,
            fontSize: '6rem',
            lineHeight: 1.167,
            letterSpacing: '-0.01562em'
        },
        h2: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 300,
            fontSize: '3.75rem',
            lineHeight: 1.2,
            letterSpacing: '-0.00833em'
        },
        h3: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 400,
            fontSize: '3rem',
            lineHeight: 1.167,
            letterSpacing: '0em'
        },
        h4: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 400,
            fontSize: '2.125rem',
            lineHeight: 1.235,
            letterSpacing: '0.00735em'
        },
        h5: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 400,
            fontSize: '1.5rem',
            lineHeight: 1.334,
            letterSpacing: '0em'
        },
        h6: {
            fontFamily: ` ${Roboto} , sans-serif`,
            fontWeight: 500,
            fontSize: '1.25rem',
            lineHeight: 1.6,
            letterSpacing: '0.0075em'
        },
        subtitle1: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 400,
            fontSize: '1rem',
            lineHeight: 1.75,
            letterSpacing: '0.00938em'
        },
        subtitle2: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: 1.57,
            letterSpacing: '0.00714em'
        },
        body1: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 400,
            fontSize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '0.00938em'
        },
        body2: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 400,
            fontSize: '0.875rem',
            lineHeight: 1.43,
            letterSpacing: '0.01071em'
        },
        button: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 700,
            fontSize: '0.875rem',
            lineHeight: 1.75,
            letterSpacing: '0.02857em',
            textTransform: 'capitalize'
        },
        caption: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 400,
            fontSize: '0.75rem',
            lineHeight: 1.66,
            letterSpacing: '0.03333em'
        },
        overline: {
            fontFamily: ` ${Roboto} , "Helvetica", "Arial", sans-serif`,
            fontWeight: 400,
            fontSize: '0.75rem',
            lineHeight: 2.66,
            letterSpacing: '0.08333em',
            textTransform: 'uppercase'
        }
    },
    transitions: {
        duration: {
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
            short: 250,
            shorter: 200,
            shortest: 150,
            standard: 300
        },
        easing: {
            easeIn: 'cubic-bezier(0.4,0, 1, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
        }
    }
})

export const darkTheme = createTheme({
    palette: {
        primary: { main: '#88A6FF' }, // Altera as cores conforme necessário
        secondary: { main: '#f50057' }, // Alteraa as cores conforme necessário
        type: 'dark' // Indica que é um tema escuro
    }
})
