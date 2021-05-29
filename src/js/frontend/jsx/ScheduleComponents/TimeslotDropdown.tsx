import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {Grid, TextField} from "@material-ui/core";
import {ServiceRecord, TimeSlot} from "../../../typedefs";
import {toDate} from "date-fns-tz";
import React from "react";
// @ts-ignore
import styles from './TimeslotDropdown.css';
import {differenceInMinutes} from "date-fns";
import ItemBadge from "./ItemBadge";

declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

interface SelectProps {
    value: TimeSlot,
    items: TimeSlot[],
    service: ServiceRecord,
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
                    <Grid container alignItems="center">
                        <Grid item xs>
                            {globals.formatTime(toDate(option.start))}
                            {props.showEndTimes &&
                            <span> - {globals.formatTime(toDate(option.end))} ({globals.minutesToDhms(differenceInMinutes(toDate(option.end), toDate(option.start)))})</span>}
                        </Grid>
                        <Grid item>
                            <Grid container direction={'row-reverse'} alignContent={'flex-end'}>
                                <Grid item style={{width: '80px'}}>
                                    {props.service.meta.timeslotCapacity > 1 && (
                                        <ItemBadge
                                            label={<span className={styles.availableLabel}>{sprintf(__('%d available', 'thebooking'), option.capacity)}</span>}
                                        />
                                    )}
                                    {!option.capacity && <ItemBadge
                                        label={<span
                                            className={styles.bookedLabel}>{props.service.meta.timeslotCapacity > 1 ? __('Sold out', 'thebooking') : __('Booked', 'thebooking')}</span>}
                                    />}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )
            }}
        />
    )
}