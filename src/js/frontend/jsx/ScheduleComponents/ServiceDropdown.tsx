import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {Avatar, Grid, Container, TextField, Typography} from "@material-ui/core";
import {ServiceRecord} from "../../../typedefs";
import React from "react";
// @ts-ignore
import styles from './ServiceDropdown.css';
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import ItemBadge from "./ItemBadge";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface SelectProps {
    value?: ServiceRecord,
    services: ServiceRecord[],

    onChange(event: any, value: ServiceRecord): any
}

export default function ServiceDropdown(props: SelectProps) {
    return (
        <Autocomplete
            renderInput={(params) =>
                <>
                    <TextField {...params} label={__('Service', 'thebooking')} variant="outlined"/>
                </>
            }
            classes={{
                // Ensures compatibility with TwentyTwentyOne theme
                popupIndicator: 'has-background has-text-color',
                clearIndicator: 'has-background has-text-color'
            }}
            disableClearable
            openOnFocus
            noOptionsText={__('No services', 'thebooking')}
            options={props.services}
            value={props.value}
            onChange={props.onChange}
            getOptionLabel={(service: ServiceRecord) => service.name}
            renderOption={(service: ServiceRecord) => {
                return (
                    <Grid container alignItems="center">
                        <Grid item>
                            <Avatar
                                style={{background: service.image ? null : service.color}}
                                src={service.image ? service.image[0] : null}
                                alt={service.name}
                            >
                                {service.name.charAt(0)}
                            </Avatar>
                        </Grid>
                        <Grid item>
                            <Container>
                                <Typography variant={'body2'} component={'div'}>
                                    {service.name}
                                </Typography>
                                <Typography variant={'body2'} color={'textSecondary'} component={'div'}>
                                    {service.description.short}
                                </Typography>
                            </Container>
                        </Grid>
                        <Grid item xs>
                            <Grid container direction={'row-reverse'} alignContent={'flex-end'}>
                                <Grid item style={{width: '80px', lineHeight: 1}}>
                                    <ItemBadge
                                        label={globals.minutesToHM(service.duration / 60)}
                                        icon={<AccessTimeIcon fontSize="small"/>}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )
            }}
        />
    )
}