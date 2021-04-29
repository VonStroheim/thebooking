import globals from '../../../globals';
import {Avatar, Button, Card, CardActions, CardContent, CardHeader, Grid} from "@material-ui/core";
import {ServiceRecord, tbkCommonF} from "../../../typedefs";
import React from "react";
// @ts-ignore
import styles from '../Schedule.css';
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import GMaps from "../GMaps";
import ItemBadge from "./ItemBadge";

declare const wp: any;
declare const TBK: tbkCommonF;
const {__, _x, _n, _nx} = wp.i18n;

interface CardProps {
    service: ServiceRecord,
    showLongDescription?: boolean
    showActions?: boolean,
    showLocation?: boolean,

    onSelect?(): any
}

export default function ServiceCard(props: CardProps) {
    const locations = props.service.meta.locations;
    return (
        <Card variant="outlined">
            <CardHeader
                avatar={
                    <Avatar
                        style={{background: props.service.image ? null : props.service.color}}
                        src={props.service.image ? props.service.image[0] : null}
                        alt={props.service.name}
                    >
                        {props.service.name.charAt(0)}
                    </Avatar>
                }
                title={props.service.name}
                subheader={props.service.description.short}
                action={
                    <Grid container>
                        <Grid item>
                            <ItemBadge
                                icon={<AccessTimeIcon fontSize="small"/>}
                                label={globals.minutesToDhms(props.service.duration / 60)}
                            />
                            {props.service.meta.hasPrice && (
                                <ItemBadge
                                    avatar={<span dangerouslySetInnerHTML={{__html: globals.sanitizer(TBK.currencySymbol)}}/>}
                                    label={props.service.meta.price}
                                />
                            )}
                        </Grid>
                    </Grid>
                }
            >
            </CardHeader>
            {props.showLongDescription && props.service.description.long && (
                <CardContent>
                    {<div dangerouslySetInnerHTML={{__html: globals.sanitizer(props.service.description.long as string)}}/>}
                </CardContent>
            )}
            {props.showLocation && locations && locations.length === 1 && (
                <CardContent>
                    <GMaps address={TBK.locations[locations[0]].address}/>
                </CardContent>
            )}
            {props.showActions && (
                <CardActions>
                    <Button className={styles.alignRight} size="small" color="primary" onClick={props.onSelect}>
                        {__('Select', 'thebooking')}
                    </Button>
                </CardActions>
            )}
        </Card>
    )
}