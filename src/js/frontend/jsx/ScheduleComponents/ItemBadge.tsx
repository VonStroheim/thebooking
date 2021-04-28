import globals from '../../../globals';
import {Avatar, Grid} from "@material-ui/core";
import React from "react";
import {tbkCommonF} from "../../../typedefs";

declare const wp: any;
declare const TBK: tbkCommonF;
const {__, _x, _n, _nx} = wp.i18n;

interface BadgeProps {
    icon?: React.ReactElement,
    avatar?: React.ReactElement,
    label: React.ReactElement | string
}

export default function ItemBadge(props: BadgeProps) {
    return (
        <Grid container alignItems={'center'} style={{lineHeight: 1, margin: 0}}>
            {props.icon && (
                <Grid item>
                    {props.icon}
                </Grid>
            )}
            {props.avatar && (
                <Grid item>
                    <Avatar style={{
                        width      : '18px',
                        height     : '18px',
                        fontSize   : '12px',
                        marginLeft : '1px',
                        marginRight: '1px',
                        color      : TBK.UI.theme.palette.getContrastText(TBK.UI.theme.palette.secondary.main),
                        background : TBK.UI.theme.palette.secondary.main,
                    }}>
                        {props.avatar}
                    </Avatar>
                </Grid>
            )}
            <Grid item style={{fontSize: '90%'}}>
                {props.label}
            </Grid>
        </Grid>
    )
}