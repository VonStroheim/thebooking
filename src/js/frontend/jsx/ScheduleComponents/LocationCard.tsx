import globals from '../../../globals';
import {Avatar, Button, Card, CardActions, CardHeader} from "@material-ui/core";
import {Location} from "../../../typedefs";
import React from "react";
// @ts-ignore
import styles from '../Schedule.css';
import RoomIcon from "@material-ui/icons/Room";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface CardProps {
    location: Location,

    onSelect(): any
}

export default function LocationCard(props: CardProps) {
    return (
        <Card variant="outlined">
            <CardHeader
                avatar={
                    <Avatar>
                        <RoomIcon/>
                    </Avatar>
                }
                title={props.location.l_name}
                subheader={props.location.address}
            >
            </CardHeader>
            <CardActions>
                <Button className={styles.alignRight} size="small" color="primary" onClick={props.onSelect}>
                    {__('Select', 'thebooking')}
                </Button>
            </CardActions>
        </Card>
    )
}