import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {Avatar, Grid, Container, TextField, Typography} from "@material-ui/core";
import {Location} from "../../../typedefs";
import React from "react";
import RoomIcon from "@material-ui/icons/Room";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface SelectProps {
    value?: Location,
    locations: Location[],

    onChange(event: any, value: Location): any
}

export default function LocationDropdown(props: SelectProps) {
    return (
        <Autocomplete
            renderInput={(params) =>
                <>
                    <TextField {...params} label={__('Location', 'the-booking')} variant="outlined"/>
                </>
            }
            disableClearable
            openOnFocus
            noOptionsText={__('No locations', 'the-booking')}
            options={props.locations}
            value={props.value}
            onChange={props.onChange}
            getOptionLabel={(location: Location) => location.l_name}
            renderOption={(location: Location) => {
                return (
                    <Grid container alignItems="center">
                        <Grid item>
                            <Avatar>
                                <RoomIcon/>
                            </Avatar>
                        </Grid>
                        <Grid item>
                            <Container>
                                <Typography variant={'body2'}>
                                    {location.l_name}
                                </Typography>
                                <Typography variant={'body2'} color={'textSecondary'}>
                                    {location.address}
                                </Typography>
                            </Container>
                        </Grid>
                    </Grid>
                )
            }}
        />
    )
}