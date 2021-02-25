import {Typography} from "@material-ui/core";
import React from "react";
import {tbkCommonF} from "../../typedefs";

declare const TBK: tbkCommonF;

export interface TinyCalendarProps {
    date: Date,
    classContainer?: string,
    classDay?: string,
    classYear?: string,
}

export default function TinyCalendar(props: TinyCalendarProps) {
    const styles = {
        container: {
            textAlign    : 'center',
            marginRight  : '20px',
            textTransform: 'uppercase',
            lineHeight   : 1.5,
            padding      : '0 20px 0 10px',
        },
        day      : {
            fontSize  : '24px',
            fontWeight: 600,
            lineHeight: '22px'
        },
        year     : {
            color: '#636363'
        }
    }
    return (
        <Typography component={'div'} className={props.classContainer} style={styles.container}>
            <div>
                {new Intl.DateTimeFormat(TBK.i18n.locale, {
                    month: 'short'
                }).format(props.date)}
            </div>
            <div className={props.classDay} style={styles.day}>
                {new Intl.DateTimeFormat(TBK.i18n.locale, {
                    day: 'numeric'
                }).format(props.date)}
            </div>
            <div className={props.classYear} style={styles.year}>
                {new Intl.DateTimeFormat(TBK.i18n.locale, {
                    year: 'numeric'
                }).format(props.date)}
            </div>
        </Typography>
    )
}