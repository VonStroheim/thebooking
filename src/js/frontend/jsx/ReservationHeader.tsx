import {Typography} from "@material-ui/core";
import React from "react";
import {tbkCommonF} from "../../typedefs";
import {ArrowRightAlt} from "@material-ui/icons";
import globals from "../../globals";

declare const TBK: tbkCommonF;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

export interface ReservationHeaderProps {
    dateStart?: Date,
    dateEnd?: Date,
    serviceName: string,
    classContainer?: string
}

export default function ReservationHeader(props: ReservationHeaderProps) {
    const styles = {
        container: {
            textAlign    : 'center',
            marginRight  : '20px',
            textTransform: 'uppercase',
            lineHeight   : 1.5,
            padding      : '0 20px 0 10px',
            borderRight  : '1px solid lightgray'
        },
        preText  : {
            fontStyle  : 'italic',
            marginRight: '4px',
        },
        year     : {
            color: '#636363'
        }
    }
    return (
        <Typography component={'div'}>
            <Typography component={'div'} variant={'h6'}>
                <span style={styles.preText}>
                    {__('Reservation for', 'thebooking')}
                </span>
                <span>
                    {props.serviceName}
                </span>
            </Typography>
            <Typography component={'div'}>
                {props.dateStart && globals.formatTime(props.dateStart)}
                {props.dateEnd && (
                    <ArrowRightAlt classes={{root: 'tbkInlineFormHeaderIcon'}}/>
                )}
                {props.dateEnd && globals.formatTime(props.dateEnd)}
            </Typography>
        </Typography>
    )
}