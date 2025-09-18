import React from 'react'
import { AccordionSummary, IconButton } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ExpandLessTwoTone'
import ArrowRightIcon from '@mui/icons-material/ChevronRightTwoTone'
import CounterAccordeon from '../counter-accordeon/CounterAccordeon'
import { MoreVertRounded } from '@mui/icons-material'

interface AccordionSumaryProps {
    summaryClassName: string
    summaryTitle: string
    summaryClassNameTitle: string
    summaryAriaControls: string
    summaryId: string
    expanded: boolean
    onChange: () => void
    handleClick: (event: any) => void
    counter: number
}
const AccordionSumary: React.FC<AccordionSumaryProps> = ({
    summaryClassName,
    summaryTitle,
    expanded,
    summaryAriaControls,
    summaryId,
    summaryClassNameTitle,
    handleClick,
    counter
}) => {
    return (
        <AccordionSummary
            className={`accordionSummary ${summaryClassName}`}
            expandIcon={
                expanded ? (
                    <ArrowDropUpIcon className='icone-recentes' />
                ) : (
                    <ArrowRightIcon className='icone-recentes' />
                )
            }
            aria-controls={summaryAriaControls}
            id={summaryId}>
            <p className={summaryClassNameTitle}>{summaryTitle}</p>
            <CounterAccordeon
                chatCounter={counter}
                totalChats={counter}
            />
            <IconButton
                onClick={handleClick}
                size='small'>
                <MoreVertRounded className='opcoes-fixados-recentes' />
            </IconButton>
        </AccordionSummary>
    )
}
export default AccordionSumary
