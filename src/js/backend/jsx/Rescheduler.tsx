import React from "react";
import {AvailabilityRecord, tbkCommonB, TimeSlot} from "../../typedefs";
import {Calendar} from "primereact/calendar";
import {Dropdown} from "primereact/dropdown";
import {ProgressBar} from 'primereact/progressbar';
import Scheduler from "../../scheduler";
import {endOfMonth, startOfMonth} from "date-fns";
import {toDate} from "date-fns-tz";
import globals from "../../globals";
// @ts-ignore
import styles from './Rescheduler.css';
import {Button} from "primereact/button";

declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

interface RProps {
    serviceId: string,

    onConfirm(date: Date): any,

    date?: Date
}

interface RState {
    currentDate: Date,
    viewDate: Date,
    items: TimeSlot[],
    selectedItem: TimeSlot,
    isBusy: boolean
}

export default class Rescheduler extends React.Component<RProps, RState> {

    private scheduler: Scheduler;

    constructor(props: RProps) {
        super(props);

        const availability: AvailabilityRecord[] = [];

        for (const availabilityRecord of Object.values(tbkCommon.availability) as any) {
            availability.push({
                serviceId        : props.serviceId,
                rrule            : availabilityRecord.rrule,
                uid              : availabilityRecord.uid,
                containerDuration: {
                    minutes: availabilityRecord.duration
                }
            })
        }

        this.scheduler = new Scheduler({
            services     : tbkCommon.services,
            availability : availability,
            reservations : tbkCommon.reservations,
            busyIntervals: tbkCommon.busyIntervals
        })

        this.state = {
            currentDate : props.date || new Date(),
            viewDate    : props.date || new Date(),
            items       : this.parseSlots(props.date || new Date()),
            selectedItem: null,
            isBusy      : false
        }
    }

    parseSlots = (date: Date) => {
        const items = this.scheduler.getItemsBetween(startOfMonth(date), endOfMonth(date));
        return items.filter((item: TimeSlot) => {
            return item.serviceId === this.props.serviceId && !item.soldOut;
        })
    }

    parseDaySlots = () => {
        return this.state.items.filter((item: TimeSlot) => {
            return toDate(item.start).getDate() === this.state.currentDate.getDate();
        })
    }

    dateTemplate = (date: any) => {
        const items = this.state.items.filter((item: TimeSlot) => {
            return toDate(item.start).getDate() === date.day && date.selectable;
        })
        if (items.length) {
            return (
                <span className={styles.dayWithSlots}>
                    <strong>{date.day}</strong>
                </span>
            )

        }
        return date.day;
    }

    optionTemplate = (item: TimeSlot) => {
        return globals.formatTime(toDate(item.start));
    }

    selectedOptionTemplate = (item: TimeSlot, props: any) => {
        if (item) {
            return globals.formatTime(toDate(item.start));
        }
        return (
            <span>
                {props.placeholder}
            </span>
        )
    }

    render() {
        const daySlots = this.parseDaySlots();
        return (
            <div className={'p-d-inline-flex p-ai-center p-flex-column p-p-3'}>
                <Calendar inline
                          disabled={this.state.isBusy}
                          value={this.state.currentDate}
                          viewDate={this.state.viewDate}
                          dateTemplate={this.dateTemplate}
                          onViewDateChange={(e) => {
                              this.setState({
                                  viewDate    : e.value as Date,
                                  items       : this.parseSlots(e.value),
                                  selectedItem: null
                              })
                          }}
                          onChange={(e) => this.setState({
                              currentDate : e.value as Date,
                              selectedItem: null
                          })}
                />
                {this.state.isBusy && (
                    <ProgressBar mode="indeterminate" style={{width: '100%', height: '2px', marginTop: '-2px'}}/>
                )}
                <div className="p-mt-3 p-d-inline-flex" style={{width: '100%'}}>
                    <Dropdown
                        disabled={!daySlots.length || this.state.isBusy}
                        itemTemplate={this.optionTemplate}
                        valueTemplate={this.selectedOptionTemplate}
                        placeholder={daySlots.length ? __('Select a timeslot', 'thebooking') : __('No timeslots available', 'thebooking')}
                        style={{flexGrow: 1}}
                        value={this.state.selectedItem}
                        options={daySlots}
                        optionLabel={'start'}
                        onChange={(e) => {
                            this.setState({selectedItem: e.value})
                        }}
                    />
                    <Button
                        label={__('Confirm', 'thebooking')}
                        className={'p-ml-3'}
                        icon={'pi pi-check'}
                        disabled={!this.state.selectedItem || this.state.isBusy}
                        onClick={() => {
                            this.props.onConfirm(toDate(this.state.selectedItem.start))
                        }}
                    />
                </div>
            </div>
        )
    }

}