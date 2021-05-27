import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import {TextField} from "@material-ui/core";
import {TimeSlot} from "../../../typedefs";
import {toDate} from "date-fns-tz";
import React from "react";
// @ts-ignore
import styles from './TimeslotDropdown.css';
import {differenceInMinutes} from "date-fns";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface SelectProps {
    value: TimeSlot,
    items: TimeSlot[],
    showEndTimes?: boolean

    onChange(event: any, value: TimeSlot): any
}

export default function TimeslotDropdown(props: SelectProps) {
    return (
        <Autocomplete
            renderInput={(params) => <TextField {...params} label={__('Start time', 'thebooking')} variant="outlined"/>}
            options={props.items}
            classes={{
                // Ensures compatibility with TwentyTwentyOne theme
                popupIndicator: 'has-background has-text-color',
                clearIndicator: 'has-background has-text-color'
            }}
            // Ensures compatibility with Elementor iframe
            disablePortal
            disableClearable
            openOnFocus
            getOptionDisabled={(option) => !option.capacity}
            value={props.value}
            onChange={props.onChange}
            getOptionLabel={(option: TimeSlot) => {
                if (props.showEndTimes) {
                    return globals.formatTime(toDate(option.start)) + ' - '
                        + globals.formatTime(toDate(option.end))
                        + ' (' + globals.minutesToDhms(differenceInMinutes(toDate(option.end), toDate(option.start))) + ')'
                }
                return globals.formatTime(toDate(option.start))
            }}
            renderOption={(option) => {
                return (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        {globals.formatTime(toDate(option.start))}
                        {props.showEndTimes && (
                            <>
                                <ArrowRightAltIcon/>
                                {globals.formatTime(toDate(option.end))}
                                <span style={{marginLeft: '6px'}}>({globals.minutesToDhms(differenceInMinutes(toDate(option.end), toDate(option.start)))})</span>
                            </>
                        )}
                        {!option.capacity && <span className={styles.bookedLabel}>{__('Booked', 'thebooking')}</span>}
                    </div>
                )
            }}
        />
    )
}