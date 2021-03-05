// @ts-ignore
import styles from './Schedule.css';
import ScheduleItem from './ScheduleItem';
import React from 'react';
import {ServiceRecord, StateAction, tbkCommonF, TimeSlot} from "../../typedefs";
import {
    Stepper,
    Step,
    StepContent,
    StepButton,
    Button,
    Grid,
    Collapse
} from '@material-ui/core';
import globals from "../../globals";
import {toDate} from "date-fns-tz";
import Api from "../../Api";
import Form from "./Form";
import TimeslotDropdown from "./ScheduleComponents/TimeslotDropdown";
import ServiceCard from "./ScheduleComponents/ServiceCard";
import LocationCard from "./ScheduleComponents/LocationCard";
import ServiceDropdown from "./ScheduleComponents/ServiceDropdown";
import LocationDropdown from "./ScheduleComponents/LocationDropdown";
import GMaps from "./GMaps";
import {ArrowForward} from "@material-ui/icons";

declare const TBK: tbkCommonF;
declare const _: any;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

export interface ScheduleProps {
    day: Date,
    items: TimeSlot[],
    showHeader?: boolean,
    group: boolean,
    services: {
        [key: string]: ServiceRecord
    },

    onFormSubmit(data: any): any,

    onLoading?(): void,

    onStopLoading?(): void,

    onError?(data: any): void,

    onItemBookingIntent(item: TimeSlot): any
}

interface ScheduleState {
    activeStep: number,
    serviceStepModel: 'cards' | 'dropdown',
    locationStepModel: 'cards' | 'dropdown',
    selectedService: string,
    selectedLocation: string,
    selectedTimeSlot: TimeSlot,
    stepsDynamicContent: {
        [key: string]: any
    }
}

const stepReducer = (state: ScheduleState, action: StateAction) => {
    switch (action.type) {
        case 'NEXT_STEP':
            return {...state, activeStep: state.activeStep + 1}
        case 'PREV_STEP':
            return {...state, activeStep: state.activeStep - 1}
        case 'GOTO_STEP':
            return {...state, activeStep: action.payload}
        case 'RESET':
            return {
                ...state,
                activeStep         : 0,
                selectedService    : null,
                selectedLocation   : null,
                selectedTimeSlot   : null,
                stepsDynamicContent: {}
            }
        case 'RESET_AFTER':
            const reset: any = {}
            action.payload.steps.map((step: any, index: number) => {
                if (index >= action.payload.index) {
                    // Fallthorugh intended
                    switch (step) {
                        case 'service':
                            reset.selectedService = null;
                        case 'location':
                            reset.selectedLocation = null;
                        case 'timeslot':
                            reset.selectedTimeSlot = null;
                            break;
                    }
                }
            })
            return {
                ...state,
                ...reset
            }
        default:
            return state;
    }
}

const dynamicContentReducer = (state: ScheduleState, action: StateAction) => {
    switch (action.type) {
        case 'FORM_CONTENT' :
            return {
                ...state,
                stepsDynamicContent: {
                    ...state.stepsDynamicContent,
                    ...{
                        'form': action.payload
                    }
                }
            }
    }
}

const selectionReducer = (state: ScheduleState, action: StateAction) => {
    switch (action.type) {
        case 'SELECT_SERVICE':
            return {...state, selectedService: action.payload}
        case 'SELECT_LOCATION':
            return {...state, selectedLocation: action.payload}
        case 'SELECT_TIMESLOT':
            return {...state, selectedTimeSlot: action.payload}
    }
}

const redux = globals.combineReducers({
    stepReducer,
    selectionReducer,
    dynamicContentReducer
});

export default class Schedule extends React.Component<ScheduleProps, ScheduleState> {

    constructor(props: ScheduleProps) {

        super(props);

        this.state = this.getDefaultState();
    }

    getDefaultState = (): ScheduleState => {
        const availableServices = this.getAvailableServicesKeys();
        return {
            activeStep         : 0,
            selectedService    : availableServices.length === 1 ? availableServices[0] : null,
            selectedLocation   : null,
            selectedTimeSlot   : null,
            stepsDynamicContent: {},
            serviceStepModel   : 'dropdown',
            locationStepModel  : 'dropdown',
        }
    }

    shouldComponentUpdate(nextProps: ScheduleProps, nextState: ScheduleState) {
        if (!_.isEqual(this.props.services, nextProps.services)
            || this.props.day !== nextProps.day
            || !_.isEqual(this.props.items, nextProps.items)) {
            return true;
        }
        return !_.isEqual(this.state, nextState);

    }

    componentDidUpdate(prevProps: ScheduleProps, prevState: ScheduleState) {
        if (!_.isEqual(this.props.services, prevProps.services)
            || this.props.day !== prevProps.day
            || !_.isEqual(this.props.items, prevProps.items)) {
            this.setState(this.getDefaultState());
        }
    }

    groupItems = () => {
        return _(this.props.items).groupBy((currentItem: TimeSlot) => {
            return [currentItem.serviceId];
        });
    }

    getAvailableServicesKeys = () => {
        return Object.keys(this.groupItems());
    }

    getAvailableServices = (): ServiceRecord[] => {
        return Object.values(_.pick(this.props.services, this.getAvailableServicesKeys()));
    }

    mapItems = (items: TimeSlot[]) => {
        if (this.props.group) {

            const groupedByCriteria: { [key: string]: TimeSlot[] } = _(items).groupBy((currentItem: TimeSlot) => {
                return [currentItem.serviceId].join('#'); // TODO: extend
            });

            const groupedItems: TimeSlot[] = [];

            // It makes sense to set the first item as main, and offer the others as variants
            for (const [hash, itemsGroup] of Object.entries(groupedByCriteria)) {
                const main = itemsGroup.shift();

                if (itemsGroup.length > 0) {
                    main.variants = [];

                    /**
                     * Extend loop
                     */
                    // function extendLoop(current: TimeSlot, followingItems: TimeSlot[]) {
                    //     let extendableUpTo = false;
                    //     if (!current.soldOut && current.openEnd) {
                    //         for (const [i, item] of followingItems.entries()) {
                    //             if (item.id === current.id) continue;
                    //             if (item.soldOut) {
                    //                 return extendableUpTo;
                    //             }
                    //
                    //             if (item.start === current.end) {
                    //                 extendableUpTo = intervalToDuration({
                    //                     start: toDate(current.start),
                    //                     end  : toDate(item.end)
                    //                 });
                    //             }
                    //         }
                    //     }
                    //     return extendableUpTo;
                    // }
                    //
                    // main.extendableUpTo = extendLoop(main, itemsGroup);

                    itemsGroup.forEach((variant, i) => {
                        main.variants.push({
                            start  : variant.start,
                            end    : variant.end,
                            id     : variant.id,
                            soldOut: variant.soldOut,
                            //extendableUpTo: extendLoop(variant, itemsGroup.slice(i))
                        });
                    })
                }
                groupedItems.push(main);
            }

            return groupedItems.map((item) => {
                return (
                    <ScheduleItem
                        key={item.id}
                        onBookingIntent={this.props.onItemBookingIntent}
                        item={item}
                        services={this.props.services}
                    />
                );
            })
        } else {
            return items
                .map(item => {
                    return (
                        <ScheduleItem key={item.id} item={item} services={this.props.services}/>
                    );
                })
        }
    }

    /**
     * Ideal order of all the steps:
     *
     * Service > Login > Location > Timeslot > Form
     *
     */
    getSteps = () => {

        let basicSteps = ['service', 'timeslot', 'form'];

        const servicesNumber = this.getAvailableServicesKeys().length;

        if (servicesNumber === 1) {
            basicSteps = ['timeslot', 'form'];
        }

        if (this.state.selectedService) {

            if (this.props.services[this.state.selectedService].registeredOnly && TBK.currentUser === 0) {
                if (servicesNumber === 1) {
                    return ['login'];
                }
                return ['service', 'login'];
            }

            const locations = this.props.services[this.state.selectedService].meta.locations;
            if (locations && locations.length > 1) {
                basicSteps.splice(1, 0, 'location');
            }
        }

        return basicSteps;
    }

    stepsMapper = (): any => {
        const activeStep = this.getSteps()[this.state.activeStep];
        return {
            service : this.state.selectedService && activeStep !== 'service'
                ? this.props.services[this.state.selectedService].name
                : __('Select a service', 'thebooking'),
            login   : __('Log-in', 'thebooking'),
            location: this.state.selectedLocation && activeStep !== 'location'
                ? TBK.locations[this.state.selectedLocation].address
                : __('Choose a location', 'thebooking'),
            timeslot: this.state.selectedTimeSlot && activeStep !== 'timeslot'
                ? globals.formatTime(toDate(this.state.selectedTimeSlot.start))
                : __('Pick a time slot', 'thebooking'),
            form    : __('Your information', 'thebooking')
        }
    }

    _stepNextButton = (active: boolean) => {
        return (
            <Button
                variant="outlined"
                disabled={!active}
                endIcon={<ArrowForward/>}
                onClick={() => {
                    const actions: StateAction[] = [
                        {type: 'GOTO_STEP', payload: this.state.activeStep + 1},
                    ];
                    this.setState(redux(actions))
                }}
            >
                {__('Next', 'thebooking')}
            </Button>
        )
    }

    getStepsContent = (step: string) => {
        switch (step) {
            case 'service':
                if (this.state.serviceStepModel === 'dropdown') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <ServiceDropdown
                                    services={this.getAvailableServices()}
                                    onChange={
                                        (event, service) => {
                                            const actions: StateAction[] = [
                                                {type: 'SELECT_SERVICE', payload: service.uid},
                                            ];
                                            const locations = service.meta.locations;
                                            actions.push({
                                                type: 'SELECT_LOCATION', payload: locations && locations.length === 1 ? locations[0] : null
                                            })
                                            this.setState(redux(actions))
                                        }
                                    }/>
                            </Grid>
                            {this.state.selectedService && (
                                <Grid item xs={12}>
                                    <Collapse mountOnEnter unmountOnExit in={!!this.state.selectedService}>
                                        <ServiceCard
                                            service={this.props.services[this.state.selectedService]}
                                            showActions={false}
                                            showLongDescription={true}
                                            showLocation={true}
                                        />
                                    </Collapse>
                                </Grid>
                            )}
                            <Grid item className={styles.alignRight}>
                                {this._stepNextButton(!!this.state.selectedService)}
                            </Grid>
                        </Grid>
                    )
                }
                return (
                    <Grid container spacing={3}>
                        {this.getAvailableServicesKeys().map(serviceId => {
                            return (
                                <Grid item xs={12} md={6} key={serviceId}>
                                    <ServiceCard
                                        service={this.props.services[serviceId]}
                                        onSelect={() => {
                                            const actions: StateAction[] = [
                                                {type: 'GOTO_STEP', payload: this.state.activeStep + 1},
                                                {type: 'SELECT_SERVICE', payload: serviceId},
                                            ];
                                            const locations = this.props.services[serviceId].meta.locations;
                                            if (locations && locations.length === 1) {
                                                actions.push({
                                                    type: 'SELECT_LOCATION', payload: locations[0]
                                                })
                                            }
                                            this.setState(redux(actions))
                                        }}
                                    />
                                </Grid>
                            )

                        })}
                    </Grid>
                );
            case 'login':
                return (
                    <div>
                        {__('You must be registered to book this service.')}
                        <div className={styles.loginButtonsContainer}>
                            {this.getLoginButtons()}
                        </div>
                    </div>
                )
            case 'timeslot':

                if (!this.state.selectedService) {
                    return;
                }

                const items = this.groupItems()[this.state.selectedService];

                return (
                    <Grid container spacing={3}>
                        {this.getAvailableServicesKeys().length === 1 && (
                            <Grid item xs={12}>
                                <Collapse mountOnEnter unmountOnExit in={!!this.state.selectedService}>
                                    <ServiceCard
                                        service={this.props.services[this.state.selectedService]}
                                        showActions={false}
                                        showLongDescription={true}
                                        showLocation={true}
                                    />
                                </Collapse>
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <TimeslotDropdown
                                value={this.state.selectedTimeSlot}
                                items={items}
                                onChange={(event, newValue: TimeSlot) => {
                                    if (newValue) {
                                        this.onTimeslotSelection(newValue)
                                    }
                                }}/>
                        </Grid>
                    </Grid>
                )
            case 'location':
                const locations = this.props.services[this.state.selectedService].meta.locations;
                if (this.state.serviceStepModel === 'dropdown') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <LocationDropdown
                                    locations={Object.values(_.pick(TBK.locations, locations))}
                                    onChange={
                                        (event, location) => {
                                            const actions: StateAction[] = [
                                                {type: 'SELECT_LOCATION', payload: location.uid},
                                            ];
                                            this.setState(redux(actions))
                                        }
                                    }/>
                            </Grid>
                            {this.state.selectedLocation && (
                                <Grid item xs={12}>
                                    <Collapse mountOnEnter unmountOnExit in={!!this.state.selectedLocation}>
                                        <GMaps address={TBK.locations[this.state.selectedLocation].address}/>
                                    </Collapse>
                                </Grid>
                            )}
                            <Grid item className={styles.alignRight}>
                                {this._stepNextButton(!!this.state.selectedLocation)}
                            </Grid>
                        </Grid>
                    )
                }
                return (
                    <Grid container spacing={3}>
                        {locations.map((location: string) => {
                            return (
                                <Grid item xs={12} md={6} key={location}>
                                    <LocationCard
                                        location={TBK.locations[location]}
                                        onSelect={() => {
                                            this.setState(redux([
                                                {type: 'GOTO_STEP', payload: this.state.activeStep + 1},
                                                {type: 'SELECT_LOCATION', payload: location},
                                            ]))
                                        }}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                );
            case 'form':
                let location;
                if (this.state.selectedLocation
                    && this.state.selectedService
                    && this.props.services[this.state.selectedService].meta.locations) {
                    location = TBK.locations[this.state.selectedLocation].address;
                }
                return (
                    <Form
                        fields={this.state.stepsDynamicContent.form}
                        onSubmit={this.props.onFormSubmit}
                    />
                )
            default:
                return '';
        }
    }

    getLoginButtons = () => {
        return (
            <>
                <Button
                    size={'small'}
                    aria-label={__('Log-in', 'thebooking')}
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('redirect_to', TBK.loginUrl);
                        window.location.href = url.toString();
                    }}
                >
                    {__('Log-in', 'thebooking')}
                </Button>
                <Button
                    disableElevation
                    aria-label={__('Register to book', 'thebooking')}
                    color={'primary'}
                    variant={'contained'}
                    size={'small'}
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('redirect_to', TBK.registrationUrl);
                        window.location.href = url.toString();
                    }}
                >
                    {__('Register to book', 'thebooking')}
                </Button>
            </>
        );
    }

    onTimeslotSelection = (item: TimeSlot) => {
        this.props.onItemBookingIntent(item)
        Api.get('/frontend/get/service/' + item.serviceId + '/form', {
            params: {
                tbk_nonce: TBK.nonce
            }
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
                    update: {},
                    data  : {
                        type   : 'fail',
                        tagline: __('There was an error.', 'thebooking'),
                        message: error.response.data.error || error.response.data.message
                    },
                    status: 'KO'
                }
            })
            .then((res) => {
                console.log(res);
                if (Array.isArray(res.data)) {
                    res.data = {}
                }
                if (res.status === 'KO') {
                    this.props.onError(res.data);
                } else {
                    this.setState(redux([
                        {type: 'FORM_CONTENT', payload: res.data},
                        {type: 'GOTO_STEP', payload: this.state.activeStep + 1},
                        {type: 'SELECT_TIMESLOT', payload: item}
                    ]), () => {
                        item.location = this.state.selectedLocation;
                        this.props.onStopLoading()
                    })
                }
            });
    }

    renderSteps = () => {
        return (
            <div className={styles.container}>
                <Stepper activeStep={this.state.activeStep} className={'tbkTransparentBg'} orientation="vertical">
                    {this.getSteps().map((id, index) => (
                        <Step key={id}>
                            <StepButton
                                disableRipple={true}
                                className={'noHover'}
                                onClick={() => {
                                    if (this.state.activeStep > index) {
                                        this.setState(redux([
                                            {type: 'GOTO_STEP', payload: index},
                                            {
                                                type: 'RESET_AFTER', payload: {
                                                    index: index,
                                                    steps: this.getSteps()
                                                }
                                            }
                                        ]))
                                    }
                                }}>
                                {this.stepsMapper()[id]}
                            </StepButton>
                            <StepContent>
                                {this.getStepsContent(id)}
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
            </div>
        )
    }

    renderTimeSlots = () => {
        const dayNumber = this.props.day.getDate();
        const longMonth = TBK.monthLabels[this.props.day.getMonth()];
        const weekDay = TBK.weekDaysLabels[this.props.day.getDay()];
        const year = this.props.day.getFullYear();
        return (
            <div className={styles.schedule}>
                {this.props.showHeader && (
                    <div className={styles.header}>
                        <div className={styles.dayNumber}>
                            {dayNumber}
                        </div>
                        <div className={styles.date}>
                            {weekDay}<span className={styles.secondaryDatePart}>, {longMonth} {year}</span>
                        </div>
                    </div>
                )}
                {this.mapItems(this.props.items)}
            </div>
        );
    }

    render() {

        if (this.props.items.length < 1) {
            return '';
        }

        return this.renderSteps();
    }

}