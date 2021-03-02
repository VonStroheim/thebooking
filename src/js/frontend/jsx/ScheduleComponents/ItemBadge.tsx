import globals from '../../../globals';
import {Grid} from "@material-ui/core";
import React from "react";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface BadgeProps {
    icon?: React.ReactElement,
    label: React.ReactElement | string
}

export default function ItemBadge(props: BadgeProps) {
    return (
        <Grid spacing={1} container alignItems={'center'} style={{lineHeight: 1}}>
            {props.icon}
            <Grid item style={{fontSize: '90%'}}>
                {props.label}
            </Grid>
        </Grid>
    )
}