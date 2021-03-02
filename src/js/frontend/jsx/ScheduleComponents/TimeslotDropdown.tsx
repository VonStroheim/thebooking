import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {TextField} from "@material-ui/core";
import {TimeSlot} from "../../../typedefs";
import {toDate} from "date-fns-tz";
import React from "react";
// @ts-ignore
import styles from './TimeslotDropdown.css';

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface SelectProps {
    value: TimeSlot,
    items: TimeSlot[],

    onChange(event: any, value: TimeSlot): any
}

export default function TimeslotDropdown(props: SelectProps) {
    return (
        <Autocomplete
            renderInput={(params) => <TextField {...params} label={__('Start time', 'the-booking')} variant="outlined"/>}
            options={props.items}
            disableClearable
            openOnFocus
            getOptionDisabled={(option) => option.soldOut}
            value={props.value}
            onChange={props.onChange}
            getOptionLabel={(option: TimeSlot) => globals.formatTime(toDate(option.start))}
            renderOption={(option) => {
                return (
                    <div>
                        {globals.formatTime(toDate(option.start))}
                        {option.soldOut && <span className={styles.bookedLabel}>{__('Booked', 'the-booking')}</span>}
                    </div>
                )
            }}
        />
    )
}