import globals from "../../globals";
import {ReservationRecord, ServiceRecord, tbkCommonF} from "../../typedefs";
import React from "react";
import {toDate} from "date-fns-tz";
import {
    AccessTime as AccessTimeIcon,
    Block as BlockIcon,
    Clear as ClearIcon,
    Done as DoneIcon,
    KeyboardArrowDown,
    KeyboardArrowUp,
    Update as UpdateIcon,
    LocationOn as LocationOnIcon,
    Videocam as VideocamIcon,
    Directions as DirectionsIcon
} from "@material-ui/icons";
import {
    Avatar,
    Card,
    Box,
    CardContent,
    CardHeader,
    Chip,
    Collapse,
    Grid,
    IconButton,
    TableCell,
    TableRow,
    Typography,
    CardActions,
    Button,
    CircularProgress,
    Backdrop
} from "@material-ui/core";
// @ts-ignore
import styles from "./App.css";
import {differenceInMinutes} from "date-fns";
import Api from "../../Api";

declare const TBK: tbkCommonF;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface RProps {
    reservation: ReservationRecord,
    services: {
        [key: string]: ServiceRecord
    }
}

interface RState {
    expanded: boolean,
    isBusy: boolean
}

export default class ReservationTableRecord extends React.Component<RProps, RState> {
    constructor(props: RProps) {
        super(props);

        this.state = {
            expanded: false,
            isBusy  : false
        }
    }

    render() {
        const dateStart = toDate(this.props.reservation.start);
        const dateEnd = toDate(this.props.reservation.end);
        const service = this.props.services[this.props.reservation.serviceId];
        if (typeof service === 'undefined') {
            // The service is not active or it was removed
            return '';
        }
        let statusIcon;
        switch (this.props.reservation.status) {
            case 'cancelled':
                statusIcon = <ClearIcon style={{color: TBK.UI.theme.palette.error.main}}/>;
                break;
            case 'confirmed':
                statusIcon = <DoneIcon style={{color: TBK.UI.theme.palette.success.main}}/>;
                break;
            case 'pending':
                statusIcon = <UpdateIcon style={{color: TBK.UI.theme.palette.warning.main}}/>;
                break;
            case 'declined':
                statusIcon = <BlockIcon style={{color: TBK.UI.theme.palette.text.secondary}}/>;
                break;
            default:
                statusIcon = <DoneIcon style={{color: TBK.UI.theme.palette.success.main}}/>;
                break;
        }
        return (
            <>
                <TableRow hover>
                    <TableCell>
                        <CardHeader
                            avatar={
                                <Avatar
                                    style={{background: service.image ? null : service.color}}
                                    src={service.image ? service.image[0] : null}
                                    alt={service.name}
                                >
                                    {service.name.charAt(0)}
                                </Avatar>
                            }
                            title={service.name}
                            subheader={service.description.short}
                        />
                    </TableCell>
                    <TableCell>
                        <span className={styles.dateTimeCell}>
                            {globals.formatDate(dateStart)}
                            <span>
                                {globals.formatTime(dateStart)}
                            </span>
                        </span>
                    </TableCell>
                    <TableCell>
                        <Chip variant='outlined' size='small'
                              icon={<AccessTimeIcon/>}
                              label={globals.minutesToDhms(differenceInMinutes(dateEnd, dateStart))}
                        />
                    </TableCell>
                    <TableCell>
                        <Chip variant='outlined' size='small' icon={statusIcon} label={TBK.statuses[this.props.reservation.status]}/>
                    </TableCell>
                    <TableCell>
                        <IconButton aria-label="expand row" size="small" onClick={() => this.setState({expanded: !this.state.expanded})}>
                            {this.state.expanded ? <KeyboardArrowUp/> : <KeyboardArrowDown/>}
                        </IconButton>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={5}>
                        <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Card style={{position: 'relative'}}>
                                            <CardContent>
                                                <Typography component={'span'} variant={'h6'}>
                                                    {globals.formatDate(dateStart, {weekday: 'long', month: 'long', day: 'numeric'})}
                                                </Typography>
                                                <Typography color={'textSecondary'} style={{display: "flex"}}>
                                                    {globals.formatTime(dateStart)} - {globals.formatTime(dateEnd)}
                                                </Typography>
                                                {this.props.reservation.meta.location && (
                                                    <Typography color={'textSecondary'} style={{display: "flex"}}>
                                                        {TBK.locations[this.props.reservation.meta.location].address}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                            <CardActions>
                                                {this.props.reservation.meta.zoomMeetingId && (
                                                    <Button
                                                        onClick={() => {
                                                            if (this.state.isBusy) return;
                                                            this.setState({isBusy: true})
                                                            Api.get('/reservation/getmeetinglink/', {
                                                                params: {
                                                                    userHash     : TBK.currentUserHash,
                                                                    reservationId: this.props.reservation.uid
                                                                }
                                                            }).then((res: any) => {
                                                                if (res.data.link) {
                                                                    window.open(res.data.link);
                                                                }
                                                                this.setState({isBusy: false})
                                                            });
                                                        }}
                                                        startIcon={<VideocamIcon/>}
                                                    >{__('Access to the meeting', 'thebooking')}
                                                    </Button>
                                                )}
                                                {this.props.reservation.meta.location && (
                                                    <Button onClick={() => {
                                                        window.open('https://www.google.com/maps/dir/?api=1&destination='
                                                            + TBK.locations[this.props.reservation.meta.location].address
                                                            + '&travelmode=driving'
                                                        );
                                                    }}
                                                            startIcon={<DirectionsIcon/>}
                                                    >
                                                        {__('Get directions', 'thebooking')}
                                                    </Button>
                                                )}
                                            </CardActions>
                                            <Backdrop open={this.state.isBusy}>
                                                <CircularProgress color="inherit"/>
                                            </Backdrop>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </>
        )
    }
}