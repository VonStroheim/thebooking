// @ts-ignore
import styles from './Calendar.css';
import React from 'react';
import CalendarDayItem from './CalendarDayItem';
import {
    ButtonBase
} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';
import {
    startOfMonth,
    endOfMonth,
    endOfDay,
    eachWeekOfInterval,
    addDays,
    isToday,
    isPast,
    isWeekend,
    isSameDay
} from 'date-fns';
import {toDate} from 'date-fns-tz';
import {ServiceRecord, tbkCommonF, TimeSlot} from "../../typedefs";

declare const TBK: tbkCommonF;
declare const _: any;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

interface IProps {
    selectedDay: Date | null,
    events: TimeSlot[],
    services: {
        [key: string]: ServiceRecord
    }
    month: number,
    year: number,
    day: number,
    ellipsis: boolean,
    limitNumberOfDots: number,
    oneDotPerService?: boolean,
    viewMode: string

    onDayClick(date: Date | null): any
}

interface IState {
    daysInWeek: number,
    firstDayOfWeek: 0 | 5 | 1 | 2 | 3 | 4 | 6
}

export default class Calendar extends React.Component<IProps, IState> {

    constructor(props: IProps) {

        super(props);
        this.state = {
            daysInWeek    : TBK.hideWeekends ? 5 : 7,
            firstDayOfWeek: TBK.firstDayOfWeek
        }
    }

    toggleSelectedDay = (day: number, month: number, year: number) => {
        const newDate = new Date(year, month, day);
        if (this.props.selectedDay === null || this.props.selectedDay.getTime() !== newDate.getTime()) {
            this.props.onDayClick(newDate);
        } else {
            this.props.onDayClick(null);
        }
    }

    getStyledDayButton = (events: TimeSlot[], label: string | number, dayStyle: any) => {
        const AvailableStyledButton = withStyles({
            root: {
                // @ts-ignore
                background: TBK.UI.theme.TBK.availableColor,
                // @ts-ignore
                color    : TBK.UI.theme.palette.getContrastText(TBK.UI.theme.TBK.availableColor),
                '&:hover': {
                    // @ts-ignore
                    backgroundColor: TBK.UI.theme.TBK.availableColorLight + ' !important'
                }
            }
        })(ButtonBase);

        const BookedStyledButton = withStyles({
            root: {
                // @ts-ignore
                background: TBK.UI.theme.TBK.bookedColor,
                // @ts-ignore
                color    : TBK.UI.theme.palette.getContrastText(TBK.UI.theme.TBK.bookedColor),
                '&:hover': {
                    // @ts-ignore
                    backgroundColor: TBK.UI.theme.TBK.bookedColorLight + ' !important'
                }
            }
        })(ButtonBase);

        let available = false;

        events.some((event) => {
            if (!event.soldOut) {
                available = true;
                return;
            }
        })

        if (available) {
            // @ts-ignore
            return <AvailableStyledButton component={'div'} className={styles.dayButton} style={dayStyle} focusRipple>
                {label}
            </AvailableStyledButton>
        }

        // @ts-ignore
        return <BookedStyledButton component={'div'} className={styles.dayButton} style={dayStyle} focusRipple>
            {label}
        </BookedStyledButton>

    }

    renderMonthly = () => {
        const weekDays: any[] = [];
        for (let j = this.state.firstDayOfWeek; j < 7 + this.state.firstDayOfWeek; j++) {
            if (this.state.daysInWeek === 5 && (j % 7 === 0 || j % 7 === 6)) {
                continue;
            }
            weekDays.push(<div key={j % 7}>{TBK.shortWeekDaysLabels[j % 7]}</div>);
        }

        const currentDate = new Date(this.props.year, this.props.month - 1, this.props.day);

        const dayRows = [],
            firstOfMonth = startOfMonth(currentDate),
            lastOfMonth = endOfMonth(currentDate);

        const weeks = eachWeekOfInterval({
            'start': firstOfMonth,
            'end'  : lastOfMonth
        }, {weekStartsOn: this.state.firstDayOfWeek});

        const mappedEvents: { [key: number]: any } = {};

        for (let event of this.props.events) {
            const start = toDate(event.start);
            if (start.getFullYear() !== this.props.year || start.getMonth() + 1 !== this.props.month) {
                continue; // return??
            }
            if (!Array.isArray(mappedEvents[start.getDate()])) {
                mappedEvents[start.getDate()] = [];
            }
            mappedEvents[start.getDate()].push(event);
        }

        for (const [i, startWeekDay] of weeks.entries()) {

            let rowCue = 1;

            for (let j = 0; j < 7; j++) {

                const currentCueDay = addDays(startWeekDay, j);

                if (this.state.daysInWeek === 5 && isWeekend(currentCueDay)) {
                    continue;
                }

                const content = [];
                const classes = [];

                const dayElementProps = {
                    style    : {gridColumnStart: rowCue, gridRowStart: i + 1},
                    className: '',
                    onClick  : () => {
                        this.toggleSelectedDay(currentCueDay.getDate(), this.props.month - 1, this.props.year);
                    }
                };

                if (currentCueDay.getMonth() !== this.props.month - 1) {
                    classes.push('outside');
                    dayElementProps.onClick = () => {
                        console.log('outside day');
                    }
                } else {
                    let dayStyle = {};
                    if (isPast(endOfDay(currentCueDay))) {
                        classes.push(styles.pastDay);
                        dayElementProps.onClick = () => {
                            console.log('past day');
                        }
                    } else if (isSameDay(currentCueDay, this.props.selectedDay)) {
                        classes.push(styles.selected);
                    } else if (isToday(currentCueDay)) {
                        classes.push(styles.today);
                        dayStyle = {color: TBK.UI.theme.palette.secondary.main}
                    }
                    classes.push(styles.day);

                    content.push(
                        <div className={styles.dayButtonContainer} key={currentCueDay.getDate()}>
                            {Array.isArray(mappedEvents[currentCueDay.getDate()]) && (
                                this.getStyledDayButton(mappedEvents[currentCueDay.getDate()], currentCueDay.getDate(), dayStyle)
                            )}
                            {!Array.isArray(mappedEvents[currentCueDay.getDate()]) && (
                                <ButtonBase component={'div'} className={styles.dayButton} style={dayStyle} focusRipple>
                                    {currentCueDay.getDate()}
                                </ButtonBase>
                            )}
                        </div>
                    );

                    if (Array.isArray(mappedEvents[currentCueDay.getDate()])) {
                        const eventsContainer = [];
                        const serviceOrder = Object.keys(this.props.services);
                        const currentEvents: TimeSlot[] = mappedEvents[currentCueDay.getDate()].sort((a: TimeSlot, b: TimeSlot) => {
                            return serviceOrder.indexOf(a.serviceId) - serviceOrder.indexOf(b.serviceId);
                        });

                        if (this.props.oneDotPerService) {
                            const alreadyDone: string[] = [];
                            for (let event of currentEvents) {
                                if (alreadyDone.indexOf(event.serviceId) === -1) {
                                    alreadyDone.push(event.serviceId);
                                    const itemProps = {
                                        color: this.props.services[event.serviceId].color
                                    };
                                    const itemClasses = [styles.dayEvent];
                                    itemClasses.push(styles.dayEventCompact);
                                    eventsContainer.push(<div key={event.id} className={itemClasses.join(' ')}><CalendarDayItem {...itemProps}/></div>);
                                }
                            }
                        } else if (this.props.ellipsis) {

                            const orderedEvents = [];

                            const groupedcurrentEvents: { [key: string]: TimeSlot[] } = _.groupBy(currentEvents, function (currentItem: TimeSlot) {
                                return [currentItem.serviceId, currentItem];
                            });

                            let j = 0;
                            let counter = orderedEvents.length;

                            while (counter <= this.props.limitNumberOfDots) {
                                let isFulfilled = false;
                                for (const [serviceId, serviceEvents] of Object.entries(groupedcurrentEvents)) {
                                    if (typeof serviceEvents[j] !== 'undefined') {
                                        orderedEvents.push(serviceEvents[j]);
                                        isFulfilled = true;
                                    }
                                }

                                // This makes a guess about how much events are going to be there in the next cycle.
                                counter = orderedEvents.length + Object.entries(groupedcurrentEvents).length;
                                j++;
                                if (!isFulfilled) {
                                    break;
                                }
                                if (j > 100) {
                                    console.log('too many cycles');
                                    break;
                                }
                            }

                            orderedEvents.sort((a, b) => {
                                return a.serviceId.localeCompare(b.serviceId);
                            })

                            orderedEvents.forEach(orderedEvent => {
                                const itemProps = {
                                    color: this.props.services[orderedEvent.serviceId].color
                                };
                                const itemClasses = [styles.dayEvent];
                                itemClasses.push(styles.dayEventCompact);
                                eventsContainer.push(<div key={orderedEvent.id} className={itemClasses.join(' ')}><CalendarDayItem {...itemProps}/></div>);
                            })

                            const leftovers = currentEvents.length - orderedEvents.length;

                            if (leftovers > 0) {
                                const itemProps = {
                                    label: '+' + leftovers
                                };
                                const itemClasses = [styles.dayEvent];
                                itemClasses.push(styles.dayEventCompact);
                                itemClasses.push(styles.dayEventNotInline);
                                eventsContainer.push(<div key={'more'} className={itemClasses.join(' ')}><CalendarDayItem {...itemProps}/></div>);
                            }

                        } else {
                            for (let event of currentEvents) {
                                const itemProps = {
                                    color: this.props.services[event.serviceId].color
                                };
                                const itemClasses = [styles.dayEvent];
                                itemClasses.push(styles.dayEventCompact);
                                eventsContainer.push(<div key={event.id} className={itemClasses.join(' ')}><CalendarDayItem {...itemProps}/></div>);
                            }
                        }
                        content.push(<div key={styles.dayEventsContainer} className={styles.dayEventsContainer}>{eventsContainer}</div>)
                    }
                }

                dayElementProps.className = classes.join(' ');

                const day =
                    <div {...dayElementProps} key={dayRows.length}>
                        {content}
                    </div>
                ;
                dayRows.push(day);
                rowCue++;
            }
        }

        return (
            <div className={styles.calendar}>
                <div className={styles.weekDays + (this.state.daysInWeek === 5 ? ' ' + styles.noWeekends : '')}>
                    {weekDays}
                </div>
                <div className={styles.days + (this.state.daysInWeek === 5 ? ' ' + styles.noWeekends : '')}>
                    {dayRows}
                </div>
            </div>
        );
    }

    render() {
        switch (this.props.viewMode) {
            case 'monthly':
                return this.renderMonthly();
        }
    }

}