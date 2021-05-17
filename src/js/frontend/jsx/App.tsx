// @ts-ignore
import styles from './App.css';
import React from 'react';
import globals from '../../globals';
import Scheduler from '../../scheduler';
import Calendar from './Calendar';
import Nav from './Nav';
import Schedule from './Schedule';
// @ts-ignore
import Form from './Form';
import Api from '../../Api';
import {create} from 'jss';
import {
    startOfMonth,
    endOfMonth,
    compareDesc as compareDescDate, isPast, formatRFC3339
} from 'date-fns';
import {toDate} from 'date-fns-tz';
import {createMuiTheme, ThemeProvider, StylesProvider, createGenerateClassName, jssPreset} from '@material-ui/core/styles';
import {
    IconButton,
    Typography,
    Backdrop,
    Button,
    CircularProgress,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Theme,
    Slide,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableContainer,
    TableRow,
    Chip,
    Switch,
    FormControlLabel, CardHeader, Avatar
} from '@material-ui/core';
import {
    ChevronRight,
    ChevronLeft,
    DoneAll,
    Done as DoneIcon,
    Update as UpdateIcon,
    Clear as ClearIcon,
    Error as ErrorIcon,
    Undo,
    Block as BlockIcon
} from '@material-ui/icons';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';
import {AvailabilityRecord, availableViews, FrontendMiddleware, MiddlewareAction, ReservationRecord, ServiceRecord, StateAction, tbkCommonF, TimeSlot} from "../../typedefs";

declare const TBK: tbkCommonF;
declare const _: any;
declare const wp: any;

const theme: Theme = createMuiTheme(TBK.UI.theme);
TBK.UI.theme = theme;

const {__, _x, _n, _nx} = wp.i18n;

const generateClassName = createGenerateClassName({
    productionPrefix: 'tbk',
    disableGlobal   : false
});

interface IState {
    day: number,
    month: number,
    year: number,
    viewMode: availableViews,
    viewData: {
        [key: string]: any
    },
    isBusy: boolean,
    sliderDirection: "up" | "down" | "left" | "right",
    internalDomId: string,
    selectedDay: Date | null,
    selectedItem: TimeSlot | null,
    reservations: ReservationRecord[],
    services: {
        [key: string]: ServiceRecord
    },
    availability: AvailabilityRecord[]
}

export interface IProps {
    day: number,
    month: number,
    year: number,
    viewMode: availableViews,
    reservations: ReservationRecord[],
    services: {
        [key: string]: ServiceRecord
    },
    availability: AvailabilityRecord[],
    monthlyViewShowAllDots: boolean,
    monthlyViewAverageDots: number,
    middleware: FrontendMiddleware,
    busyIntervals?: { start: string, end: string }[],
    groupSlots: boolean,
    doc: any,
    instanceId: string
}

const dateReducer = (state: IState, action: StateAction) => {
    let date;
    switch (action.type) {
        case 'NEXT_MONTH':
            const nextMonth = state.month === 12 ? 1 : state.month + 1;
            const nextYear = nextMonth === 1 ? state.year + 1 : state.year;
            return {...state, month: nextMonth, year: nextYear, day: 1, selectedDay: null};
        case 'PREV_MONTH':
            const prevMonth = state.month === 1 ? 12 : state.month - 1;
            const prevYear = prevMonth === 12 ? state.year - 1 : state.year;
            return {...state, month: prevMonth, year: prevYear, day: 1, selectedDay: null};
        case 'NEXT_YEAR':
            return {...state, year: state.year + 1, day: 1, selectedDay: null};
        case 'PREV_YEAR':
            return {...state, year: state.year - 1, day: 1, selectedDay: null};
        case 'NEXT_DAY':
            date = new Date(state.year, state.month, state.day);
            date.setDate(date.getDate() + 1);
            return {...state, day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear()};
        case 'PREV_DAY':
            date = new Date(state.year, state.month, state.day);
            date.setDate(date.getDate() - 1);
            return {...state, day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear()};
        default:
            return state;
    }
}
const viewReducer = (state: IState, action: StateAction) => {
    switch (action.type) {
        case 'CHANGE_VIEW':
            return {...state, ...action.payload}
        default:
            return state
    }
}

export function busyReducer(state: IState, action: StateAction): any {
    switch (action.type) {
        case 'BUSY':
            return {...state, isBusy: true}
        case 'NOT_BUSY':
            return {...state, isBusy: false}
        default:
            return state
    }
}

const dataReducer = (state: IState, action: StateAction) => {
    switch (action.type) {
        case 'UPDATE_RESERVATIONS':
            return {...state, reservations: action.payload}
        case 'SET_DAY':
            return {...state, selectedDay: action.payload}
        case 'SLIDER_DIRECTION':
            return {...state, sliderDirection: action.payload}
        default:
            return state;
    }
}
const redux = globals.combineReducers({
    viewReducer,
    dateReducer,
    busyReducer,
    dataReducer
});

export default class App extends React.Component<IProps, IState> {

    private cache: any;

    private readonly jss: any;

    constructor(props: IProps) {

        super(props);

        const today: Date = new Date();

        const internalID = globals.uuidDOM();

        let noscript;
        if (!props.doc.getElementById('tbk-mui-styles')) {
            noscript = props.doc.createElement('noscript');
            noscript.id = 'tbk-mui-styles'
            props.doc.head.insertBefore(noscript, props.doc.head.lastChild.nextSibling);
        } else {
            noscript = props.doc.getElementById('tbk-mui-styles');
        }

        this.jss = create({
            ...jssPreset(),
            insertionPoint: noscript,
        });

        this.cache = {};

        const viewData = {};

        const reservations = props.reservations || [];
        reservations.sort((a, b) => {
            if (!a.start) return 0;
            return compareDescDate(toDate(a.start), toDate(b.start));
        })

        this.state = {
            day  : props.day || today.getDate(), //j
            month: props.month || today.getMonth() + 1, //n
            year : props.year || today.getFullYear(), //Y

            viewMode       : props.viewMode || 'monthlyCalendar',
            viewData       : viewData,
            isBusy         : false,
            sliderDirection: 'left',

            selectedDay  : null,
            selectedItem : null,
            reservations : reservations,
            services     : props.services || {},
            availability : props.availability || [],
            internalDomId: internalID
        }
    }

    componentDidMount() {
        if (TBK.loadAtClosestSlot && this.state.viewMode === 'monthlyCalendar') {
            const scheduler = new Scheduler({
                availability : this.state.availability,
                services     : this.state.services,
                reservations : this.state.reservations,
                busyIntervals: this.props.busyIntervals
            });
            const firstUpcomingItem = scheduler.getFirstUpcomingItem();

            if (typeof firstUpcomingItem !== 'undefined') {
                const thisDate = toDate(firstUpcomingItem.start);

                this.setState({
                    day  : thisDate.getDate(),
                    month: thisDate.getMonth() + 1,
                    year : thisDate.getFullYear()
                }, () => {
                    if (this.props.middleware.changeMonth.length > 0) {
                        const requests = this.props.middleware.changeMonth;
                        this.changeMonthMiddlewareCall(requests, thisDate, '');
                    }
                })
            }
        }
    }

    shouldComponentUpdate(nextProps: IProps, nextState: IState) {
        if (this.props !== nextProps) {
            this.cache = {}
        }
        return true;
    }

    scrollIntoView: Function = () => {
        const domRect = document.getElementById(this.state.internalDomId).getBoundingClientRect();
        if (domRect.top < 50 || domRect.top > window.innerHeight / 2) {
            window.scrollBy({
                top     : domRect.top - 50,
                behavior: 'smooth'
            });
        }
    }

    getDayItems = (date: Date): TimeSlot[] => {
        const monthStart = startOfMonth(date);

        if (_.isEmpty(this.cache)) {
            this.getMonthItems(date);
        }

        const items = this.cache[monthStart.toISOString()].filter((item: TimeSlot) => {
            return toDate(item.start).getDate() === date.getDate();
        })

        return items;
    }

    getMonthItems = (date: Date): TimeSlot[] => {

        const monthStart = startOfMonth(date);
        if (monthStart.toISOString() in this.cache) {

            return this.cache[monthStart.toISOString()];
        }

        const scheduler = new Scheduler({
            availability : this.state.availability,
            services     : this.props.services,
            reservations : this.state.reservations,
            busyIntervals: this.props.busyIntervals
        });

        const items = scheduler.getItemsBetween(startOfMonth(date), endOfMonth(date))

        this.cache[monthStart.toISOString()] = items;

        return items;
    }

    getBackButton = (viewMode: availableViews) => {
        return <IconButton
            component={'div'}
            onClick={() => this.setState(redux(
                [
                    {
                        type   : 'CHANGE_VIEW',
                        payload: {viewMode: viewMode}
                    },
                    {
                        type   : 'SET_DAY',
                        payload: null
                    },
                    {
                        type   : 'SLIDER_DIRECTION',
                        payload: 'right'
                    }
                ]
            ), () => {
                this.setState(redux([
                    {
                        type   : 'SLIDER_DIRECTION',
                        payload: 'left'
                    }
                ]))
            })}
        >
            <Undo/>
        </IconButton>
    }

    changeMonthMiddlewareCall = (requests: MiddlewareAction[], targetDate: Date, endAction: string) => {
        this.setState(redux([{type: 'BUSY'}]), () => {
            let index = 0;
            const request: any = () => {
                if (requests[index].type === 'async') {
                    return Api.post(requests[index].endpoint, {targetDate: formatRFC3339(startOfMonth(targetDate))}).then((res) => {

                        // Syncing the global object
                        TBK.UI.instances[this.props.instanceId] = {...TBK.UI.instances[this.props.instanceId], ...res.data}

                        index++;
                        if (index >= requests.length) {
                            this.setState(redux([
                                {type: endAction},
                                {type: 'NOT_BUSY'}
                            ], this.state))
                            return true;
                        }
                        return request();
                    })
                }
            }

            request();
        })
    }

    getNavComponents = () => {
        switch (this.state.viewMode) {
            case 'monthlyCalendar':
                return (
                    <>
                        <IconButton
                            component={'div'}
                            onClick={() => {
                                if (this.props.middleware.changeMonth.length > 0) {
                                    const requests = this.props.middleware.changeMonth;
                                    const prevMonth = this.state.month === 1 ? 12 : this.state.month - 1;
                                    const prevYear = prevMonth === 12 ? this.state.year - 1 : this.state.year;
                                    const targetDate = new Date(prevYear, prevMonth - 1, 1);

                                    this.changeMonthMiddlewareCall(requests, targetDate, 'PREV_MONTH');
                                } else {
                                    this.setState(dateReducer(this.state, {type: 'PREV_MONTH'}))
                                }
                            }}>
                            <ChevronLeft/>
                        </IconButton>
                        <Typography component={'span'} variant={'h6'}>
                            {this.state.selectedDay && (
                                <span className={styles.strongText}>
                                {this.state.selectedDay.getDate()}
                                </span>
                            )}
                            {TBK.monthLabels[this.state.month - 1]}
                            <span className={styles.secondaryText}>
                                {this.state.year}
                            </span>
                        </Typography>
                        <IconButton
                            component={'div'}
                            onClick={() => {
                                if (this.props.middleware.changeMonth.length > 0) {
                                    const requests = this.props.middleware.changeMonth;
                                    const nextMonth = this.state.month === 12 ? 1 : this.state.month + 1;
                                    const nextYear = nextMonth === 1 ? this.state.year + 1 : this.state.year;
                                    const targetDate = new Date(nextYear, nextMonth - 1, 1);

                                    this.changeMonthMiddlewareCall(requests, targetDate, 'NEXT_MONTH');
                                } else {
                                    this.setState(dateReducer(this.state, {type: 'NEXT_MONTH'}))
                                }
                            }}>
                            <ChevronRight/>
                        </IconButton>
                    </>
                )
            case 'stepper':
                return (
                    <>
                        {this.getBackButton('monthlyCalendar')}
                        <Typography component={'span'} variant={'h6'}>
                            {this.state.selectedDay && (
                                <span className={styles.strongText}>
                                {this.state.selectedDay.getDate()}
                                </span>
                            )}
                            {TBK.monthLabels[this.state.month - 1]}
                            <span className={styles.secondaryText}>
                                {this.state.year}
                            </span>
                        </Typography>
                        <IconButton disabled component={'div'}>
                        </IconButton>
                    </>
                )
            case 'reservations':
                return (
                    <>
                        {this.getBackButton('monthlyCalendar')}
                        <Typography component={'span'} variant={'h6'}>
                            <span className={styles.strongText}>
                                {__('Your reservations', 'thebooking')}
                            </span>
                        </Typography>
                        <FormControlLabel
                            control={<Switch
                                size="small"
                                checked={!!this.state.viewData.showPast}
                                classes={{
                                    input: styles.absolutePositioned
                                }}
                                onChange={(e: any) => {
                                    this.setState(redux([
                                        {
                                            type   : 'CHANGE_VIEW',
                                            payload: {
                                                viewData: {
                                                    showPast: e.target.checked
                                                }
                                            }
                                        }
                                    ]))
                                }}/>}
                            label={__('Show past', 'thebooking')}
                        />
                    </>
                )
        }
    }

    onFormSubmit = (data: any) => {
        this.setState(redux([{type: 'BUSY'}]));
        Api.post('/frontend/booking/submit/', {
            tbk_nonce       : TBK.nonce,
            bookingData     : data,
            customerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            item            : this.state.selectedItem
        })
            .catch(error => {
                if (error.response) {
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    console.log(error.request);
                } else {
                    console.log('Error', error.message);
                }
                console.log(error.config);
                return {
                    data: {
                        update  : {},
                        response: {
                            type   : 'fail',
                            tagline: __('There was an error.', 'thebooking'),
                            message: error.response.data.error
                        }
                    }
                }
            })
            .then((res: any) => {
                const actions: StateAction[] = [
                    {type: 'NOT_BUSY'},
                    {
                        type   : 'CHANGE_VIEW',
                        payload: {
                            viewMode: 'userMessage',
                            viewData: res.data.response,
                        }
                    }
                ];

                if (res.data.update) {
                    for (const [key, value] of Object.entries(res.data.update)) {
                        switch (key) {
                            case 'reservations':
                                // Syncing the global object
                                TBK.UI.instances[this.props.instanceId].reservations = value as ReservationRecord[];

                                // Invalidating cache
                                this.cache = {};

                                actions.push({
                                    type   : 'UPDATE_RESERVATIONS',
                                    payload: value
                                })
                                break;
                        }
                    }
                }

                this.setState(
                    redux(actions)
                )
                console.log(res.data);
            });
    }

    onItemBookingIntent = (item: TimeSlot) => {
        this.setState({isBusy: true, selectedItem: item});

    }

    getViews = () => {
        switch (this.state.viewMode) {
            case 'monthlyCalendar':
                const thisDate = new Date(this.state.year, this.state.month - 1, this.state.day);
                return (
                    <Calendar
                        key={this.state.day + this.state.month + this.state.year}
                        day={this.state.day}
                        month={this.state.month}
                        ellipsis={!this.props.monthlyViewShowAllDots}
                        limitNumberOfDots={this.props.monthlyViewAverageDots}
                        year={this.state.year}
                        events={this.getMonthItems(thisDate)}
                        services={this.props.services}
                        oneDotPerService={true}
                        viewMode={'monthly'}
                        selectedDay={this.state.selectedDay}
                        onDayClick={(date: Date | null) => {
                            if (this.getDayItems(date).length < 1) {
                                return;
                            }
                            const actions = [
                                {
                                    type   : 'CHANGE_VIEW',
                                    payload: {
                                        viewMode: 'stepper'
                                    }
                                },
                                {
                                    type   : 'SET_DAY',
                                    payload: date
                                }
                            ]
                            this.setState(redux(actions))
                        }}
                    />

                )
            case 'stepper':
                return (
                    <Schedule
                        key={this.state.selectedDay.toISOString()}
                        day={this.state.selectedDay}
                        onError={(data) => {
                            const actions = [
                                {type: 'NOT_BUSY'},
                                {
                                    type   : 'CHANGE_VIEW',
                                    payload: {
                                        viewMode: 'userMessage',
                                        viewData: data,
                                    }
                                }
                            ]
                            this.setState(
                                redux(actions)
                            )
                        }}
                        onItemBookingIntent={this.onItemBookingIntent}
                        onFormSubmit={this.onFormSubmit}
                        onLoading={() => this.setState(redux([{type: 'BUSY'}]))}
                        onStopLoading={() => this.setState(redux([{type: 'NOT_BUSY'}]))}
                        items={this.getDayItems(this.state.selectedDay)}
                        group={this.props.groupSlots}
                        services={this.props.services}
                    />
                )
            case 'reservations':
                const filteredReservations = this.props.reservations.filter(reservation => {
                    if (reservation.customer.hash !== TBK.currentUserHash) {
                        return false;
                    }
                    const date = toDate(reservation.start);
                    if (!this.state.viewData.showPast && isPast(date)) {
                        return false;
                    }
                    return true;
                })
                return (
                    <>
                        {filteredReservations.length > 0 && (
                            <TableContainer>
                                <Table
                                    size={'small'}
                                >
                                    <TableBody>
                                        {filteredReservations.map((reservation) => {
                                            const date = toDate(reservation.start);
                                            const service = this.props.services[reservation.serviceId];
                                            let statusIcon;
                                            switch (reservation.status) {
                                                case 'cancelled':
                                                    statusIcon = <ClearIcon style={{color: theme.palette.error.main}}/>;
                                                    break;
                                                case 'confirmed':
                                                    statusIcon = <DoneIcon style={{color: theme.palette.success.main}}/>;
                                                    break;
                                                case 'pending':
                                                    statusIcon = <UpdateIcon style={{color: theme.palette.warning.main}}/>;
                                                    break;
                                                case 'declined':
                                                    statusIcon = <BlockIcon style={{color: theme.palette.text.secondary}}/>;
                                                    break;
                                                default:
                                                    statusIcon = <DoneIcon style={{color: theme.palette.success.main}}/>;
                                                    break;
                                            }
                                            return (
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
                                                    {globals.formatDate(date)}
                                                    <span>
                                                        {globals.formatTime(date)}
                                                    </span>
                                                </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip variant='outlined' size='small' icon={statusIcon} label={TBK.statuses[reservation.status]}/>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                        {filteredReservations.length < 1 && (
                            <Typography component={'div'} variant={'body2'}>
                                <div style={{padding: '20px 30px'}}>
                                    {__('You have no reservations.', 'thebooking')}
                                </div>
                            </Typography>
                        )}
                    </>
                )
            case 'userMessage':
                const classes = [styles.userMessage];
                let bgColor = theme.palette.success.main;
                switch (this.state.viewData.type) {
                    case 'success':
                        classes.push(styles.userMessageSuccess);
                        break;
                    case 'fail':
                        bgColor = theme.palette.error.main;
                        classes.push(styles.userMessageFail);
                        break;
                }
                return (
                    <Card elevation={0} className={classes.join(' ')}>
                        <CardMedia
                            className={styles.userMessageHeader}
                            style={{
                                background: bgColor,
                                color     : theme.palette.getContrastText(bgColor)
                            }}
                        >
                            {this.state.viewData.type === 'success' && <DoneAll/>}
                            {this.state.viewData.type === 'fail' && <ErrorIcon/>}
                        </CardMedia>
                        <CardContent className={styles.userMessageContent}>
                            <Typography variant={'h5'}>
                                {this.state.viewData.tagline}
                            </Typography>
                            <Typography variant={'body2'}>
                                {this.state.viewData.message}
                            </Typography>
                        </CardContent>
                        <CardActions className={styles.userMessageActions}>
                            <Button
                                href={''}
                                component={'div'}
                                classes={{
                                    root: styles.upperCase
                                }}
                                onClick={() => {
                                    this.setState(redux([
                                        {
                                            type   : 'CHANGE_VIEW',
                                            payload: {
                                                viewMode: 'monthlyCalendar'
                                            }
                                        },
                                        {
                                            type   : 'SET_DAY',
                                            payload: null
                                        },
                                        {
                                            type   : 'SLIDER_DIRECTION',
                                            payload: 'right'
                                        }
                                    ]), () => {
                                        this.setState(redux([
                                            {
                                                type   : 'SLIDER_DIRECTION',
                                                payload: 'left'
                                            }
                                        ]))
                                    })
                                }}>
                                {__('Continue booking', 'thebooking')}
                            </Button>
                        </CardActions>
                    </Card>
                )
        }
    }

    getMainContent = () => {
        return (
            <>
                <Slide mountOnEnter unmountOnExit in={this.state.viewMode === 'monthlyCalendar'} direction={this.state.sliderDirection}>
                    <Typography variant={'body2'} component={'div'}>
                        {this.state.viewMode === 'monthlyCalendar' && this.getViews()}
                    </Typography>
                </Slide>

                <Slide mountOnEnter unmountOnExit in={this.state.viewMode === 'stepper'} direction={this.state.sliderDirection}>
                    <Typography variant={'body2'} component={'div'}>
                        {this.state.viewMode === 'stepper' && this.getViews()}
                    </Typography>
                </Slide>

                <Slide mountOnEnter unmountOnExit in={this.state.viewMode === 'reservations'} direction={this.state.sliderDirection}>
                    <Typography variant={'body2'} component={'div'}>
                        {this.state.viewMode === 'reservations' && this.getViews()}
                    </Typography>
                </Slide>

                <Slide mountOnEnter unmountOnExit in={this.state.viewMode === 'userMessage'} direction={this.state.sliderDirection}>
                    <Typography variant={'body2'} component={'div'}>
                        {this.state.viewMode === 'userMessage' && this.getViews()}
                    </Typography>
                </Slide>
            </>
        )
    }

    render() {

        return (
            <div className={styles.app} id={this.state.internalDomId}>
                <StylesProvider generateClassName={generateClassName} jss={this.jss}>
                    <ThemeProvider theme={theme}>
                        <ScopedCssBaseline>
                            <div>
                                <Nav>
                                    {this.getNavComponents()}
                                </Nav>
                                <div>
                                    {this.getMainContent()}
                                </div>
                            </div>
                            <Backdrop open={this.state.isBusy}>
                                <CircularProgress color="inherit"/>
                            </Backdrop>
                        </ScopedCssBaseline>
                    </ThemeProvider>
                </StylesProvider>
            </div>
        );
    }
}